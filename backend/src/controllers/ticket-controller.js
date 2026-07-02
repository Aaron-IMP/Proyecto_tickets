const ticketService = require('../services/ticket-service');

const comprar = async (req, res) => {
  try {
    const { categoriaTicketId } = req.body;
    if (!categoriaTicketId) {
      return res.status(400).json({ error: 'categoriaTicketId es requerido' });
    }
    const ticket = await ticketService.comprarTicket(req.usuario.id, categoriaTicketId);
    return res.status(201).json({ mensaje: 'Ticket comprado', ticket });
  } catch (error) {
    if (error.message === 'SIN_STOCK') {
      return res.status(409).json({ error: 'No hay stock disponible' });
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
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const misTickets = async (req, res) => {
  try {
    const tickets = await ticketService.obtenerMisTickets(req.usuario.id);
    return res.status(200).json({ tickets });
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* GET /api/tickets/:uuid/token
   Solo el dueño del ticket puede obtener el token TOTP actual.
   Nunca se expone la semilla, solo el token calculado. */
const obtenerToken = async (req, res) => {
  try {
    const resultado = await ticketService.obtenerToken(req.params.uuid, req.usuario.id);
    return res.status(200).json(resultado);
  } catch (error) {
    if (error.message === 'TICKET_NO_ENCONTRADO') {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }
    if (error.message === 'NO_AUTORIZADO') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    if (error.message === 'TICKET_NO_ACTIVO') {
      return res.status(400).json({ error: 'El ticket no está activo' });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* POST /api/tickets/validar
   Recibe codigoQR = "UUID:TOKEN".
   Verifica TOTP y marca el ticket como usado si es válido. */
const validar = async (req, res) => {
  try {
    const { codigoQR } = req.body;
    if (!codigoQR) {
      return res.status(400).json({ error: 'codigoQR es requerido' });
    }
    const resultado = await ticketService.validarTicket(codigoQR);
    return res.status(200).json({
      valido: true,
      ticket: resultado.ticket,
      mensaje: 'Acceso permitido ✓',
    });
  } catch (error) {
    if (error.message === 'TICKET_NO_ENCONTRADO') {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }
    if (error.message === 'TICKET_YA_USADO') {
      return res.status(409).json({ error: 'Este ticket ya fue usado' });
    }
    if (error.message === 'TOKEN_INVALIDO') {
      // 400, no 401, para no disparar el interceptor de axios que hace logout
      return res.status(400).json({ error: 'QR inválido o expirado' });
    }
    if (error.message === 'TICKET_INVALIDO') {
      return res.status(400).json({ error: 'Ticket inválido' });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { comprar, misTickets, obtenerToken, validar };
