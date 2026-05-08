# 📑 Documentation des Modifications - Drive AI

Ce document détaille l'ensemble des travaux réalisés pour transformer le projet **Drive AI** en une application full-stack robuste, sécurisée et dotée d'une intelligence artificielle avancée.

---

## 1. Architecture & Base de Données 🗄️

### Automatisation
Le système gère désormais lui-même sa structure. Au lancement du serveur, le fichier `db.js` vérifie l'existence des tables et les crée si nécessaire via `schema.sql`.
- **Tables créées** : `users` (comptes), `local_folders` (structure), `local_files` (données).

---

## 2. Authentification & Profil 🔐

### Sécurité Avancée
- **JWT (JSON Web Token)** : Toutes les données sont protégées. Un utilisateur ne peut voir que ses propres fichiers.
- **Bcrypt** : Les mots de passe sont cryptés avant d'être enregistrés.
- **Réinitialisation** : Un mode "Mot de passe oublié" a été ajouté sur l'écran de connexion.

### Gestion du Profil
- Les utilisateurs peuvent modifier leur **nom d'utilisateur** et leur **email** dans l'onglet Paramètres.
- Ajout d'une icône d'œil sur tous les champs de mot de passe pour améliorer l'expérience utilisateur.

---

## 3. Gestion de Fichiers & Navigation 📂

### Navigation Intuitive
- **Dossiers** : Support complet de la création de dossiers et de la navigation par double-clic.
- **Breadcrumbs** : Un fil d'Ariane permet de savoir exactement où l'on se trouve et de revenir en arrière facilement.
- **Aperçu** : Lecteur vidéo intégré et téléchargement direct pour les autres types de fichiers.

### Google Drive
- **OAuth2** : Connexion simplifiée avec sauvegarde automatique des accès.
- **Correction Redirect URI** : L'URL est fixée à `http://localhost:5000/api/auth/callback` pour éviter les erreurs de politique Google.

---

## 4. Drive AI : L'Assistant Intelligent 🤖

### Design ChatGPT
L'interface a été entièrement repensée pour offrir la même simplicité que ChatGPT :
- **Chat centré** : Plus lisible et moderne.
- **Contextualisation** : L'utilisateur peut sélectionner un fichier local ou Drive, et l'IA (Gemini) répondra en tenant compte du contenu de ce fichier.

### Moteur Gemini
- Utilisation du modèle `gemini-pro` pour une stabilité maximale.
- Nettoyage automatique de l'historique pour garantir des réponses fluides et sans erreurs de protocole.

---

## 🛠️ Maintenance & Déploiement

- **Variables d'environnement** : Toutes les clés (DB, Google, Gemini, JWT) sont centralisées dans le `.env`.
- **Git** : Des fichiers `.gitignore` ont été ajoutés pour protéger tes secrets lors d'un push vers GitHub.

---
*Projet Drive AI - Version 1.0 - Mai 2026*
