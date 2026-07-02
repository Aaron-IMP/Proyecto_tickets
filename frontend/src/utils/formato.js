import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea un número como moneda peruana.
 * Ej: 180 → "S/ 180.00"
 */
export const formatearPrecio = (monto) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(Number(monto) || 0);

/**
 * Formatea una fecha ISO en español, formato largo.
 * Ej: "2026-11-15T20:00:00" → "Sábado 15 de noviembre, 2026 · 8:00 PM"
 */
export const formatearFecha = (fecha) => {
  const texto = format(new Date(fecha), "EEEE d 'de' MMMM, yyyy · h:mm a", {
    locale: es,
  });
  // date-fns devuelve el día y el meridiano en minúsculas ("sábado", "p. m.").
  const capitalizado = texto.charAt(0).toUpperCase() + texto.slice(1);
  return capitalizado
    .replace(/\s*a\.?\s*m\.?\s*$/i, ' AM')
    .replace(/\s*p\.?\s*m\.?\s*$/i, ' PM');
};
