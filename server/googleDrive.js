const { google } = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Générer l'URL d'authentification
const getAuthUrl = (userId) => {
  const scopes = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file'
  ];
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: userId.toString(), // On passe l'ID utilisateur ici
  });
};

// Obtenir le service Drive avec un token spécifique
const getDriveService = (tokens) => {
  oauth2Client.setCredentials(tokens);
  return google.drive({ version: 'v3', auth: oauth2Client });
};

// Lister les fichiers et dossiers
const listFiles = async (drive) => {
  const response = await drive.files.list({
    pageSize: 50,
    fields: 'files(id, name, mimeType, size, webViewLink, thumbnailLink)',
    q: "trashed = false", // Ne pas afficher les fichiers supprimés
  });
  return response.data.files;
};

// Créer un dossier
const createFolder = async (drive, folderName) => {
  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  const file = await drive.files.create({
    resource: fileMetadata,
    fields: 'id',
  });
  return file.data.id;
};

// Supprimer un fichier/dossier
const deleteFile = async (drive, fileId) => {
  await drive.files.delete({ fileId });
  return { success: true };
};

module.exports = {
  getAuthUrl,
  getDriveService,
  listFiles,
  createFolder,
  deleteFile,
  oauth2Client
};
