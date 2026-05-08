const { Pool } = require('pg');
require('dotenv').config();

// Configuration segmentée
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.on('connect', () => {
  console.log('PostgreSQL: Connecté avec succès');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
