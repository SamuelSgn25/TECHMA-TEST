const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Fonction pour initialiser les tables automatiquement
const initDb = async () => {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log("✅ DATABASE : Tables initialisées/vérifiées avec succès.");
  } catch (err) {
    console.error("❌ DATABASE INIT ERROR :", err.message);
  }
};

pool.connect((err, client, release) => {
  if (err) {
    return console.error("❌ DATABASE CONNECT ERROR :", err.stack);
  }
  console.log("✅ DATABASE : Connecté à PostgreSQL.");
  initDb(); // On lance l'initialisation après la connexion
  release();
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
