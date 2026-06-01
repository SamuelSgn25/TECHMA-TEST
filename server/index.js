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
const ChatFileProcessor = require('./services/chatFileProcessor');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50gb' }));
app.use(express.urlencoded({ limit: '50gb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log de toutes les requêtes entrantes
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// --- ROUTES API ---

// Routes d'authentification (register, login, reset-password, change-password)
app.use('/api/auth', authRoutes);

// Configuration Multer - Support large files up to 50GB
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user.id;
    const userDir = path.join(__dirname, 'uploads', userId.toString());
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 * 1024 // 50GB
  }
});

// Google Auth URL
app.get('/api/google/auth-url', authMiddleware, (req, res) => {
  res.json({ url: getAuthUrl(req.user.id) });
});

// Callback Google
app.get('/api/auth/callback', async (req, res) => {
  const { code, state: userId } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    const existing = await query('SELECT drive_tokens FROM users WHERE id = $1', [userId]);
    const existingTokens = existing.rows[0]?.drive_tokens || null;

    const savedTokens = existingTokens && !tokens.refresh_token
      ? { ...existingTokens, ...tokens }
      : tokens;

    await query(
      'UPDATE users SET drive_tokens = $1, drive_enabled = true WHERE id = $2',
      [JSON.stringify(savedTokens), userId]
    );

    res.send("<h1>Connexion réussie !</h1><script>setTimeout(() => window.close(), 2000)</script>");
  } catch (error) {
    console.error("Google Callback Error:", error);
    res.status(500).send("Erreur Google Auth");
  }
});

// Disconnect Google Drive
app.post('/api/google/disconnect', authMiddleware, async (req, res) => {
  try {
    await query(
      'UPDATE users SET drive_tokens = NULL, drive_enabled = false WHERE id = $1',
      [req.user.id]
    );
    res.json({ success: true, message: "Google Drive déconnecté" });
  } catch (error) {
    console.error("Google Disconnect Error:", error);
    res.status(500).json({ error: "Erreur lors de la déconnexion" });
  }
});

// Récupérer les fichiers et dossiers
app.get('/api/files', authMiddleware, async (req, res) => {
  const { folderId } = req.query;
  try {
    const user = await query('SELECT drive_enabled, drive_tokens FROM users WHERE id = $1', [req.user.id]);
    if (user.rows.length === 0) return res.status(404).json({ error: "Utilisateur non trouvé" });
    
    const { drive_enabled, drive_tokens } = user.rows[0];

    // Fichiers locaux
    let sql = 'SELECT * FROM local_files WHERE user_id = $1';
    let params = [req.user.id];
    if (folderId && folderId !== 'null') {
      sql += ' AND folder_id = $2';
      params.push(folderId);
    } else {
      sql += ' AND folder_id IS NULL';
    }
    const localFiles = await query(sql, params);

    // Dossiers locaux
    let folderSql = 'SELECT * FROM local_folders WHERE user_id = $1';
    let folderParams = [req.user.id];
    if (folderId && folderId !== 'null') {
      folderSql += ' AND parent_id = $2';
      folderParams.push(folderId);
    } else {
      folderSql += ' AND parent_id IS NULL';
    }
    const folders = await query(folderSql, folderParams);

    let driveFiles = [];
    if (drive_enabled && drive_tokens) {
      try {
        const drive = getDriveService(drive_tokens);
        const df = await listFiles(drive);
        driveFiles = df.map(f => ({ ...f, source: 'drive' }));
      } catch (e) {
        console.error("Drive Fetch Error:", e.message);
        if (e.message.includes('invalid_grant')) {
          await query(
            'UPDATE users SET drive_tokens = NULL, drive_enabled = false WHERE id = $1',
            [req.user.id]
          );
          console.error(`Drive credentials invalid for user ${req.user.id}, cleared Drive connection.`);
        }
      }
    }

    res.json({
      folders: folders.rows,
      files: localFiles.rows,
      driveFiles: driveFiles
    });
  } catch (error) {
    console.error("Fetch Files Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Récupérer le contenu d'un fichier texte
app.get('/api/files/content/:id', authMiddleware, async (req, res) => {
  try {
    const result = await query('SELECT path FROM local_files WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).send("Fichier non trouvé");
    const fullPath = path.join(__dirname, result.rows[0].path);
    const content = fs.readFileSync(fullPath, 'utf8');
    res.send(content);
  } catch (error) {
    res.status(500).send("Erreur lors de la lecture du fichier");
  }
});

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

app.post('/api/files/upload', authMiddleware, upload.single('file'), async (req, res) => {
  const { filename, mimetype, size } = req.file;
  const { folderId } = req.body;
  const relativePath = `uploads/${req.user.id}/${filename}`;
  try {
    const result = await query(
      'INSERT INTO local_files (user_id, name, type, size, path, folder_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, filename, mimetype, size, relativePath, folderId && folderId !== 'null' ? folderId : null]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/chat', authMiddleware, upload.single('file'), async (req, res) => {
  const { prompt, history } = req.body;
  let fileContext = null;

  try {
    // If file is uploaded, extract content
    if (req.file) {
      const { filename, mimetype, path: filePath } = req.file;

      try {
        const extraction = await ChatFileProcessor.extractContent(filePath, mimetype, filename);

        fileContext = {
          name: filename,
          type: mimetype,
          size: req.file.size,
          content: extraction.content,
          metadata: extraction.metadata
        };

        console.log(`✅ File content extracted successfully`);
      } catch (extractionError) {
        console.error('File extraction error:', extractionError.message);
        // Don't fail the request, just note the error
        fileContext = {
          name: filename,
          type: mimetype,
          size: req.file.size,
          content: `[File could not be processed: ${extractionError.message}]`,
          metadata: { error: extractionError.message }
        };
      }
    }

    const parsedHistory = typeof history === 'string' ? JSON.parse(history) : (history || []);
    const response = await askDriveAI(prompt, parsedHistory, fileContext);
    res.json({ response: response.response || response });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 SERVEUR : Opérationnel sur http://localhost:${PORT}`);
});
