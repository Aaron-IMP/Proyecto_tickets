const pool = require('../config/database');

/**
 * Crea un registro de pago en estado 'pendiente'.
 * Devuelve la fila completa con su UUID de referencia.
 */
const crearPago = async (
  { usuarioId, monto, metodo, ultimosDigitos = null, telefono = null, categoriaTicketId },
  client = pool,
) => {
  const result = await client.query(
    `INSERT INTO pago
       (usuario_id, monto, metodo, ultimos_digitos, telefono, categoria_ticket_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [usuarioId, monto, metodo, ultimosDigitos, telefono, categoriaTicketId],
  );
  return result.rows[0];
};

/**
 * Actualiza el estado de un pago y, opcionalmente, vincula el ticket generado.
 */
const actualizarEstadoPago = async (
  pagoId,
  { estado, ticketId = null },
  client = pool,
) => {
  const result = await client.query(
    `UPDATE pago
     SET estado            = $2,
         ticket_id         = COALESCE($3, ticket_id),
         fecha_resolucion  = NOW()
     WHERE id = $1
     RETURNING *`,
    [pagoId, estado, ticketId],
  );
  return result.rows[0];
};

/**
 * Obtiene un pago por su UUID de referencia pública.
 */
const obtenerPagoPorReferencia = async (referencia, client = pool) => {
  const result = await client.query(
    `SELECT p.*,
            u.nombre  AS usuario_nombre,
            u.email   AS usuario_email,
            e.nombre  AS evento_nombre,
            ct.nombre_zona,
            ct.precio
     FROM pago p
     JOIN usuario          u  ON u.id  = p.usuario_id
     JOIN categoria_ticket ct ON ct.id = p.categoria_ticket_id
     JOIN evento           e  ON e.id  = ct.evento_id
     WHERE p.referencia = $1`,
    [referencia],
  );
  return result.rows[0];
};

/**
 * Lista todos los pagos de un usuario, ordenados del más reciente al más antiguo.
 */
const obtenerPagosPorUsuario = async (usuarioId) => {
  const result = await pool.query(
    `SELECT p.*,
            e.nombre     AS evento_nombre,
            ct.nombre_zona,
            t.codigo_uuid AS ticket_uuid
     FROM pago p
     JOIN categoria_ticket ct ON ct.id = p.categoria_ticket_id
     JOIN evento           e  ON e.id  = ct.evento_id
     LEFT JOIN ticket      t  ON t.id  = p.ticket_id
     WHERE p.usuario_id = $1
     ORDER BY p.fecha_creacion DESC`,
    [usuarioId],
  );
  return result.rows;
};

module.exports = {
  crearPago,
  actualizarEstadoPago,
  obtenerPagoPorReferencia,
  obtenerPagosPorUsuario,
};
