# 🚀 TECHMA-TEST v2.0 - Démarrage Rapide

## ⚡ Avant de Commencer (Lire d'abord!)

Vous avez reçu une **erreur pgvector** lors de l'application du schéma. C'est normal et facile à corriger.

### 🔴 Erreur Rencontrée
```
ERROR:  extension "vector" is not available
ERROR:  syntax error at or near "("
```

### 🟢 Raisons
1. **pgvector non installé** sur votre système PostgreSQL
2. **Ancien schéma** utilisait syntaxe MySQL (invalide en PostgreSQL)

### ✅ Solution (5 minutes)

```bash
# 1. Installer pgvector
sudo apt-get update
sudo apt-get install postgresql-16-pgvector

# 2. Redémarrer PostgreSQL
sudo systemctl restart postgresql

# 3. Utiliser le NOUVEAU schéma corrigé
psql -U postgres -h localhost -d drive_ai -f server/schema_enhanced_fixed.sql

# 4. Vérifier succès
psql -U postgres -h localhost -d drive_ai -c "\dt"
```

**Résultat attendu:**
```
List of relations
Schema |        Name         | Type  | Owner
-------+---------------------+-------+--------
public | file_analytics      | table | postgres
public | file_embeddings     | table | postgres
public | videos              | table | postgres
public | video_transcripts   | table | postgres
... (10 tables total)
```

---

## 📚 Documentation Fournie

Vous avez maintenant **10 documents complets:**

### 📖 Guides Essentiels (LIRE D'ABORD)
| Document | Utilité |
|----------|---------|
| **GUIDE_COMPLET_FR.md** | ⭐ Tout en français - START HERE |
| **PGVECTOR_SETUP.md** | Fix erreur pgvector |
| **STRATEGIC_IMPROVEMENTS.md** | Architecture complète |

### 🛠️ Guides Techniques
| Document | Utilité |
|----------|---------|
| **IMPLEMENTATION_ROADMAP.md** | Plan 8 phases détaillé |
| **INSTALLATION_GUIDE.md** | Setup complet (EN + commandes) |
| **API_DOCUMENTATION.md** | Tous endpoints + exemples |
| **OPEN_SOURCE_TOOLS_GUIDE.md** | Comparaison 20+ outils |

### 💻 Code Prêt à Utiliser
| Fichier | Lignes | Rôle |
|---------|--------|------|
| `videoProcessor.js` | 239 | Traitement vidéo + FFmpeg |
| `transcriber.js` | 264 | Transcription Whisper |
| `embeddingService.js` | 252 | Recherche sémantique |
| `fileProcessor.js` | 315 | PDF, Images, JSON |
| `enhancedAI.js` | 410 | Chat IA avec contexte (RAG) |
| `schema_enhanced_fixed.sql` | 380 | Base de données (CORRIGÉ) |

---

## 🎯 Prochaines Étapes (Ordre Exact)

### Jour 1: Configuration Base de Données (30 min)

```bash
# 1. Installer pgvector
sudo apt-get install postgresql-16-pgvector
sudo systemctl restart postgresql

# 2. Appliquer schéma CORRIGÉ
cd ~/TECHMA-TEST
psql -U postgres -h localhost -d drive_ai -f server/schema_enhanced_fixed.sql

# 3. Vérifier
psql -U postgres -h localhost -d drive_ai -c "\dt"
psql -U postgres -h localhost -d drive_ai -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
# Doit afficher: 10 (10 tables)
```

### Jour 1-2: Installation Dépendances (1 heure)

```bash
# 1. Installer FFmpeg
sudo apt-get install ffmpeg
ffmpeg -version  # Vérifier

# 2. Installer Whisper (Python)
pip install openai-whisper
whisper --version  # Vérifier

# 3. Installer Redis
sudo apt-get install redis-server
redis-server &
redis-cli ping  # Doit répondre: PONG

# 4. Node packages backend
cd ~/TECHMA-TEST/server
npm install -f

# 5. Node packages frontend
cd ../client
npm install
```

### Jour 2: Configuration & Démarrage (30 min)

```bash
# 1. Créer .env backend (IMPORTANT!)
cd ~/TECHMA-TEST/server
cp .env.example .env

# 2. Éditer .env avec vos paramètres:
# - PORT=5000
# - DB_PASSWORD=votre_password
# - GEMINI_API_KEY=votre_clé
# - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

nano .env  # Éditer

# 3. Démarrer les services (3 terminaux)

# Terminal 1: Redis
redis-server

# Terminal 2: Backend
cd ~/TECHMA-TEST/server
npm run dev
# Doit afficher: ✅ Server running on port 5000

# Terminal 3: Frontend
cd ~/TECHMA-TEST/client
npm run dev
# Doit afficher: ➜  Local:   http://localhost:5173/
```

### Jour 3+: Tests & Amélioration

```bash
# 1. Tester upload simple (< 100MB)
# - Visiter http://localhost:5173
# - Upload fichier test

# 2. Tester AI Chat
# - Poser question sur fichier uploadé
# - Vérifier réponse

# 3. Tester Recherche Sémantique
# - Chercher terme
# - Vérifier résultats pertinents

# 4. Tester Transcription (vidéo)
# - Upload vidéo MP4 (petit fichier d'abord)
# - Attendre transcription
# - Vérifier transcript
```

---

## 📊 Tableau de Bord Progression

Après configuration complète, vous devriez avoir:

### ✅ Base de Données
```
☑ 10 tables créées
☑ 20+ indexes créés
☑ Triggers updated_at actifs
☑ Extensions pgvector, uuid-ossp actives
☑ Vues pour requêtes communes créées
```

