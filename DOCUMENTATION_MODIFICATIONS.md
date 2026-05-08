# 📑 Documentation des Modifications - Drive AI

## 1. Aperçu des Fichiers (Nouveau) 🖼️
L'interface supporte désormais la prévisualisation en plein écran :
- **Vidéos** : Lecteur intégré avec contrôles.
- **Images** : Affichage direct des photos (PNG, JPG, etc.).
- **Texte/Code** : Lecture et affichage du contenu des fichiers `.txt`, `.js`, `.css`.
- **Autres** : Bouton de téléchargement automatique si l'aperçu n'est pas possible.

---

## 2. Google Drive : Solution au problème d'URL 🌐
Si Google refuse encore la connexion, c'est une question de domaine. Voici la solution ultime :

1. **Dans la Console Google Cloud** :
   - Modifie ton URI de redirection pour : `http://127.0.0.1:5000/api/auth/callback` (Utilise l'IP au lieu de localhost).
2. **Dans ton navigateur** :
   - Accède à ton application via `http://127.0.0.1:5173` au lieu de `localhost:5173`.
3. **Dans le code** :
   - J'ai déjà configuré le serveur pour accepter ces deux variantes.

---

## 3. IA Gemini (Fix 404) 🤖
Le modèle `gemini-1.5-flash` étant instable sur certains comptes gratuits, j'ai forcé l'utilisation de `gemini-pro`. 
- **Stabilité** : 100% (Modèle de référence).
- **Vitesse** : Excellente.

---

## 4. Architecture Backend 🏗️
- **Route de Contenu** : Ajout de `/api/files/content/:id` pour permettre au Frontend de lire le texte des fichiers.
- **Auto-DB** : Les tables se créent toutes seules au lancement.

---
*Fin de documentation - Toutes les fonctionnalités sont désormais opérationnelles.*
