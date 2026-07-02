import api from './axios-config';

export const publicarReventaApi = (ticketUuid, precioReventa) =>
  api.post('/api/reventas/publicar', { ticketUuid, precioReventa });

export const listarReventasApi = (eventoId = null) =>
  api.get('/api/reventas', { params: eventoId ? { eventoId } : {} });

export const misPublicacionesApi = () =>
  api.get('/api/reventas/mis-publicaciones');

export const comprarReventaApi = (id) =>
  api.post(`/api/reventas/${id}/comprar`);

export const cancelarReventaApi = (id) =>
  api.delete(`/api/reventas/${id}/cancelar`);

export const misVentasApi = () =>
  api.get('/api/reventas/mis-ventas');
