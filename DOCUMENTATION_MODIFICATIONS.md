# 📑 Documentation Complète - Drive AI v1.0

## Vue d'ensemble
Drive AI est une application full-stack permettant de gérer des fichiers locaux et Google Drive, avec un assistant IA intégré (Gemini).

---

## 1. Architecture Technique 🏗️

### Stack
| Couche | Technologies |
|--------|-------------|
| Frontend | React, Vite, Axios, Framer Motion, Lucide Icons |
| Backend | Node.js, Express, Multer, JWT, Bcrypt |
| Base de données | PostgreSQL |
| IA | Google Gemini API (REST direct via Axios) |
| Cloud | Google Drive API (OAuth2) |
| CI/CD | GitHub Actions |

### Structure du projet
```
TECHMA-TEST/
├── .github/workflows/ci.yml    # Pipeline CI/CD
├── client/                      # Frontend React (Vite)
│   └── src/
│       ├── App.jsx              # Point d'entrée + Paramètres
│       └── components/
│           ├── DriveExplorer.jsx # Gestion fichiers + Aperçu universel
│           ├── AIChat.jsx       # Assistant IA style ChatGPT
│           ├── Login.jsx        # Authentification + Reset password
│           └── Sidebar.jsx      # Navigation latérale
├── server/                      # Backend Express
│   ├── index.js                 # Routes API principales
│   ├── auth.js                  # Routes authentification
│   ├── db.js                    # Connexion PostgreSQL + auto-init
│   ├── gemini.js                # Intégration Gemini (API REST)
│   ├── googleDrive.js           # Intégration Google Drive
│   ├── schema.sql               # Schéma de base de données
│   └── middleware/auth.js       # Middleware JWT
├── LICENSE                      # Licence MIT
└── DOCUMENTATION_MODIFICATIONS.md
```

---

## 2. Base de Données (Auto-initialisée) 🗄️

Au démarrage, `db.js` exécute automatiquement `schema.sql`. Les tables sont créées dans le bon ordre :

1. **users** → Comptes utilisateurs + tokens Drive
2. **local_folders** → Hiérarchie de dossiers (auto-référence `parent_id`)
3. **local_files** → Fichiers uploadés (référence `folder_id`)
4. **chat_history** → Historique des conversations IA

---

## 3. Authentification & Sécurité 🔐

### Routes disponibles
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion (retourne JWT) |
| POST | `/api/auth/reset-password` | Réinitialisation mot de passe |
| PUT | `/api/auth/change-password` | Changement mot de passe (protégé) |
| PUT | `/api/auth/profile` | Mise à jour profil (protégé) |

### Sécurité
- **JWT** : Token valide 24h, vérifié par `middleware/auth.js`
- **Bcrypt** : Mots de passe hachés (10 rounds)
- **Icône œil** : Visibilité du mot de passe sur tous les formulaires

---

## 4. Aperçu Universel des Fichiers 👁️

Le composant `DriveExplorer.jsx` détecte automatiquement le type de fichier par MIME type ET extension :

| Type | Extensions | Aperçu |
|------|-----------|--------|
| 🎬 Vidéo | mp4, webm, mov, avi... | Lecteur vidéo intégré |
| 🎵 Audio | mp3, wav, flac, m4a... | Lecteur audio avec artwork |
| 🖼️ Image | png, jpg, gif, webp, svg... | Affichage plein écran |
| 📄 PDF | pdf | Iframe intégrée |
| 📝 Texte/Code | txt, js, py, json, css, html, md, sql... | Affichage mono avec scroll |
| 📦 Autre | zip, exe, etc. | Bouton de téléchargement |

---

## 5. Assistant IA (Gemini) 🤖

### Fonctionnement
Le fichier `gemini.js` appelle directement l'API REST Google au lieu d'utiliser la bibliothèque npm (plus fiable).

Il essaie automatiquement 4 modèles dans l'ordre :
1. `gemini-2.0-flash`
2. `gemini-1.5-flash`
3. `gemini-1.5-pro`
4. `gemini-pro`

### Contextualisation
L'utilisateur peut sélectionner un fichier avant de poser sa question. Le nom du fichier est injecté dans le prompt.

---

## 6. Google Drive (OAuth2) 🌐

### Configuration requise dans Google Cloud Console
1. Créer un projet sur https://console.cloud.google.com
2. Activer l'API **Google Drive**
3. Créer un **ID client OAuth 2.0** (type: Application Web)
4. Ajouter l'URI de redirection : `http://localhost:5000/api/auth/callback`
5. **IMPORTANT** : Dans "Écran de consentement OAuth" :
   - Ajouter votre email dans la section **"Utilisateurs tests"**
   - Ou publier l'application si elle est prête pour la production

### Résolution de l'erreur 403: access_denied
Cette erreur signifie que l'application est en mode **"Test"** et que votre email n'est pas listé comme utilisateur test.

**Solution** :
1. Allez dans **API et Services** > **Écran de consentement OAuth**
2. Descendez jusqu'à **"Utilisateurs tests"**
3. Cliquez **"Ajouter des utilisateurs"**
4. Entrez votre adresse Gmail
5. Enregistrez et réessayez

---

## 7. CI/CD (GitHub Actions) ⚙️

Le fichier `.github/workflows/ci.yml` exécute automatiquement à chaque push :

### Job `server`
- Démarre un service PostgreSQL
- Installe les dépendances
- Initialise la base de données avec `schema.sql`
- Vérifie que le serveur démarre correctement

### Job `client`
- Installe les dépendances
- Build la version de production du frontend

---

## 8. Variables d'Environnement (.env) 🔑

### server/.env
```env
PORT=5000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=drive_ai
DB_PASSWORD=votre_mot_de_passe
DB_PORT=5432
GOOGLE_CLIENT_ID=votre_client_id
GOOGLE_CLIENT_SECRET=votre_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/callback
GEMINI_API_KEY=votre_cle_gemini
JWT_SECRET=votre_secret_jwt
```

---

## 9. Lancement 🚀

```bash
# Terminal 1 - Backend
cd server
npm install
npm run dev    # Utilise nodemon pour le hot-reload

# Terminal 2 - Frontend
cd client
npm install
npm run dev    # Vite sur http://localhost:5173
```

---
*Drive AI v1.0 - Mai 2026*
