const pool = require('../config/database');

const listarTodosEventos = async () => {
  const result = await pool.query(
    `SELECT e.*,
            MIN(ct.precio)           AS precio_desde,
            SUM(ct.stock_disponible) AS stock_total,
            COUNT(ct.id)             AS total_zonas
     FROM evento e
     LEFT JOIN categoria_ticket ct ON ct.evento_id = e.id
     GROUP BY e.id
     ORDER BY e.fecha_hora ASC`
  );
  return result.rows;
};

const cancelarEvento = async (eventoId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const check = await client.query(
      'SELECT estado FROM evento WHERE id = $1',
      [eventoId]
    );

    if (check.rows.length === 0) {
      await client.query('ROLLBACK');
      throw new Error('EVENTO_NO_ENCONTRADO');
    }

    if (check.rows[0].estado !== 'activo') {
      await client.query('ROLLBACK');
      throw new Error('EVENTO_YA_CANCELADO');
    }

    await client.query(
      `UPDATE evento SET estado = 'cancelado' WHERE id = $1`,
      [eventoId]
    );

    const ticketResult = await client.query(
      `UPDATE ticket SET estado = 'reembolsado'
       WHERE categoria_ticket_id IN (
         SELECT id FROM categoria_ticket WHERE evento_id = $1
       ) AND estado = 'activo'`,
      [eventoId]
    );

    await client.query('COMMIT');
    return { tickets_afectados: ticketResult.rowCount };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const listarEventosActivos = async () => {
  const result = await pool.query(
    `SELECT e.*,
            MIN(ct.precio)              AS precio_desde,
            SUM(ct.stock_disponible)    AS stock_total,
            COUNT(ct.id)               AS total_zonas
     FROM evento e
     LEFT JOIN categoria_ticket ct ON ct.evento_id = e.id
     WHERE e.estado = 'activo'
     GROUP BY e.id
     ORDER BY e.fecha_hora ASC`
  );
  return result.rows;
};

const buscarEventoPorId = async (id) => {
  const result = await pool.query(
    'SELECT * FROM evento WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

const obtenerCategoriasPorEvento = async (eventoId) => {
  const result = await pool.query(
    `SELECT * FROM categoria_ticket
     WHERE evento_id = $1
     ORDER BY precio ASC`,
    [eventoId]
  );
  return result.rows;
};

const crearEvento = async (nombre, nombreArtista, fechaHora, lugar, descripcion, bannerUrl, administradorId) => {
  const result = await pool.query(
    `INSERT INTO evento (nombre, nombre_artista, fecha_hora, lugar, descripcion, banner_url, administrador_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [nombre, nombreArtista, fechaHora, lugar, descripcion, bannerUrl, administradorId]
  );
  return result.rows[0];
};

const crearCategoriaTicket = async (eventoId, nombreZona, precio, stockTotal, stockDisponible) => {
  const result = await pool.query(
    `INSERT INTO categoria_ticket (evento_id, nombre_zona, precio, stock_total, stock_disponible)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [eventoId, nombreZona, precio, stockTotal, stockDisponible]
  );
  return result.rows[0];
};

const obtenerMetricasPorEvento = async (eventoId) => {
  const result = await pool.query(
    `SELECT
       ct.nombre_zona,
       ct.precio,
       ct.stock_total,
       (ct.stock_total - ct.stock_disponible) AS vendidos,
       ct.stock_disponible                    AS disponibles,
       ct.precio * (ct.stock_total - ct.stock_disponible) AS recaudacion
     FROM categoria_ticket ct
     WHERE ct.evento_id = $1`,
    [eventoId]
  );
  return result.rows;
};

const obtenerCompradores = async (eventoId) => {
  const result = await pool.query(
    `SELECT
       u.nombre,
       u.email,
       ct.nombre_zona,
       ct.precio,
       t.estado,
       t.fecha_emision
     FROM ticket t
     JOIN usuario u           ON t.usuario_id          = u.id
     JOIN categoria_ticket ct ON t.categoria_ticket_id = ct.id
     WHERE ct.evento_id = $1
     ORDER BY t.fecha_emision DESC
     LIMIT 10`,
    [eventoId]
  );
  return result.rows;
};

module.exports = {
  listarTodosEventos,
  cancelarEvento,
  listarEventosActivos,
  buscarEventoPorId,
  obtenerCategoriasPorEvento,
  crearEvento,
  crearCategoriaTicket,
  obtenerMetricasPorEvento,
  obtenerCompradores,
};
