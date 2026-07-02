/**
 * pago-service.js
 * ─────────────────────────────────────────────────────────────────────
 * Pasarela de pagos SIMULADA.
 *
 * Reglas de simulación:
 *  • Tarjeta que termina en 0000          → siempre RECHAZADA  (fondos insuficientes)
 *  • Tarjeta que termina en 1111          → siempre RECHAZADA  (tarjeta expirada)
 *  • Cualquier otra tarjeta               → APROBADA
 *  • Yape / Plin                          → siempre APROBADO   (pago instantáneo)
 *
 * El servicio introduce un delay simulado (800 ms) para imitar la
 * latencia real de una pasarela externa.
 * ─────────────────────────────────────────────────────────────────────
 */

const { v4: uuidv4 } = require('uuid');
const speakeasy = require('speakeasy');
const pool = require('../config/database');

const {
  crearPago,
  actualizarEstadoPago,
  obtenerPagoPorReferencia,
  obtenerPagosPorUsuario,
} = require('../queries/pago-queries');

const {
  obtenerEventoDeCategoria,
  decrementarStock,
  crearTicket,
  actualizarSemillaTotp,
  buscarTicketPorUuid,
} = require('../queries/ticket-queries');

const { sendEmail }           = require('../config/mailer');
const { confirmacionCompra }  = require('../utils/email-templates');

/* ── delay simulado ──────────────────────────────────────────────── */
const simDelay = (ms = 900) => new Promise(r => setTimeout(r, ms));

/* ── lógica interna del "banco simulado" ─────────────────────────── */
function _simularRespuestaBanco({ metodo, ultimosDigitos }) {
  if (metodo === 'yape' || metodo === 'plin') {
    return { aprobado: true, codigoRespuesta: '00', mensaje: 'Pago aprobado' };
  }
  // Tarjeta
  if (ultimosDigitos === '0000') {
    return { aprobado: false, codigoRespuesta: '51', mensaje: 'Fondos insuficientes' };
  }
  if (ultimosDigitos === '1111') {
    return { aprobado: false, codigoRespuesta: '54', mensaje: 'Tarjeta expirada' };
  }
  return { aprobado: true, codigoRespuesta: '00', mensaje: 'Pago aprobado' };
}

/* ── generador de semilla TOTP (igual que ticket-service) ─────────── */
const _generarSemilla = () => speakeasy.generateSecret({ length: 20 }).base32;

/* ══════════════════════════════════════════════════════════════════════
   iniciarPago
   ─────────────────────────────────────────────────────────────────────
   1. Valida que el evento y la categoría existan y estén disponibles.
   2. Crea un registro de pago en estado 'pendiente'.
   3. Devuelve la referencia UUID al frontend para que la muestre
      en el loading/modal de procesamiento.
══════════════════════════════════════════════════════════════════════ */
const iniciarPago = async ({
  usuarioId,
  categoriaTicketId,
  metodo,
  ultimosDigitos,
  telefono,
}) => {
  // Validar evento
  const evento = await obtenerEventoDeCategoria(categoriaTicketId);
  if (!evento)                                   throw new Error('CATEGORIA_NO_ENCONTRADA');
  if (evento.estado === 'cancelado')             throw new Error('EVENTO_CANCELADO');
  if (new Date(evento.fecha_hora) < new Date())  throw new Error('EVENTO_FINALIZADO');

  // Obtener precio desde la BD
  const catResult = await pool.query(
    'SELECT precio FROM categoria_ticket WHERE id = $1',
    [categoriaTicketId],
  );
  if (!catResult.rows[0]) throw new Error('CATEGORIA_NO_ENCONTRADA');
  const monto = catResult.rows[0].precio;

  // Crear pago pendiente
  const pago = await crearPago({
    usuarioId,
    monto,
    metodo,
    ultimosDigitos: ultimosDigitos || null,
    telefono:       telefono       || null,
    categoriaTicketId,
  });

  return {
    referencia:   pago.referencia,
    monto:        pago.monto,
    estado:       pago.estado,    // 'pendiente'
  };
};

