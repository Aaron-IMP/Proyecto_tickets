const speakeasy = require('speakeasy');
const pool = require('../config/database');

const _nuevaSemilla = () => speakeasy.generateSecret({ length: 20 }).base32;

const buscarTicketPorUuidYUsuario = async (codigoUuid, usuarioId) => {
  const result = await pool.query(
    `SELECT t.id, t.codigo_uuid, t.estado, ct.precio AS precio_original
     FROM ticket t
     JOIN categoria_ticket ct ON t.categoria_ticket_id = ct.id
     WHERE t.codigo_uuid = $1 AND t.usuario_id = $2`,
    [codigoUuid, usuarioId]
  );
  return result.rows[0];
};

// Publicar en reventa en una sola transacción.
// Usa UPSERT para tolerar registros huérfanos de intentos previos fallidos.
const publicarReventa = async (ticketId, vendedorId, precioReventa) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // UPSERT: si existe un registro previo para este ticket (huérfano de
    // un intento fallido o de una publicación cancelada), lo reutiliza.
    const result = await client.query(
      `INSERT INTO reventa (ticket_id, vendedor_id, precio_reventa, estado, fecha_publicacion, comprador_id, fecha_venta)
       VALUES ($1, $2, $3, 'publicado', NOW(), NULL, NULL)
       ON CONFLICT (ticket_id) DO UPDATE
         SET vendedor_id       = EXCLUDED.vendedor_id,
             precio_reventa    = EXCLUDED.precio_reventa,
             estado            = 'publicado',
             fecha_publicacion = NOW(),
             comprador_id      = NULL,
             fecha_venta       = NULL
       RETURNING *`,
      [ticketId, vendedorId, precioReventa]
    );

    // Cast explícito ::estado_ticket requerido porque pg envía el string
    // como tipo text (OID 25) y PostgreSQL no lo castea implícitamente a enum.
    await client.query(
      `UPDATE ticket SET estado = 'en_reventa' WHERE id = $1`,
      [ticketId]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const listarReventasPublicadas = async (eventoId = null) => {
  const params = [];
  let filtroEvento = '';
  if (eventoId) {
    params.push(eventoId);
    filtroEvento = `AND ct.evento_id = $${params.length}`;
  }

  const result = await pool.query(
    `SELECT
       r.id,
       r.precio_reventa,
       r.vendedor_id,
       r.fecha_publicacion,
       t.codigo_uuid,
       ct.nombre_zona,
       ct.precio        AS precio_original,
       e.id             AS evento_id,
       e.nombre         AS evento_nombre,
       e.nombre_artista,
       e.fecha_hora,
       e.lugar,
       e.banner_url,
       u.nombre         AS vendedor_nombre
     FROM reventa r
     JOIN ticket          t  ON r.ticket_id          = t.id
     JOIN categoria_ticket ct ON t.categoria_ticket_id = ct.id
     JOIN evento           e  ON ct.evento_id          = e.id
     JOIN usuario          u  ON r.vendedor_id         = u.id
     WHERE r.estado = 'publicado' ${filtroEvento}
     ORDER BY r.fecha_publicacion DESC`,
    params
  );
  return result.rows;
};

const obtenerReventaPorId = async (id) => {
  const result = await pool.query(
    `SELECT
       r.*,
       r.vendedor_id,
       t.codigo_uuid,
       ct.nombre_zona,
       ct.precio        AS precio_original,
       ct.evento_id,
       e.nombre         AS evento_nombre,
       e.nombre_artista,
       e.fecha_hora,
       e.lugar,
       e.banner_url,
       u.nombre         AS vendedor_nombre
     FROM reventa r
     JOIN ticket          t  ON r.ticket_id          = t.id
     JOIN categoria_ticket ct ON t.categoria_ticket_id = ct.id
     JOIN evento           e  ON ct.evento_id          = e.id
     JOIN usuario          u  ON r.vendedor_id         = u.id
     WHERE r.id = $1`,
    [id]
  );
  return result.rows[0];
};

const misReventasActivas = async (vendedorId) => {
  const result = await pool.query(
    `SELECT r.id, r.ticket_id, r.precio_reventa
     FROM reventa r
     WHERE r.vendedor_id = $1 AND r.estado = 'publicado'`,
    [vendedorId]
  );
  return result.rows;
};

const misReventasVendidas = async (vendedorId) => {
  const result = await pool.query(
    `SELECT
       r.id,
       r.ticket_id,
       r.precio_reventa,
       r.fecha_venta,
       ct.nombre_zona,
       e.nombre        AS evento_nombre,
       e.nombre_artista,
       e.fecha_hora,
       e.lugar
     FROM reventa r
     JOIN ticket          t  ON r.ticket_id = t.id
     JOIN categoria_ticket ct ON t.categoria_ticket_id = ct.id
     JOIN evento          e  ON ct.evento_id = e.id
     WHERE r.vendedor_id = $1 AND r.estado = 'vendido'
     ORDER BY r.fecha_venta DESC`,
    [vendedorId]
  );
  return result.rows;
};

const comprarReventa = async (reventaId, compradorId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const reventaResult = await client.query(
      `SELECT r.*, r.vendedor_id, t.id AS ticket_id
       FROM reventa r
       JOIN ticket t ON r.ticket_id = t.id
       WHERE r.id = $1
       FOR UPDATE`,
      [reventaId]
    );

    if (reventaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      throw new Error('REVENTA_NO_ENCONTRADA');
    }

    const reventa = reventaResult.rows[0];

    if (reventa.estado !== 'publicado') {
      await client.query('ROLLBACK');
      throw new Error('REVENTA_NO_DISPONIBLE');
    }

    if (reventa.vendedor_id === compradorId) {
      await client.query('ROLLBACK');
      throw new Error('COMPRADOR_ES_VENDEDOR');
    }

    await client.query(
      `UPDATE reventa
       SET estado = 'vendido', comprador_id = $1, fecha_venta = NOW()
       WHERE id = $2`,
      [compradorId, reventaId]
    );

    await client.query(
      `UPDATE ticket SET usuario_id = $1, estado = 'activo' WHERE id = $2`,
      [compradorId, reventa.ticket_id]
    );

    // Invalidar el QR del vendedor anterior asignando nueva semilla al comprador
    const nuevaSemilla = _nuevaSemilla();
    await client.query(
      `UPDATE ticket SET token_totp = $1 WHERE id = $2`,
      [nuevaSemilla, reventa.ticket_id]
    );

    await client.query('COMMIT');
    return { ticket_id: reventa.ticket_id, usuario_id: compradorId };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const cancelarReventa = async (reventaId, vendedorId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const reventaResult = await client.query(
      `SELECT * FROM reventa WHERE id = $1 FOR UPDATE`,
      [reventaId]
    );

    if (reventaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      throw new Error('REVENTA_NO_ENCONTRADA');
    }

    const reventa = reventaResult.rows[0];

    if (reventa.vendedor_id !== vendedorId) {
      await client.query('ROLLBACK');
      throw new Error('NO_AUTORIZADO');
    }

    if (reventa.estado !== 'publicado') {
      await client.query('ROLLBACK');
      throw new Error('REVENTA_NO_CANCELABLE');
    }

    await client.query(
      `UPDATE reventa SET estado = 'cancelado' WHERE id = $1`,
      [reventaId]
    );

    await client.query(
      `UPDATE ticket SET estado = 'activo' WHERE id = $1`,
      [reventa.ticket_id]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  buscarTicketPorUuidYUsuario,
  publicarReventa,
  listarReventasPublicadas,
  obtenerReventaPorId,
  misReventasActivas,
  misReventasVendidas,
  comprarReventa,
  cancelarReventa,
};
