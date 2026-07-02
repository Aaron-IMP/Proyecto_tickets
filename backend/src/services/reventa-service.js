const {
  buscarTicketPorUuidYUsuario,
  publicarReventa,
  listarReventasPublicadas,
  obtenerReventaPorId,
  misReventasActivas,
  misReventasVendidas,
  comprarReventa,
  cancelarReventa,
} = require('../queries/reventa-queries');

const publicar = async (ticketUuid, vendedorId, precioReventa) => {
  if (!precioReventa || Number(precioReventa) <= 0) {
    throw new Error('PRECIO_INVALIDO');
  }

  const ticket = await buscarTicketPorUuidYUsuario(ticketUuid, vendedorId);

  if (!ticket) throw new Error('TICKET_NO_ENCONTRADO');
  if (ticket.estado !== 'activo') throw new Error('TICKET_NO_ACTIVO');

  return await publicarReventa(ticket.id, vendedorId, precioReventa);
};

const listar = async (eventoId = null) => {
  return await listarReventasPublicadas(eventoId);
};

const obtener = async (id) => {
  const reventa = await obtenerReventaPorId(id);
  if (!reventa) throw new Error('REVENTA_NO_ENCONTRADA');
  return reventa;
};

const misPublicaciones = async (vendedorId) => {
  return await misReventasActivas(vendedorId);
};

const misVentas = async (vendedorId) => {
  return await misReventasVendidas(vendedorId);
};

const comprar = async (reventaId, compradorId) => {
  return await comprarReventa(reventaId, compradorId);
};

const cancelar = async (reventaId, vendedorId) => {
  await cancelarReventa(reventaId, vendedorId);
};

module.exports = { publicar, listar, obtener, misPublicaciones, misVentas, comprar, cancelar };
