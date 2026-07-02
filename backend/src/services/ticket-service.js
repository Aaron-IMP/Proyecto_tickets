const { v4: uuidv4 } = require('uuid');
const speakeasy = require('speakeasy');
const pool = require('../config/database');
const {
  crearTicket,
  obtenerEventoDeCategoria,
  decrementarStock,
  obtenerTicketsPorUsuario,
  buscarTicketPorUuid,
  marcarComoUsado,
  actualizarSemillaTotp,
} = require('../queries/ticket-queries');
const { sendEmail } = require('../config/mailer');
const { confirmacionCompra } = require('../utils/email-templates');

const TOTP_OPTS = { encoding: 'base32', step: 30 };

const _generarSemilla = () =>
  speakeasy.generateSecret({ length: 20 }).base32;

const _generarToken = (semilla) =>
  speakeasy.totp({ secret: semilla, ...TOTP_OPTS });

const _verificarToken = (token, semilla) =>
  speakeasy.totp.verify({ secret: semilla, token, window: 0, ...TOTP_OPTS });

/* ─── comprarTicket ───────────────────────────────
   Crea el ticket dentro de una transacción y le asigna
   una semilla TOTP única. La semilla nunca se expone al cliente.
───────────────────────────────────────────────── */
const comprarTicket = async (usuarioId, categoriaTicketId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // No se pueden comprar entradas de un evento vencido o cancelado.
    const evento = await obtenerEventoDeCategoria(categoriaTicketId, client);
    if (!evento) throw new Error('CATEGORIA_NO_ENCONTRADA');
    if (evento.estado === 'cancelado') throw new Error('EVENTO_CANCELADO');
    if (new Date(evento.fecha_hora) < new Date()) throw new Error('EVENTO_FINALIZADO');

    const stockResultado = await decrementarStock(categoriaTicketId, client);
    if (!stockResultado) throw new Error('SIN_STOCK');

    const codigoUuid = uuidv4();
    const ticket = await crearTicket(codigoUuid, usuarioId, categoriaTicketId, client);

    const semilla = _generarSemilla();
    await actualizarSemillaTotp(ticket.id, semilla, client);

    await client.query('COMMIT');

    // Nunca exponer token_totp al cliente
    const { token_totp, ...ticketPublico } = ticket;

    // Fire-and-forget: fetch full ticket data for email (includes usuario email, evento, zona, precio)
    buscarTicketPorUuid(codigoUuid).then(datos => {
      if (!datos) return;
      const tpl = confirmacionCompra(
        datos.usuario_nombre,
        datos.evento_nombre,
        datos.nombre_zona,
        datos.precio,
        datos.codigo_uuid,
      );
      return sendEmail({ to: datos.usuario_email, ...tpl });
    }).catch(err => console.error('Error correo compra:', err));

    return ticketPublico;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/* ─── obtenerMisTickets ───────────────────────── */
const obtenerMisTickets = async (usuarioId) => {
  return await obtenerTicketsPorUsuario(usuarioId);
};

/* ─── obtenerToken ────────────────────────────────
   Endpoint GET /tickets/:uuid/token
   Devuelve el token TOTP actual + segundos restantes.
   Solo el dueño actual puede llamarlo.
   La semilla (token_totp) nunca sale de este servicio.
───────────────────────────────────────────────── */
const obtenerToken = async (codigoUuid, usuarioId) => {
  const ticket = await buscarTicketPorUuid(codigoUuid);

  if (!ticket) throw new Error('TICKET_NO_ENCONTRADO');
  if (ticket.usuario_id !== usuarioId) throw new Error('NO_AUTORIZADO');
  if (ticket.estado !== 'activo') throw new Error('TICKET_NO_ACTIVO');

  // Asignar semilla on-the-fly para tickets creados antes del TOTP
  let semilla = ticket.token_totp;
  if (!semilla) {
    semilla = _generarSemilla();
    await actualizarSemillaTotp(ticket.id, semilla);
  }

  const token = _generarToken(semilla);
  const segundosRestantes = 30 - (Math.floor(Date.now() / 1000) % 30);

  return { token, segundosRestantes, uuid: ticket.codigo_uuid };
};

/* ─── validarTicket ───────────────────────────────
   Recibe codigoQR con formato "UUID:TOKEN".
   Verifica TOTP antes de marcar el ticket como usado.
───────────────────────────────────────────────── */
const validarTicket = async (codigoQR) => {
  const separador = codigoQR.indexOf(':');
  if (separador === -1) throw new Error('TICKET_NO_ENCONTRADO');

  const uuid = codigoQR.slice(0, separador);
  const tokenRecibido = codigoQR.slice(separador + 1);

  const ticket = await buscarTicketPorUuid(uuid);

  if (!ticket) throw new Error('TICKET_NO_ENCONTRADO');
  if (ticket.estado === 'usado') throw new Error('TICKET_YA_USADO');
  if (ticket.estado !== 'activo') throw new Error('TICKET_INVALIDO');

  if (!ticket.token_totp || !_verificarToken(tokenRecibido, ticket.token_totp)) {
    throw new Error('TOKEN_INVALIDO');
  }

  await marcarComoUsado(uuid);

  const { token_totp, ...ticketPublico } = ticket;
  return { valido: true, ticket: ticketPublico, mensaje: 'Acceso permitido' };
};

module.exports = { comprarTicket, obtenerMisTickets, obtenerToken, validarTicket };
