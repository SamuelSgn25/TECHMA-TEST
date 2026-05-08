# Drive AI - Assistant Intelligent & Gestionnaire de Fichiers

Drive AI est une application full-stack permettant de gérer ses fichiers (locaux ou via Google Drive) et d'interagir avec eux grâce à une intelligence artificielle puissante (Gemini).

## ✨ Fonctionnalités
- **Intégration Google Drive** : Connectez votre Drive, listez vos dossiers, ajoutez ou supprimez des fichiers.
- **Mode Local** : Gérez vos fichiers sur votre machine si Drive n'est pas activé.
- **Drive AI** : Posez des questions sur vos documents, votre code ou même vos vidéos (analyse multimodale).
- **Design Premium** : Interface épurée inspirée des meilleurs outils SaaS modernes.

## 🚀 Installation

### 1. Prérequis
- Node.js installé
- PostgreSQL installé
- Un compte Google Cloud (pour l'API Drive)
- Une clé API Gemini (gratuite sur Google AI Studio)

### 2. Backend
```bash
cd server
npm install
# Créez votre fichier .env basé sur .env.example
npm run dev
```

### 3. Frontend
```bash
cd client
npm install
npm run dev
```

## 📝 Licence
MIT
