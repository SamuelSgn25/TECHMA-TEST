# Documentation Détaillée - Drive AI

## 📂 Architecture du Projet

L'application est divisée en deux parties principales : le **Client** (Frontend) et le **Server** (Backend).

---

## 🖥️ BACKEND (Node.js & Express)

### `index.js` (Le Cœur du Serveur)
- **Middleware CORS & JSON** : Permet au frontend de communiquer avec le backend de manière sécurisée et de lire les données JSON.
- **Multer** : Configuré pour stocker les fichiers dans le dossier `./uploads`. Il renomme les fichiers avec un timestamp pour éviter les doublons.
- **Routes API** :
  - `/api/files` : Détermine dynamiquement s'il doit afficher les fichiers de Google Drive (si connecté) ou de la base PostgreSQL locale.
  - `/api/ai/chat` : Envoie le prompt et le contexte des fichiers à Gemini.

### `googleDrive.js` (L'interface Google)
- **OAuth2Client** : Utilise les identifiants Google Cloud pour créer un tunnel sécurisé.
- **`listFiles`** : Demande à l'API Google de renvoyer les métadonnées (nom, id, type, lien de vue).
- **`deleteFile`** : Supprime physiquement le fichier sur ton Drive officiel.

### `gemini.js` (L'intelligence Artificielle)
- **Modèle Flash 1.5** : Choisi pour sa rapidité et sa capacité à traiter des vidéos (jusqu'à 1 million de tokens de contexte).
- **`askDriveAI`** : Injecte le contexte du fichier directement dans le système de prompt de Gemini pour qu'il "connaisse" le contenu avant de répondre.

---

## 🎨 FRONTEND (React & Tailwind CSS)

### `App.jsx`
- **Hooks (useState/useEffect)** : Gère l'état de l'application. Le `useEffect` surveille l'URL pour détecter le retour de l'authentification Google et stocker les tokens.

### `DriveExplorer.jsx`
- **Framer Motion** : Les composants `<motion.div>` animent l'apparition et la suppression des fichiers pour un effet "Premium".
- **Responsive Grid** : Utilise `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` pour s'adapter parfaitement à tous les écrans.

### `AIChat.jsx`
- **Interface ChatGPT** : La barre de saisie est une `textarea` qui s'adapte, avec un bouton d'envoi qui change de couleur quand du texte est présent.
- **Bulles de Chat** : Styles personnalisés dans `index.css` pour différencier l'utilisateur de l'IA (Bleu vs Blanc).

---

## 🎨 Design System
- **Couleur 1 (Ardoise)** : `#0f172a` - Utilisée pour le texte pour une lisibilité maximale.
- **Couleur 2 (Indigo)** : `#2563eb` - Utilisée pour les actions principales (Accent).
- **Couleur 3 (Gris Clair)** : `#f8fafc` - Utilisée pour le fond, créant une interface "aérée".
