const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { query } = require('./db');
const authRoutes = require('./auth');
const authMiddleware = require('./middleware/auth');
const { getAuthUrl, oauth2Client, getDriveService, listFiles, createFolder, deleteFile } = require('./googleDrive');
const { askDriveAI } = require('./gemini');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes publiques
app.use('/api/auth', authRoutes);

// Configuration Multer corrigée
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // On récupère l'ID depuis le token décodé par authMiddleware
    const userId = req.user.id;
    const userDir = path.join(__dirname, 'uploads', userId.toString());
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// --- ROUTES PROTÉGÉES ---

// Google Auth URL
app.get('/api/google/auth-url', authMiddleware, (req, res) => {
  res.json({ url: getAuthUrl(req.user.id) });
});

// Callback Google (Public mais gère le state)
app.get('/api/auth/callback', async (req, res) => {
  const { code, state: userId } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    // Sauvegarder les tokens pour cet utilisateur
    await query(
      'UPDATE users SET drive_tokens = $1, drive_enabled = true WHERE id = $2',
      [JSON.stringify(tokens), userId]
    );
    res.send("<h1>Connexion réussie !</h1><p>Vous pouvez fermer cet onglet et rafraîchir l'application.</p><script>setTimeout(() => window.close(), 3000)</script>");
  } catch (error) {
    res.status(500).send("Erreur d'authentification Google");
  }
});

// Récupérer les fichiers et dossiers (filtrés par folderId)
app.get('/api/files', authMiddleware, async (req, res) => {
  const { folderId } = req.query;
  try {
    const user = await query('SELECT drive_enabled, drive_tokens FROM users WHERE id = $1', [req.user.id]);
    const { drive_enabled, drive_tokens } = user.rows[0];

    // Fichiers locaux
    let sql = 'SELECT * FROM local_files WHERE user_id = $1';
    let params = [req.user.id];
    if (folderId && folderId !== 'root') {
      sql += ' AND folder_id = $2';
      params.push(folderId);
    } else {
      sql += ' AND folder_id IS NULL';
    }
    const localFiles = await query(sql, params);

    // Dossiers locaux
    let folderSql = 'SELECT * FROM local_folders WHERE user_id = $1';
    let folderParams = [req.user.id];
    if (folderId && folderId !== 'root') {
      folderSql += ' AND parent_id = $2';
      folderParams.push(folderId);
    } else {
      folderSql += ' AND parent_id IS NULL';
    }
    const folders = await query(folderSql, folderParams);

    // Google Drive (simplifié : on affiche tout pour l'instant)
    let driveFiles = [];
    if (drive_enabled && drive_tokens) {
      const drive = getDriveService(drive_tokens);
      driveFiles = await listFiles(drive);
    }

    res.json({
      folders: folders.rows,
      files: localFiles.rows,
      driveFiles: driveFiles.map(f => ({ ...f, source: 'drive' }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer un dossier
app.post('/api/folders', authMiddleware, async (req, res) => {
  const { name, parentId } = req.body;
  try {
    const result = await query(
      'INSERT INTO local_folders (user_id, name, parent_id) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, name, parentId || null]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload local (On s'assure que authMiddleware est passé)
app.post('/api/files/upload', authMiddleware, upload.single('file'), async (req, res) => {
  const { filename, mimetype, size } = req.file;
  const { folderId } = req.body;
  const relativePath = `uploads/${req.user.id}/${filename}`;
  try {
    const result = await query(
      'INSERT INTO local_files (user_id, name, type, size, path, folder_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, filename, mimetype, size, relativePath, folderId && folderId !== 'undefined' ? folderId : null]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route Drive AI
app.post('/api/ai/chat', authMiddleware, async (req, res) => {
  const { prompt, history, fileContext } = req.body;
  try {
    const response = await askDriveAI(prompt, history, fileContext);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur Drive AI opérationnel sur http://localhost:${PORT}`);
});
