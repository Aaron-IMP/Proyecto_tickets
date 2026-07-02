const pool = require('../config/database');

// Las funciones aceptan un `client` opcional para poder ejecutarse
// dentro de una transacción sin salirse del pool principal.
const crearTicket = async (codigoUuid, usuarioId, categoriaTicketId, client = pool) => {
  const result = await client.query(
    `INSERT INTO ticket (codigo_uuid, usuario_id, categoria_ticket_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [codigoUuid, usuarioId, categoriaTicketId]
  );
  return result.rows[0];
};

// Devuelve el evento (fecha y estado) al que pertenece una categoría de ticket.
// Se usa para impedir comprar entradas de eventos vencidos o cancelados.
const obtenerEventoDeCategoria = async (categoriaTicketId, client = pool) => {
  const result = await client.query(
    `SELECT e.id, e.fecha_hora, e.estado
     FROM categoria_ticket ct
     JOIN evento e ON e.id = ct.evento_id
     WHERE ct.id = $1`,
    [categoriaTicketId]
  );
  return result.rows[0];
};

const decrementarStock = async (categoriaTicketId, client = pool) => {
  const result = await client.query(
    `UPDATE categoria_ticket
     SET stock_disponible = stock_disponible - 1
     WHERE id = $1 AND stock_disponible > 0
     RETURNING stock_disponible`,
    [categoriaTicketId]
  );
  return result.rows[0];
};

const obtenerTicketsPorUsuario = async (usuarioId) => {
  const result = await pool.query(
    `SELECT t.*,
            e.nombre        AS evento_nombre,
            e.nombre_artista,
            e.fecha_hora,
            e.lugar,
            ct.nombre_zona,
            COALESCE(rv.precio_reventa, ct.precio) AS precio
     FROM ticket t
     JOIN categoria_ticket ct ON ct.id = t.categoria_ticket_id
     JOIN evento e            ON e.id  = ct.evento_id
     LEFT JOIN reventa rv     ON rv.ticket_id = t.id
                             AND rv.comprador_id = $1
                             AND rv.estado = 'vendido'
     WHERE t.usuario_id = $1
     ORDER BY t.fecha_emision DESC`,
    [usuarioId]
  );
  return result.rows;
};

const buscarTicketPorUuid = async (codigoUuid) => {
  const result = await pool.query(
    `SELECT t.*,
            u.nombre  AS usuario_nombre,
            u.email   AS usuario_email,
            e.nombre  AS evento_nombre,
            e.nombre_artista,
            e.fecha_hora,
            ct.nombre_zona,
            ct.precio
     FROM ticket t
     JOIN usuario          u  ON u.id  = t.usuario_id
     JOIN categoria_ticket ct ON ct.id = t.categoria_ticket_id
     JOIN evento           e  ON e.id  = ct.evento_id
     WHERE t.codigo_uuid = $1`,
    [codigoUuid]
  );
  return result.rows[0];
};

const marcarComoUsado = async (codigoUuid) => {
  const result = await pool.query(
    `UPDATE ticket SET estado = 'usado'
     WHERE codigo_uuid = $1 AND estado = 'activo'
     RETURNING *`,
    [codigoUuid]
  );
  return result.rows[0];
};

const actualizarSemillaTotp = async (ticketId, semilla, client = pool) => {
  await client.query(
    `UPDATE ticket SET token_totp = $1 WHERE id = $2`,
    [semilla, ticketId]
  );
};

module.exports = {
  crearTicket,
  obtenerEventoDeCategoria,
  decrementarStock,
  obtenerTicketsPorUsuario,
  buscarTicketPorUuid,
  marcarComoUsado,
  actualizarSemillaTotp,
};