/* ══════════════════════════════════════════════════════════════════════
   procesarPago
   ─────────────────────────────────────────────────────────────────────
   Llamado inmediatamente después de iniciarPago (en el mismo request
   o en un segundo paso según el frontend).
   1. Simula la llamada al banco (delay + lógica de simulación).
   2. Si se aprueba: decrementa stock, crea ticket, asigna semilla TOTP.
   3. Actualiza el registro de pago con estado final + ticket_id.
   4. Dispara el correo de confirmación (fire-and-forget).
══════════════════════════════════════════════════════════════════════ */
const procesarPago = async (referencia) => {
  const pago = await obtenerPagoPorReferencia(referencia);
  if (!pago)                     throw new Error('PAGO_NO_ENCONTRADO');
  if (pago.estado !== 'pendiente') throw new Error('PAGO_YA_PROCESADO');

  // Simulación de latencia bancaria
  await simDelay(900);

  const respuesta = _simularRespuestaBanco({
    metodo:          pago.metodo,
    ultimosDigitos:  pago.ultimos_digitos,
  });

  if (!respuesta.aprobado) {
    await actualizarEstadoPago(pago.id, { estado: 'rechazado' });
    const error = new Error('PAGO_RECHAZADO');
    error.codigoRespuesta = respuesta.codigoRespuesta;
    error.mensajeBanco    = respuesta.mensaje;
    throw error;
  }

  // ── Pago aprobado: crear ticket en transacción ─────────────────────
  const client = await pool.connect();
  let ticket;
  try {
    await client.query('BEGIN');

    const stockOk = await decrementarStock(pago.categoria_ticket_id, client);
    if (!stockOk) {
      await client.query('ROLLBACK');
      // Marcar pago como rechazado por sin stock
      await actualizarEstadoPago(pago.id, { estado: 'rechazado' });
      throw new Error('SIN_STOCK');
    }

    const codigoUuid = uuidv4();
    ticket = await crearTicket(codigoUuid, pago.usuario_id, pago.categoria_ticket_id, client);

    const semilla = _generarSemilla();
    await actualizarSemillaTotp(ticket.id, semilla, client);

    await actualizarEstadoPago(pago.id, { estado: 'aprobado', ticketId: ticket.id }, client);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // Fire-and-forget: correo de confirmación
  buscarTicketPorUuid(ticket.codigo_uuid).then(datos => {
    if (!datos) return;
    const tpl = confirmacionCompra(
      datos.usuario_nombre,
      datos.evento_nombre,
      datos.nombre_zona,
      datos.precio,
      datos.codigo_uuid,
    );
    return sendEmail({ to: datos.usuario_email, ...tpl });
  }).catch(err => console.error('[pago-service] Error correo:', err));

  return {
    estado:       'aprobado',
    referencia,
    ticketUuid:   ticket.codigo_uuid,
    monto:        pago.monto,
    metodo:       pago.metodo,
  };
};

/* ══════════════════════════════════════════════════════════════════════
   obtenerEstadoPago  —  GET /api/pagos/:referencia
══════════════════════════════════════════════════════════════════════ */
const obtenerEstadoPago = async (referencia, usuarioId) => {
  const pago = await obtenerPagoPorReferencia(referencia);
  if (!pago)                           throw new Error('PAGO_NO_ENCONTRADO');
  if (pago.usuario_id !== usuarioId)   throw new Error('NO_AUTORIZADO');
  return pago;
};

/* ══════════════════════════════════════════════════════════════════════
   historialPagos  —  GET /api/pagos/historial
══════════════════════════════════════════════════════════════════════ */
const historialPagos = async (usuarioId) => {
  return await obtenerPagosPorUsuario(usuarioId);
};

module.exports = { iniciarPago, procesarPago, obtenerEstadoPago, historialPagos };
