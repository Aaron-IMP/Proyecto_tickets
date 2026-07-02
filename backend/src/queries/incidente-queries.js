const pool = require('../config/database');

const crearIncidente = async (personalId, descripcion, ticketUuid = null) => {
  const result = await pool.query(
    `INSERT INTO incidente (personal_id, ticket_uuid, descripcion)
     VALUES ($1, $2, $3)
     RETURNING id, fecha`,
    [personalId, ticketUuid || null, descripcion]
  );
  return result.rows[0];
};

module.exports = { crearIncidente };
