import api from './axios-config';

export const reportarIncidenteApi = (descripcion, ticketUuid = null) =>
  api.post('/api/incidentes', { descripcion, ticketUuid });
