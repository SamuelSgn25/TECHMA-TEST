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

// Configuration Multer pour les uploads locaux
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = `./uploads/${req.user.id}`;
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// --- ROUTES PROTÉGÉES (Nécessitent une connexion) ---

// Récupérer les dossiers locaux
app.get('/api/folders', authMiddleware, async (req, res) => {
  try {
    const result = await query('SELECT * FROM local_folders WHERE user_id = $1', [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer un dossier (Local ou Drive)
app.post('/api/folders', authMiddleware, async (req, res) => {
  const { name, parentId, isDrive } = req.body;
  try {
    if (isDrive) {
      const user = await query('SELECT drive_tokens FROM users WHERE id = $1', [req.user.id]);
      const drive = getDriveService(user.rows[0].drive_tokens);
      const folderId = await createFolder(drive, name);
      return res.json({ id: folderId, name, isDrive: true });
    }

    const result = await query(
      'INSERT INTO local_folders (user_id, name, parent_id) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, name, parentId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload de fichier local
app.post('/api/files/upload', authMiddleware, upload.single('file'), async (req, res) => {
  const { filename, mimetype, size, path: filePath } = req.file;
  const { folderId } = req.body;
  try {
    const result = await query(
      'INSERT INTO local_files (user_id, name, type, size, path, folder_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, filename, mimetype, size, filePath, folderId || null]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer tous les fichiers (Drive ou Locaux)
app.get('/api/files', authMiddleware, async (req, res) => {
  try {
    const user = await query('SELECT drive_enabled, drive_tokens FROM users WHERE id = $1', [req.user.id]);
    const { drive_enabled, drive_tokens } = user.rows[0];

    let files = [];
    if (drive_enabled && drive_tokens) {
      const drive = getDriveService(drive_tokens);
      const driveFiles = await listFiles(drive);
      files = [...driveFiles.map(f => ({ ...f, source: 'drive' }))];
    }
    
    const localFiles = await query('SELECT * FROM local_files WHERE user_id = $1', [req.user.id]);
    files = [...files, ...localFiles.rows.map(f => ({ ...f, source: 'local' }))];
    
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- GOOGLE DRIVE AUTH FLOW ---

app.get('/api/google/auth-url', authMiddleware, (req, res) => {
  res.json({ url: getAuthUrl() });
});

app.get('/api/auth/callback', async (req, res) => {
  const { code, state } = req.query; // 'state' peut contenir l'ID utilisateur si passé au début
  try {
    const { tokens } = await oauth2Client.getToken(code);
    // Note: Pour cet exemple, on suppose que l'utilisateur est identifié via un paramètre ou session
    // Dans une version de production, on utiliserait le 'state' pour faire le lien
    res.send("Authentification réussie ! Vous pouvez fermer cette fenêtre. (Veuillez mettre à jour manuellement dans la DB pour l'instant)");
  } catch (error) {
    res.status(500).send("Erreur Google Auth");
  }
});

app.listen(PORT, () => {
  console.log(`Serveur Drive AI sécurisé démarré sur http://localhost:${PORT}`);
});
