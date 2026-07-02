import api from './axios-config';

/**
 * Inicia y procesa un pago en un solo paso.
 *
 * @param {Object} datos
 * @param {number}  datos.categoriaTicketId
 * @param {string}  datos.metodo              - 'tarjeta' | 'yape' | 'plin'
 * // Tarjeta:
 * @param {string}  [datos.numeroTarjeta]     - 16 dígitos sin espacios
 * @param {string}  [datos.nombreTitular]
 * @param {string}  [datos.vencimiento]       - MM/YY
 * @param {string}  [datos.cvv]
 * // Yape / Plin:
 * @param {string}  [datos.telefono]
 *
 * @returns {Promise<{ referencia, ticketUuid, monto, metodo }>}
 */
export const procesarPagoApi = (datos) =>
  api.post('/api/pagos/iniciar', datos);

/**
 * Obtiene el historial de pagos del usuario autenticado.
 * @returns {Promise<{ pagos: Pago[] }>}
 */
export const historialPagosApi = () =>
  api.get('/api/pagos/historial');

/**
 * Consulta el estado de un pago por su referencia UUID.
 * @param {string} referencia
 * @returns {Promise<{ pago: Pago }>}
 */
export const obtenerPagoApi = (referencia) =>
  api.get(`/api/pagos/${referencia}`);
