# TECHMA-TEST: Strategic Improvements for Large-Scale Video Processing

## 🎯 Executive Summary

Upgrading the Drive AI platform to handle **50GB+ video files** with robust AI processing capabilities. This document outlines open-source solutions, architecture changes, and implementation strategies.

---

## 📊 Part 1: Open-Source Tools for Large Video File Management (50GB+)

### 1.1 Video Streaming & Chunking Solutions

#### **FFmpeg (Essential Foundation)**
- **Type**: Video processing engine
- **Use Case**: Video transcoding, format conversion, chunk extraction
- **Why**: Industry standard, supports all formats, handles large files efficiently
- **Installation**: 
  ```bash
  # Ubuntu/WSL
  sudo apt-get install ffmpeg
  ```
- **Key Features**:
  - Stream processing (doesn't load entire file in memory)
  - Adaptive bitrate streaming
  - Hardware acceleration support
  - Metadata extraction

#### **Tus Protocol (Resumable Uploads)**
- **Package**: `@tus/server` (Node.js)
- **Use Case**: Resume interrupted uploads for 50GB+ files
- **Why**: HTTP-based resumable protocol, browser/mobile friendly
- **Features**:
  - Chunk-based uploads (5MB-100MB per chunk)
  - Pause/resume capability
  - Automatic retry
  - Progress tracking

#### **MinIO (S3-Compatible Object Storage)**
- **Type**: Distributed object storage
- **Use Case**: Store large video files efficiently
- **Why**: Open-source, S3-compatible, self-hosted
- **Alternative**: Use Google Cloud Storage or AWS S3
- **Benefits**:
  - Multipart uploads
  - Lifecycle policies (auto-archiving)
  - Access control

---

### 1.2 Video Transcription Solutions

#### **OpenAI Whisper (Recommended)**
- **Type**: Open-source speech-to-text
- **Accuracy**: 95%+ on English
- **Supports**: 99 languages
- **Installation**:
  ```bash
  pip install openai-whisper
  ```
- **Self-hosted**: Run locally or on GPU servers
- **Cost**: FREE (compared to $0.006/min with commercial APIs)

#### **Alternatives**:
- **Speechmatics**: Better for non-English, commercial
- **AssemblyAI**: Cloud-based, good accuracy
- **Google Cloud Speech-to-Text**: Commercial, pay-per-minute

#### **Implementation Strategy for Large Videos**:
```
1. Chunk video into 10-15 minute segments (using FFmpeg)
2. Process segments in parallel (5-10 concurrent jobs)
3. Store transcripts in PostgreSQL with timestamps
4. Index transcripts for AI search capability
```

---

### 1.3 Vector Database for AI Processing

#### **Recommended: Milvus or PostgreSQL + pgvector**
- **Type**: Vector embedding storage
- **Use Case**: Store video transcripts + PDF/image content as vectors
- **Installation** (pgvector option):
  ```bash
  CREATE EXTENSION vector;
  ```
- **Benefits**:
  - Semantic search across all content
  - AI can understand document relationships
  - Cost-effective (single database)

#### **Alternative: Pinecone** (Managed but $$)

---

## 🏗️ Part 2: Architecture Improvements

### 2.1 Enhanced Backend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  API Gateway / Express                      │
│  ├─ Authentication (JWT)                                   │
│  ├─ Rate limiting & Validation                             │
│  └─ Request routing                                        │
└────┬──────────────────────────┬──────────────────────┬─────┘
     │                          │                      │
┌────▼──────────┐  ┌───────────▼────────┐  ┌──────────▼──────┐
│ Upload Service│  │ Processing Service │  │ AI Service      │
│               │  │                    │  │                 │
│ • Tus chunks  │  │ • Video transcribe │  │ • Embeddings    │
│ • Validation  │  │ • PDF parsing      │  │ • Semantic      │
│ • Compression │  │ • Image OCR        │  │   search        │
└────┬──────────┘  │ • JSON extract     │  │ • Q&A           │
     │             └───────────┬────────┘  └──────────┬──────┘
     │                         │                      │
┌────▼─────────────────────────▼──────────────────────▼──────┐
│         Data Layer                                         │
├─ PostgreSQL (metadata, users, transcripts, embeddings)    │
├─ MinIO / Google Cloud Storage (video files)               │
├─ Redis (caching, job queue)                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Specific Backend Improvements

#### **A. Chunked Upload System**
```javascript
// server/routes/upload.js
const tus = require('@tus/server');
const { FileStore } = require('@tus/server/lib/stores');

const upload = new tus.Server({
  path: '/api/upload',
  datastore: new FileStore({ directory: './uploads/chunks' }),
  namingFunction: () => crypto.randomUUID()
});
```

#### **B. Video Processing Pipeline**
```javascript
// server/services/videoProcessor.js
class VideoProcessor {
  async processVideo(filePath, userId) {
    // 1. Extract metadata
    const metadata = await ffprobe(filePath);
    
    // 2. Generate preview thumbnail
    await ffmpeg(filePath)
      .screenshot({ timestamps: [metadata.duration * 0.1] });
    
    // 3. Queue transcription job
    await queue.add('transcribe-video', {
      filePath, userId, duration: metadata.duration
    });
    
    // 4. Store metadata in DB
    await saveVideoMetadata(userId, metadata);
  }
}
```

#### **C. Transcription Service**
```javascript
// server/services/transcriber.js
const whisper = require('openai-whisper');

async function transcribeVideo(videoPath) {
  // Chunk video into 10-min segments
  const segments = await chunkVideo(videoPath, 600);
  
  const results = await Promise.all(
    segments.map(seg => 
      whisper.transcribe(seg, { language: 'auto' })
    )
  );
  
  return concatenateTranscripts(results);
}
```

#### **D. AI Processing with Vector Embeddings**
```javascript
// server/services/aiProcessor.js
const { TextServiceClient } = require('@google-ai/generativelanguage').v1;

async function processWithAI(files, query) {
  // 1. Get embeddings for query
  const queryEmbedding = await getEmbeddings(query);
  
  // 2. Search similar content across all files
  const relevantContent = await searchVectorDB(
    queryEmbedding, 
    { userId: req.user.id }
  );
  
  // 3. Augment prompt with retrieved content
  const augmentedPrompt = buildPrompt(query, relevantContent);
  
  // 4. Query Gemini with context
  return await askGemini(augmentedPrompt);
}
```

---

## 📝 Part 3: New Features Implementation

### 3.1 Multi-Format AI Processing

#### **Supported Formats**:
```
┌─────────────────────────────────────────────────────┐
│ File Type │ Processor        │ AI Integration       │
├─────────────────────────────────────────────────────┤
│ PDF       │ PDF.js + Tesseract│ Text + OCR          │
│ VIDEO     │ FFmpeg + Whisper  │ Transcript + summary│
│ IMAGE     │ Tesseract + vision│ OCR + description   │
│ JSON      │ JSON parser       │ Schema analysis     │
│ DOCX      │ mammoth.js        │ Text extraction     │
│ AUDIO     │ Whisper           │ Transcript          │
└─────────────────────────────────────────────────────┘
```

#### **Implementation**:
```javascript
// server/services/fileProcessor.js
class UniversalFileProcessor {
  static processors = {
    'application/pdf': PDFProcessor,
    'video/mp4': VideoProcessor,
    'image/jpeg': ImageProcessor,
    'application/json': JSONProcessor,
  };
  
  async process(file, userId) {
    const processor = this.processors[file.mimeType];
    if (!processor) throw new Error('Unsupported file type');
    
    const content = await processor.extract(file);
    const embeddings = await generateEmbeddings(content);
    
    await saveToVectorDB(userId, file.id, embeddings);
  }
}
```

### 3.2 Real-Time File Sync (Google Drive + Local)

```javascript
// server/services/fileSync.js
const { google } = require('googleapis');
const EventEmitter = require('events');

class FileSyncManager extends EventEmitter {
  async startSync(userId, interval = 5000) {
    setInterval(async () => {
      const driveFiles = await getDriveFiles(userId);
      const localFiles = await getLocalFiles(userId);
      
      // Find deletions
      const deleted = findDeleted(localFiles, driveFiles);
      
      // Find new files
      const newFiles = findNew(driveFiles, localFiles);
      
      if (deleted.length) {
        this.emit('files-deleted', deleted);
      }
      
      if (newFiles.length) {
        this.emit('files-added', newFiles);
        // Queue processing
        newFiles.forEach(f => 
          processingQueue.add({ fileId: f.id, userId })
        );
      }
    }, interval);
  }
}
```

### 3.3 Enhanced AI Chat with Multimodal Support

```javascript
// API endpoint improvements
POST /api/ai/chat
Body: {
  query: string,
  fileIds: string[], // Multiple files
  conversationId?: string,
  temperature?: number (0-1)
}

Response: {
  response: string,
  sources: [{ fileId, fileName, confidence }],
  followUpQuestions: string[]
}
```

---

## 🛠️ Part 4: Database Schema Improvements

### 4.1 New Tables for Video Management

```sql
-- Video metadata and transcription
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id),
  filename TEXT NOT NULL,
  file_path TEXT,
  file_size BIGINT,
  duration FLOAT, -- in seconds
  mimetype VARCHAR(50),
  status ENUM('uploading', 'processing', 'completed', 'failed'),
  upload_progress FLOAT, -- 0-100
  transcription_status ENUM('pending', 'processing', 'completed', 'failed'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE video_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  transcript TEXT,
  segments JSONB, -- [{start: 0, end: 10, text: "..."}]
  language VARCHAR(10),
  confidence FLOAT,
  created_at TIMESTAMP
);

-- Vector embeddings for semantic search
CREATE TABLE file_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id),
  file_id UUID, -- can reference videos, local_files, etc.
  file_type VARCHAR(20), -- 'video', 'pdf', 'image'
  content_chunk TEXT,
  embedding vector(1536), -- OpenAI embedding dimension
  created_at TIMESTAMP
);

-- AI conversation history with file context
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id),
  title TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ai_conversations(id),
  role ENUM('user', 'assistant'),
  content TEXT,
  file_references JSONB, -- [{fileId, fileName, type}]
  created_at TIMESTAMP
);

-- Upload progress tracking
CREATE TABLE upload_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id),
  filename TEXT,
  total_size BIGINT,
  uploaded_size BIGINT DEFAULT 0,
  status ENUM('active', 'paused', 'completed', 'failed'),
  created_at TIMESTAMP,
  expires_at TIMESTAMP -- session timeout
);
```

---

## 🚀 Part 5: Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Install FFmpeg and Whisper locally
- [ ] Set up Redis for job queue
- [ ] Create video processing pipeline structure
- [ ] Update database schema

### Phase 2: Upload System (Week 2)
- [ ] Implement Tus-based chunked uploads
- [ ] Add progress tracking
- [ ] Add pause/resume capability
- [ ] Test with large files (10GB+)

### Phase 3: Video Processing (Week 3)
- [ ] Implement video transcription
- [ ] Segment transcription for long videos
- [ ] Store transcripts in DB
- [ ] Create transcription UI

### Phase 4: AI Enhancement (Week 3-4)
- [ ] Add multi-format processing (PDF, image, JSON)
- [ ] Implement vector embeddings
- [ ] Enhance AI search with semantic search
- [ ] Add follow-up question suggestions

### Phase 5: Real-Sync & Polish (Week 4)
- [ ] Implement file sync manager
- [ ] Add error handling & retry logic
- [ ] Performance testing & optimization
- [ ] Documentation & deployment

---

## 📦 Dependencies to Add

```json
{
  "dependencies": {
    "@tus/server": "^0.6.0",
    "bull": "^4.11.3",
    "redis": "^4.6.0",
    "fluent-ffmpeg": "^2.1.2",
    "openai-whisper": "^1.0.0",
    "pdf-parse": "^1.1.1",
    "pdfjs-dist": "^3.11.174",
    "tesseract.js": "^5.0.0",
    "mammoth": "^1.6.0",
    "pg-boss": "^9.2.0",
    "joi": "^17.11.0",
    "sharp": "^0.33.0"
  }
}
```

---

## 🔒 Security Considerations

1. **File Validation**: Verify file types, scan for malware (ClamAV)
2. **Size Limits**: Enforce quotas per user
3. **Access Control**: Ensure users can't access others' files
4. **Encryption**: Encrypt sensitive videos at rest
5. **Rate Limiting**: Prevent abuse of transcription API

---

## 📊 Performance Metrics to Monitor

```
- Average upload speed (MB/s)
- Chunk processing time
- Transcription accuracy & speed
- AI response latency
- Vector search performance
- Database query times
- Error rates & recovery
```

---

## 🎓 Key Takeaways

1. **Never load entire large files in memory** → Use streaming
2. **Chunk everything** → Uploads, transcription, processing
3. **Use job queues** → Async processing with Bull/Redis
4. **Vector embeddings** → Enable semantic search across all content
5. **Progress tracking** → Users need visibility on long operations
6. **Resilience** → Implement retry logic and error recovery

---

**Next Step**: Review this document with the team and start Phase 1 implementation.
