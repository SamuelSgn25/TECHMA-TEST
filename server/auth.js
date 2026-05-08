const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('./db');
const authMiddleware = require('./middleware/auth');
const router = express.Router();

// --- INSCRIPTION ---
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
    console.error("Register Error:", error);
    res.status(500).json({ error: "L'utilisateur ou l'email existe déjà." });
  }
});

// --- CONNEXION ---
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: "Utilisateur non trouvé." });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Mot de passe incorrect." });

    const secret = process.env.JWT_SECRET || 'fallback_secret_123';
    const token = jwt.sign({ id: user.id }, secret, { expiresIn: '24h' });
    
    res.json({ 
      token, 
      user: { id: user.id, username: user.username, email: user.email, drive_enabled: user.drive_enabled } 
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Erreur lors de la connexion." });
  }
});

// --- RÉINITIALISATION (Depuis Login) ---
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const result = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Email non trouvé." });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
    
    res.json({ success: true, message: "Mot de passe réinitialisé." });
  } catch (error) {
    console.error("Reset Error:", error);
    res.status(500).json({ error: "Erreur lors de la réinitialisation." });
  }
});

// --- CHANGEMENT (Depuis Paramètres) ---
router.put('/change-password', authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const userResult = await query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(401).json({ error: "Ancien mot de passe incorrect." });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.user.id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error("Change Error:", error);
    res.status(500).json({ error: "Erreur lors du changement." });
  }
});

// --- MISE À JOUR DU PROFIL ---
router.put('/profile', authMiddleware, async (req, res) => {
  const { username, email } = req.body;
  try {
    const result = await query(
      'UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING id, username, email',
      [username, email, req.user.id]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du profil." });
  }
});

module.exports = router;
