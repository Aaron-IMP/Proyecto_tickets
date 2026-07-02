import api from './axios-config';

export const listarEventosApi = () =>
  api.get('/api/eventos');

export const obtenerEventoApi = (id) =>
  api.get(`/api/eventos/${id}`);

export const crearEventoApi = (datos) =>
  api.post('/api/eventos', datos);

export const metricasEventoApi = (id) =>
  api.get(`/api/eventos/${id}/metricas`);

export const compradoresEventoApi = (id) =>
  api.get(`/api/eventos/${id}/compradores`);

export const listarEventosAdminApi = () =>
  api.get('/api/eventos/admin');

export const cancelarEventoApi = (id) =>
  api.delete(`/api/eventos/${id}/cancelar`);
