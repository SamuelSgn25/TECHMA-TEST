const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('./db');
const router = express.Router();

// Inscription
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "L'utilisateur ou l'email existe déjà." });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: "Utilisateur non trouvé." });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Mot de passe incorrect." });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'fallback_secret_123', { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, drive_enabled: user.drive_enabled } });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la connexion." });
  }
});

// Changement de mot de passe (Sécurisé)
const authMiddleware = require('./middleware/auth');
router.put('/change-password', authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const userResult = await query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(401).json({ error: "L'ancien mot de passe est incorrect." });

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password = $1 WHERE id = $2', [hashedNewPassword, req.user.id]);
    
    res.json({ success: true, message: "Mot de passe mis à jour avec succès." });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors du changement de mot de passe." });
  }
});

module.exports = router;
