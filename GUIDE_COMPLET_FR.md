# TECHMA-TEST v2.0 : Guide Complet en Français

## 📋 Table des Matières

1. [Problèmes Rencontrés & Solutions](#problèmes-rencontrés--solutions)
2. [Architecture & Objectifs](#architecture--objectifs)
3. [Outils & Technologies](#outils--technologies)
4. [Feuille de Route Implémentation](#feuille-de-route-implémentation)
5. [Prochaines Étapes](#prochaines-étapes)

---

## 🆘 Problèmes Rencontrés & Solutions

### Erreur 1: Extension pgvector Non Disponible

**Message d'erreur:**
```
ERROR:  extension "vector" is not available
Could not open extension control file "/usr/share/postgresql/16/extension/vector.control"
```

**Cause:** pgvector n'est pas installé sur votre système PostgreSQL.

**Solution:**
```bash
# Installer pgvector pour PostgreSQL 16
sudo apt-get update
sudo apt-get install postgresql-16-pgvector

# Ou si version différente:
# sudo apt-get install postgresql-15-pgvector
# sudo apt-get install postgresql-14-pgvector

# Redémarrer PostgreSQL
sudo systemctl restart postgresql
```

### Erreur 2: Erreur de Syntaxe dans INDEX

**Message d'erreur:**
```
ERROR:  syntax error at or near "("
LINE 18:   INDEX (user_id),
                 ^
```

**Cause:** Le schéma utilisait la syntaxe MySQL (INDEX inline) qui ne fonctionne pas en PostgreSQL.

**Solution:** Utilisez le schéma corrigé `schema_enhanced_fixed.sql`:
```bash
# Utiliser le bon fichier:
psql -U postgres -h localhost -d drive_ai -f server/schema_enhanced_fixed.sql

# PAS celui-ci (ancien):
# psql -U postgres -h localhost -d drive_ai -f server/schema_enhanced.sql
```

---

## 🎯 Architecture & Objectifs

### Objectif Principal
Transformer TECHMA-TEST pour gérer des vidéos massives (50GB+) avec analyse IA avancée.

### Avant (v1.0)
- ❌ Uploads limités à quelques MB (multer non-optimisé)
- ❌ Pas de transcription vidéo
- ❌ Pas de recherche sémantique
- ❌ Pas de traitement multi-format (PDF, images, JSON)

### Après (v2.0)
- ✅ Upload illimité (50GB+) avec reprises
- ✅ Transcription vidéo automatique (95%+ précis)
- ✅ Recherche sémantique sur tous les fichiers
- ✅ Traitement : PDF, images, JSON, vidéos
- ✅ Chat IA augmenté avec contexte des fichiers
- ✅ Suivi en temps réel des opérations

### Architecture Complète

```
┌─────────────────────────────────────┐
│     Interface Utilisateur (React)   │
│  ├─ Upload Manager                  │
│  ├─ Video Player + Transcription     │
│  ├─ Recherche Sémantique            │
│  └─ Chat IA Avancé                  │
└────────────┬────────────────────────┘
             │
┌────────────▼─────────────────────────┐
│      API Express.js                 │
│  ├─ Upload (Tus Protocol)           │
│  ├─ Video Processing                │
│  ├─ AI Chat (RAG)                   │
│  └─ File Analysis                   │
└────┬──────────────┬──────┬───────┬──┘
     │              │      │       │
 ┌───▼──┐    ┌──────▼──┐ ┌─▼────┐ ┌▼────┐
 │FFmpeg│    │ Whisper │ │Bull  │ │ AI  │
 │Queue │    │ Queue   │ │Queue │ │API  │
 └───┬──┘    └──────┬──┘ └─┬────┘ └┬────┘
     │              │      │       │
 ┌───┴──────────────┴──────┴───────┴────┐
 │    Base de Données PostgreSQL       │
 │  ├─ Tables: videos, transcripts     │
 │  ├─ Embeddings vectoriels (pgvector)│
 │  ├─ Conversations IA                │
 │  └─ Métadonnées fichiers            │
 └────────────────────────────────────┘
```

---

## 🛠️ Outils & Technologies

### 1. **FFmpeg** - Traitement Vidéo
- **Rôle:** Extraction métadonnées, génération vignettes, segmentation
- **Coût:** GRATUIT (open-source)
- **Installation:**
```bash
sudo apt-get install ffmpeg
ffmpeg -version  # Vérifier
```

### 2. **Whisper (OpenAI)** - Transcription
- **Rôle:** Convertir audio vidéo en texte (95%+ précis)
- **Langues:** 99 langues supportées
- **Coût:** GRATUIT (local ou API gratuite)
- **Installation:**
```bash
pip install openai-whisper
whisper --version  # Vérifier
```

### 3. **PostgreSQL + pgvector** - Base de Données
- **Rôle:** Stockage données + embeddings vectoriels pour recherche sémantique
- **Coût:** GRATUIT (open-source)
- **Extensions requises:** pgvector, uuid-ossp
- **Installation:**
```bash
sudo apt-get install postgresql-16-pgvector
sudo systemctl restart postgresql
```

### 4. **Redis + Bull** - Files de Traitement
- **Rôle:** Gérer traitement asynchrone (transcription, embeddings)
- **Coût:** GRATUIT (open-source)
- **Installation:**
```bash
sudo apt-get install redis-server
redis-server
```

### 5. **Tus Protocol** - Upload Reprise
- **Rôle:** Permettre pause/reprise uploads massifs
- **Coût:** GRATUIT (protocole ouvert)

### 6. **Gemini 2.0 API** - IA Chat
- **Rôle:** Répondre questions avec contexte fichiers (RAG)
- **Coût:** Gratuit/payant selon usage

---

## 📅 Feuille de Route Implémentation

### Phase 0: Infrastructure (3-5 jours)
**Objectif:** Préparer l'environnement

```
☐ Installer PostgreSQL + pgvector
☐ Installer Redis
☐ Installer FFmpeg + Whisper
☐ Créer base de données améliorée
☐ Configurer variables d'environnement
```

**Effort:** 24-40 heures

---

### Phase 1: Système d'Upload (5-7 jours)
**Objectif:** Uploads reprises pour fichiers massifs

**Backend:**
```javascript
// Endpoint Tus pour uploads par chunk
POST /api/upload
PATCH /api/upload/{uploadId}
GET /api/upload/{uploadId}/status
POST /api/upload/{uploadId}/complete
```

**Frontend:**
- Composant upload avec barre de progression
- Boutons pause/reprise
- Affichage vitesse upload + ETA

**Fichiers à créer:**
```
server/services/uploadProcessor.js
server/routes/upload.js
client/src/components/UploadManager.jsx
```

**Effort:** 40-56 heures

---

### Phase 2: Traitement Vidéo (7-10 jours)
**Objectif:** Pipeline traitement + transcription automatique

**Étapes:**
1. **Extraction métadonnées** (FFprobe)
   - Durée, résolution, codec
   - Génération vignette
   
2. **Segmentation vidéo**
   - Diviser en segments 10 minutes
   
3. **Transcription parallèle** (Whisper)
   - Transcrire segments en parallèle
   - Fusionner avec horodatage
   
4. **Sauvegarde** en base de données
   - Transcript complet
   - Segments avec timestamps

**Files Bull:**
- `video-processing` - Extraction métadonnées
- `transcription` - Transcription Whisper
- `embedding` - Génération embeddings

**Fichiers créés:**
```
✅ server/services/videoProcessor.js
✅ server/services/transcriber.js
server/routes/videos.js
```

**Effort:** 56-80 heures

---

### Phase 3: Traitement Multi-Format (4-5 jours)
**Objectif:** Support PDF, Images, JSON

**Formats supportés:**
| Format | Traitement | Extraction |
|--------|-----------|-----------|
| PDF | pdf-parse | Texte + métadonnées |
| Images | Tesseract OCR | Texte reconnu |
| JSON | Parser natif | Structure + données |
| DOCX | mammoth.js | Texte |
| Vidéo | Whisper | Transcription |

**Fichiers créés:**
```
✅ server/services/fileProcessor.js
client/src/components/FilePreview.jsx
```

**Effort:** 32-40 heures

---

### Phase 4: Embeddings & Recherche (6-8 jours)
**Objectif:** Recherche sémantique sur tous les fichiers

**Flux:**
```
Contenu fichier
      ↓
Chunking (si long)
      ↓
Génération embeddings (OpenAI/Ollama)
      ↓
Stockage pgvector
      ↓
Index cosine similarity
      ↓
Recherche rapide
```

**Requête SQL exemple:**
```sql
-- Rechercher 5 contenus similaires
SELECT id, content, embedding <-> query_embedding AS distance
FROM file_embeddings
WHERE user_id = 123
ORDER BY embedding <-> query_embedding
LIMIT 5;
```

**Fichiers créés:**
```
✅ server/services/embeddingService.js
client/src/components/SemanticSearch.jsx
```

**Effort:** 48-64 heures

---

### Phase 5: Chat IA Avancé (5-7 jours)
**Objectif:** RAG (Retrieval-Augmented Generation)

**Mécanisme:**
```
Question utilisateur
      ↓
Recherche sémantique (embeddings)
      ↓
Récupération contexte pertinent
      ↓
Augmentation prompt
      ↓
Appel Gemini API
      ↓
Réponse avec citations
```

**Exemple:**
```
User: "Résume cette vidéo"
      ↓
Système: Cherche embedding similaire
         Récupère transcript vidéo
         Construit prompt augmenté:
         "Contexte: [transcript]
          Question: Résume cette vidéo"
      ↓
Gemini: "La vidéo couvre... (basé sur transcript)"
```

**Fichiers créés:**
```
✅ server/services/enhancedAI.js
server/routes/ai.js
client/src/components/EnhancedChat.jsx
```

**Effort:** 40-56 heures

---

### Phase 6: Amélioration UI (4-5 jours)
**Objectif:** Interface professionnelle pour toutes fonctionnalités

**Composants:**
```
Dashboard amélioré
  ├─ Upload Manager
  ├─ Video Player avec transcript
  ├─ Recherche sémantique
  ├─ Chat IA
  ├─ Suivi jobs
  └─ Paramètres
```

**Effort:** 32-40 heures

---

### Phase 7: Tests & Optimization (4-5 jours)
**Objectif:** Qualité production

- ✅ Tests unitaires (services)
- ✅ Tests intégration (API)
- ✅ Tests charge (1000+ uploads)
- ✅ Optimization requêtes
- ✅ Optimization caching

**Effort:** 32-40 heures

---

### Phase 8: Déploiement (3-4 jours)
**Objectif:** Production-ready

- ✅ Docker containerization
- ✅ Configuration HTTPS
- ✅ Sauvegarde/backup
- ✅ Monitoring
- ✅ Documentation finales

**Effort:** 24-32 heures

---

## 📊 Chronologie Complète

| Phase | Durée | Effort |
|-------|-------|--------|
| 0: Infra | 3-5 j | 24-40 h |
| 1: Upload | 5-7 j | 40-56 h |
| 2: Vidéo | 7-10 j | 56-80 h |
| 3: Formats | 4-5 j | 32-40 h |
| 4: Embeddings | 6-8 j | 48-64 h |
| 5: IA Avancé | 5-7 j | 40-56 h |
| 6: UI | 4-5 j | 32-40 h |
| 7: Tests | 4-5 j | 32-40 h |
| 8: Deploy | 3-4 j | 24-32 h |
| **TOTAL** | **~6 semaines** | **~400 heures** |

---

## 🎯 Cas d'Usage Principal

### Scénario: Samuel télécharge vidéo 50GB

```
1️⃣ UPLOAD (Semaine 1)
   Samuel clique "Upload" → Choisit vidéo 50GB
   ↓
   Système divise en chunks 5MB
   ↓
   Upload par HTTP resumable
   ↓
   Si interruption → Pause/Reprise
   ↓
   Upload complété ✓

2️⃣ TRAITEMENT (Semaine 2)
   FFmpeg extrait metadata
   ↓
   Génère vignette
   ↓
   Divise en segments 10 minutes
   ↓
   Queue Transcription créée ✓

3️⃣ TRANSCRIPTION (Semaine 2-3)
   Whisper traite segments en parallèle
   ↓
   5 segments/fois (10 workers)
   ↓
   Fusion transcripts
   ↓
   Stockage PostgreSQL ✓

4️⃣ EMBEDDINGS (Semaine 3)
   Transcript splité en chunks
   ↓
   Embeddings générés (OpenAI/Ollama)
   ↓
   Stockés dans pgvector
   ↓
   Index créé pour recherche rapide ✓

5️⃣ CHAT IA (Semaine 3-4)
   Samuel: "Quel est le sujet principal?"
   ↓
   Système cherche embeddings similaires
   ↓
   Récupère passages pertinents
   ↓
   Construit prompt: "Contexte: [passages]
                       Question: ..."
   ↓
   Gemini répond: "Le sujet principal est..."
   ↓
   Résultat avec citations ✓

6️⃣ INTÉGRATION GOOGLE DRIVE
   Samuel connecte Google Drive
   ↓
   Fichiers Drive synchronisés
   ↓
   Traitement même pipeline
   ↓
   Toutes vidéos Drive interrogeables ✓
```

---

## 💾 Base de Données

### Nouvelles Tables (10)

```sql
videos                  -- Métadonnées vidéos
video_transcripts       -- Transcriptions complètes
processed_files         -- Fichiers traités (PDF, images, JSON)
file_embeddings         -- Embeddings vectoriels (recherche sémantique)
ai_conversations        -- Historique conversations IA
ai_messages             -- Messages individuels
upload_sessions         -- Suivi uploads massifs
upload_chunks           -- Chunks d'upload
processing_jobs         -- Files traitement (Bull)
file_analytics          -- Statistiques fichiers
```

### Indexes Performance (20+)

```
idx_videos_user_id              -- Requête rapide par utilisateur
idx_videos_status               -- Filtrage par statut
idx_file_embeddings_vector      -- Recherche cosine similarity
idx_upload_sessions_status      -- Suivi uploads actifs
... et 15+ autres
```

---

## 🚀 Prochaines Étapes

### Immédiat (Aujourd'hui)

1. **Installer pgvector:**
```bash
sudo apt-get install postgresql-16-pgvector
sudo systemctl restart postgresql
```

2. **Vérifier installation:**
```bash
psql -U postgres -h localhost -d drive_ai -c "SELECT * FROM pg_extension WHERE extname='vector';"
```

3. **Appliquer schéma corrigé:**
```bash
psql -U postgres -h localhost -d drive_ai -f server/schema_enhanced_fixed.sql
```

4. **Vérifier création tables:**
```bash
psql -U postgres -h localhost -d drive_ai -c "\dt"
```

### Court Terme (Cette Semaine)

5. **Installer dépendances Node:**
```bash
cd server
npm install -f
```

6. **Configurer .env:**
```bash
cp .env.example .env
# Éditer avec vos clés API, etc
```

7. **Démarrer services:**
```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Backend
npm run dev

# Terminal 3: Frontend
cd ../client && npm run dev
```

### Court Terme (Semaines 2-3)

8. **Implémenter Phase 1:** Upload reprise
9. **Implémenter Phase 2:** Traitement vidéo
10. **Tester** avec vraie vidéo 50GB+

---

## 📚 Documents de Référence

| Document | Contenu |
|----------|---------|
| **STRATEGIC_IMPROVEMENTS.md** | Architecture complète, 20+ outils |
| **IMPLEMENTATION_ROADMAP.md** | Feuille route détaillée 8 phases |
| **OPEN_SOURCE_TOOLS_GUIDE.md** | Comparaison FFmpeg, Whisper, etc |
| **API_DOCUMENTATION.md** | Tous endpoints API détaillés |
| **INSTALLATION_GUIDE.md** | Setup complet Windows/Mac/Linux |
| **PGVECTOR_SETUP.md** | Fix erreur pgvector |
| **Ce document** | Guide français complet |

---

## ✅ Checklist Démarrage

- [ ] pgvector installé et vérifié
- [ ] Schéma appliqué sans erreurs
- [ ] Toutes tables créées (9+)
- [ ] Tous indexes créés (20+)
- [ ] Dépendances Node installées
- [ ] .env configuré
- [ ] Redis démarré
- [ ] Backend démarre sans erreurs
- [ ] Frontend démarre sur http://localhost:5173

---

## 🎓 Concepts Clés

### **RAG (Retrieval-Augmented Generation)**
- Récupérer contexte pertinent
- Augmenter prompt avec ce contexte
- Générer réponse basée sur contexte
- Résultat plus précis et sourced

### **Embeddings Vectoriels**
- Convertir texte → vecteur numérique
- Vecteurs similaires = contenu similaire
- Permet recherche sémantique (pas juste texte)
- Stockage efficient avec pgvector

### **Files Asynchrones (Bull + Redis)**
- Tâches longues en arrière-plan
- Reprendre en cas d'erreur
- Suivi progression
- Scalable à 1000s de jobs

### **Upload Reprises (Tus)**
- Diviser fichier en chunks
- Envoyer chunks par HTTP
- Resume si interruption
- Client responsable des chunks

---

## 💡 Conseils d'Implémentation

1. **Commencer petit:** Tester avec vidéo 1GB avant 50GB
2. **Monitoring:** Vérifier logs Bull/Redis durant transcription
3. **GPU:** Utiliser GPU pour Whisper si disponible (10x plus rapide)
4. **Cache:** Mettre en cache embeddings populaires
5. **Backup:** Sauvegarder transcripts & embeddings régulièrement

---

## 📞 Support & Ressources

- **FFmpeg Docs:** https://ffmpeg.org/documentation.html
- **Whisper Guide:** https://github.com/openai/whisper
- **pgvector GitHub:** https://github.com/pgvector/pgvector
- **Gemini API:** https://ai.google.dev/
- **Bull Queue:** https://docs.bullmq.io/

---

**Statut:** ✅ Prêt pour implémentation  
**Dernière mise à jour:** Mai 2024  
**Version:** 2.0
