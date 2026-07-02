const pagoService = require('../services/pago-service');

/**
 * POST /api/pagos/iniciar
 * ─────────────────────────────────────────────
 * Crea el registro de pago en estado 'pendiente'
 * y lo procesa inmediatamente (simulación síncrona).
 *
 * Body: {
 *   categoriaTicketId : number,
 *   metodo            : 'tarjeta' | 'yape' | 'plin',
 *   // Tarjeta:
 *   numeroTarjeta     : string (16 dígitos, solo se guardan los últimos 4),
 *   nombreTitular     : string,
 *   vencimiento       : string (MM/YY),
 *   cvv               : string,
 *   // Yape / Plin:
 *   telefono          : string,
 * }
 */
const iniciarYProcesar = async (req, res) => {
  try {
    const {
      categoriaTicketId,
      metodo,
      numeroTarjeta,
      telefono,
    } = req.body;

    if (!categoriaTicketId || !metodo) {
      return res.status(400).json({ error: 'categoriaTicketId y metodo son requeridos' });
    }

    const metodosValidos = ['tarjeta', 'yape', 'plin'];
    if (!metodosValidos.includes(metodo)) {
      return res.status(400).json({ error: 'Método de pago inválido' });
    }

    if (metodo === 'tarjeta') {
      const num = (numeroTarjeta || '').replace(/\s/g, '');
      if (num.length !== 16 || !/^\d+$/.test(num)) {
        return res.status(400).json({ error: 'Número de tarjeta inválido' });
      }
    }

    if ((metodo === 'yape' || metodo === 'plin') && !telefono) {
      return res.status(400).json({ error: 'Teléfono requerido para Yape/Plin' });
    }

    // Extraer solo los últimos 4 dígitos (nunca almacenamos el PAN completo)
    const ultimosDigitos = metodo === 'tarjeta'
      ? (numeroTarjeta || '').replace(/\s/g, '').slice(-4)
      : null;

    // Paso 1: crear pago pendiente
    const { referencia } = await pagoService.iniciarPago({
      usuarioId:        req.usuario.id,
      categoriaTicketId,
      metodo,
      ultimosDigitos,
      telefono: metodo !== 'tarjeta' ? telefono : null,
    });

    // Paso 2: procesar inmediatamente (simulación)
    const resultado = await pagoService.procesarPago(referencia);

    return res.status(200).json({
      mensaje:    'Pago aprobado',
      referencia: resultado.referencia,
      ticketUuid: resultado.ticketUuid,
      monto:      resultado.monto,
      metodo:     resultado.metodo,
    });

  } catch (error) {
    if (error.message === 'PAGO_RECHAZADO') {
      return res.status(402).json({
        error:           'Pago rechazado',
        motivo:          error.mensajeBanco || 'La transacción fue rechazada por el banco',
        codigoRespuesta: error.codigoRespuesta,
      });
    }
    if (error.message === 'SIN_STOCK') {
      return res.status(409).json({ error: 'No hay stock disponible para esta zona' });
    }
    if (error.message === 'EVENTO_FINALIZADO') {
      return res.status(409).json({ error: 'El evento ya finalizó; las entradas ya no están disponibles' });
    }
    if (error.message === 'EVENTO_CANCELADO') {
      return res.status(409).json({ error: 'El evento fue cancelado' });
    }
    if (error.message === 'CATEGORIA_NO_ENCONTRADA') {
      return res.status(404).json({ error: 'La zona seleccionada no existe' });
    }
    console.error('[pago-controller] Error inesperado:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * GET /api/pagos/historial
 * Devuelve todos los pagos del usuario autenticado.
 */
const historial = async (req, res) => {
  try {
    const pagos = await pagoService.historialPagos(req.usuario.id);
    return res.status(200).json({ pagos });
  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * GET /api/pagos/:referencia
 * Devuelve el estado de un pago específico (solo el dueño).
 */
const obtenerPago = async (req, res) => {
  try {
    const pago = await pagoService.obtenerEstadoPago(req.params.referencia, req.usuario.id);
    return res.status(200).json({ pago });
  } catch (error) {
    if (error.message === 'PAGO_NO_ENCONTRADO') {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    if (error.message === 'NO_AUTORIZADO') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { iniciarYProcesar, historial, obtenerPago };
