const pool = require('../config/database');

const insertarUsuario = async (nombre, email, contrasenaHash) => {
  const result = await pool.query(
    `INSERT INTO usuario (nombre, email, contrasena_hash)
     VALUES ($1, $2, $3)
     RETURNING id, nombre, email, rol, fecha_registro`,
    [nombre, email, contrasenaHash]
  );
  return result.rows[0];
};

const buscarPorEmail = async (email) => {
  const result = await pool.query(
    'SELECT * FROM usuario WHERE email = $1',
    [email]
  );
  return result.rows[0];
};

const buscarPorId = async (id) => {
  const result = await pool.query(
    'SELECT id, nombre, email, rol FROM usuario WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

const buscarHashPorId = async (id) => {
  const result = await pool.query(
    'SELECT contrasena_hash FROM usuario WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

const actualizarContrasena = async (id, contrasenaHash) => {
  await pool.query(
    'UPDATE usuario SET contrasena_hash = $1 WHERE id = $2',
    [contrasenaHash, id]
  );
};

module.exports = { insertarUsuario, buscarPorEmail, buscarPorId, buscarHashPorId, actualizarContrasena };
