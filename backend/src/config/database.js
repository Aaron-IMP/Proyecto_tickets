require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log(`Base de datos conectada — ${result.rows[0].now}`);
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error.message);
    process.exit(1);
  }
};

module.exports = pool;
module.exports.testConnection = testConnection;
