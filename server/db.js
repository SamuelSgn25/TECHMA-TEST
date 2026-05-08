const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test de connexion immédiat
pool.connect((err, client, release) => {
  if (err) {
    return console.error("❌ ERREUR CRITIQUE DATABASE : Impossible de se connecter à PostgreSQL. Vérifiez votre fichier .env.", err.stack);
  }
  console.log("✅ DATABASE : Connexion établie avec succès.");
  release();
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
