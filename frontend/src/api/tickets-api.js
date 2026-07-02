import api from './axios-config';

export const comprarTicketApi = (categoriaTicketId) =>
  api.post('/api/tickets/comprar', { categoriaTicketId });

export const misTicketsApi = () =>
  api.get('/api/tickets/mis-tickets');

// Obtiene el token TOTP actual para mostrar el QR dinámico.
// Solo el dueño del ticket puede llamarlo.
export const obtenerTokenApi = (uuid) =>
  api.get(`/api/tickets/${uuid}/token`);

// Valida el QR. codigoQR tiene formato "UUID:TOKEN" (TOTP de 6 dígitos).
export const validarTicketApi = (codigoQR) =>
  api.post('/api/tickets/validar', { codigoQR });
