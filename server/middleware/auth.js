const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: "Authentification requise. Veuillez vous reconnecter." });
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_123';
    const verified = jwt.verify(token, secret);
    req.user = verified;
    next();
  } catch (error) {
    console.error("Erreur JWT:", error.message);
    res.status(401).json({ error: "Session expirée ou invalide. Veuillez vous reconnecter." });
  }
};