### ✅ Services Installés
```
☑ PostgreSQL 16 + pgvector
☑ Redis running
☑ FFmpeg installé
☑ Whisper installé
☑ Node packages installés
```

### ✅ Application Démarre
```
☑ Backend http://localhost:5000
☑ Frontend http://localhost:5173
☑ Logs sans erreurs
☑ API health check: curl http://localhost:5000/api/health
```

### ✅ Fonctionnalités Actives
```
☑ Upload fichiers
☑ Chat IA marche
☑ Google Drive sync (si configuré)
☑ Traitement fond avec Bull
```

---

## 🆘 Troubleshooting Rapide

### ❌ pgvector non trouvé
```bash
# Solution:
sudo apt-get install postgresql-16-pgvector
sudo systemctl restart postgresql
```

### ❌ Backend ne démarre pas
```bash
# Vérifier:
psql -U postgres -h localhost -c "SELECT 1"  # DB connection
redis-cli ping  # Redis running
npm install  # Dependencies ok
```

### ❌ Video ne transcrit pas
```bash
# Vérifier Whisper:
whisper --version
whisper test_video.mp4 --model base
```

### ❌ Recherche lente
```bash
# Problème: Indexes manquants
psql -U postgres -d drive_ai -f server/schema_enhanced_fixed.sql
# Réappliquer schéma avec indexes
```

---

## 💡 Tips & Bonnes Pratiques

### 🎥 Tester Whisper
```bash
# Télécharger video test
curl -o test.mp4 "https://example.com/short_video.mp4"

# Transcrire en local
whisper test.mp4 --model base --language auto

# Résultat: test.json avec transcription
```

### 🔍 Vérifier Embeddings
```bash
# PostgreSQL query
psql -U postgres -d drive_ai

SELECT COUNT(*) FROM file_embeddings;  # Doit croître
SELECT COUNT(*) FROM file_embeddings WHERE user_id = 1;  # Tester user
```

### 📊 Monitorer Bull Jobs
```bash
# Dans application:
const queue = new Bull('transcription', {
  redis: { host: 'localhost', port: 6379 }
});

queue.on('progress', (job) => {
  console.log(`Job ${job.id}: ${job.progress()}%`);
});

// Ou Redis CLI:
redis-cli
> LLEN bull:transcription:waiting
> LLEN bull:transcription:active
```

### 🐳 Utiliser Docker (Optionnel)
```bash
# Pour PostgreSQL + pgvector:
docker run -d \
  --name postgres-pgvector \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  pgvector/pgvector:pg16

# Pour Redis:
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:latest
```

---

## 📈 Prochaines Phases

### Phase 1: Upload Reprise (Semaine 1-2)
Implémenter endpoint Tus pour uploads 50GB+

```javascript
// server/routes/upload.js
const tus = require('@tus/server');
const upload = new tus.Server({
  path: '/api/upload',
  datastore: new FileStore({ directory: './uploads/chunks' })
});
```

### Phase 2: Transcription Parallèle (Semaine 2-3)
Worker Bull traite 5 segments Whisper en parallèle

```javascript
// server/jobs/transcription.js
transcriptionQueue.process(5, async (job) => {
  return await TranscriptionService.transcribeFile(job.data.filePath);
});
```

### Phase 3: Recherche Sémantique (Semaine 3-4)
Embeddings vectoriels avec recherche cosine

```sql
-- Recherche similaire
SELECT content FROM file_embeddings
ORDER BY embedding <-> query_embedding
LIMIT 5;
```

### Phase 4: Chat RAG (Semaine 4-5)
IA utilise fichiers comme contexte

```javascript
// Prompt augmenté
"Contexte: [passages pertinents des fichiers]
Question: [question utilisateur]"
```

---

## 🎓 Ressources pour Apprendre

### FFmpeg
- https://ffmpeg.org/
- `ffmpeg -h full` dans terminal

### Whisper
- https://github.com/openai/whisper
- Modèles: tiny, base, small, medium, large

### PostgreSQL
- https://www.postgresql.org/docs/16/
- pgvector: https://github.com/pgvector/pgvector

### Bull Job Queue
- https://docs.bullmq.io/
- Excellent pour traitement asynchrone

### Gemini API
- https://ai.google.dev/
- Modèles: gemini-2.0-flash

---

## ✅ Checklist Final

Avant de déclarer "prêt":

- [ ] pgvector installé et testé
- [ ] Schéma appliqué sans erreurs (10 tables)
- [ ] PostgreSQL accessible: `psql -U postgres -h localhost`
- [ ] Redis démarre: `redis-server`
- [ ] FFmpeg installé: `ffmpeg -version`
- [ ] Whisper installé: `whisper --version`
- [ ] Backend démarre: `npm run dev` (port 5000)
- [ ] Frontend démarre: `npm run dev` (port 5173)
- [ ] Pas d'erreurs dans les logs
- [ ] Vous pouvez uploader un fichier test
- [ ] Vous pouvez poser une question à l'IA

---

## 🎉 Succès!

Une fois checklist complète, vous avez:
- ✅ Système capable gérer 50GB+ vidéos
- ✅ Transcription automatique
- ✅ Recherche sémantique
- ✅ Chat IA avec contexte fichiers
- ✅ Intégration Google Drive
- ✅ Traitement asynchrone fiable

**Prêt à implémenter les 8 phases détaillées dans IMPLEMENTATION_ROADMAP.md!**

---

**Questions?** Consultez:
- `GUIDE_COMPLET_FR.md` - Guide complet en français
- `PGVECTOR_SETUP.md` - Erreurs installation
- `INSTALLATION_GUIDE.md` - Setup détaillé

**Bonne chance! 🚀**
