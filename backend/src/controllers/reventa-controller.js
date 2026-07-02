const reventaService = require('../services/reventa-service');

const ERRORES = {
  PRECIO_INVALIDO:       [400, 'El precio debe ser mayor a 0'],
  TICKET_NO_ENCONTRADO:  [404, 'Ticket no encontrado o no te pertenece'],
  TICKET_NO_ACTIVO:      [400, 'El ticket debe estar activo para publicarlo'],
  REVENTA_NO_ENCONTRADA: [404, 'Reventa no encontrada'],
  REVENTA_NO_DISPONIBLE: [400, 'Esta reventa ya no está disponible'],
  COMPRADOR_ES_VENDEDOR: [400, 'No puedes comprar tu propia publicación'],
  NO_AUTORIZADO:         [403, 'Solo el vendedor puede cancelar esta publicación'],
  REVENTA_NO_CANCELABLE: [400, 'Esta reventa no se puede cancelar'],
};

const manejarError = (res, error) => {
  const [status, msg] = ERRORES[error.message] || [500, 'Error interno del servidor'];
  return res.status(status).json({ error: msg });
};

const publicar = async (req, res) => {
  try {
    const { ticketUuid, precioReventa } = req.body;
    if (!ticketUuid || !precioReventa) {
      return res.status(400).json({ error: 'ticketUuid y precioReventa son requeridos' });
    }
    const reventa = await reventaService.publicar(ticketUuid, req.usuario.id, precioReventa);
    return res.status(201).json({ reventa });
  } catch (error) {
    return manejarError(res, error);
  }
};

const listar = async (req, res) => {
  try {
    const eventoId = req.query.eventoId || null;
    const reventas = await reventaService.listar(eventoId);
    return res.status(200).json({ reventas });
  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const obtener = async (req, res) => {
  try {
    const reventa = await reventaService.obtener(req.params.id);
    return res.status(200).json({ reventa });
  } catch (error) {
    return manejarError(res, error);
  }
};

const misPublicaciones = async (req, res) => {
  try {
    const reventas = await reventaService.misPublicaciones(req.usuario.id);
    return res.status(200).json({ reventas });
  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const misVentas = async (req, res) => {
  try {
    const ventas = await reventaService.misVentas(req.usuario.id);
    return res.status(200).json({ ventas });
  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const comprar = async (req, res) => {
  try {
    const ticket = await reventaService.comprar(req.params.id, req.usuario.id);
    return res.status(200).json({ mensaje: 'Ticket adquirido', ticket });
  } catch (error) {
    return manejarError(res, error);
  }
};

const cancelar = async (req, res) => {
  try {
    await reventaService.cancelar(req.params.id, req.usuario.id);
    return res.status(200).json({ mensaje: 'Publicación cancelada' });
  } catch (error) {
    return manejarError(res, error);
  }
};

module.exports = { publicar, listar, obtener, misPublicaciones, misVentas, comprar, cancelar };
