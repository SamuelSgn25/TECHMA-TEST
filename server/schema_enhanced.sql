/**
 * Enhanced Database Schema
 * Supports video processing, embeddings, and advanced AI features
 */

-- Enable pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Existing tables (users, auth, etc) remain unchanged
-- Add these new tables for enhanced functionality

-- Videos table with metadata and processing status
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT,
  file_size BIGINT, -- bytes
  duration FLOAT, -- seconds
  framerate INTEGER,
  resolution VARCHAR(50), -- e.g., "1920x1080"
  codec_video VARCHAR(50),
  codec_audio VARCHAR(50),
  status VARCHAR(50) DEFAULT 'uploading', -- uploading, processing, completed, failed
  upload_progress FLOAT DEFAULT 0, -- 0-100
  transcription_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  thumbnail_path TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (user_id),
  INDEX (status),
  INDEX (transcription_status)
);

-- Video transcripts with segments
CREATE TABLE IF NOT EXISTS video_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  transcript TEXT NOT NULL,
  segments JSONB, -- [{start: 0, end: 10, text: "..."}]
  language VARCHAR(10) DEFAULT 'en',
  confidence FLOAT DEFAULT 0.9,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (video_id)
);

-- Processed files (PDF, images, documents)
CREATE TABLE IF NOT EXISTS processed_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_id UUID, -- reference to videos, local_files, etc
  file_name TEXT NOT NULL,
  file_type VARCHAR(50), -- pdf, image, docx, json, text
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (user_id),
  INDEX (file_id),
  UNIQUE (file_id)
);

-- Vector embeddings for semantic search
CREATE TABLE IF NOT EXISTS file_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_id UUID,
  file_type VARCHAR(50), -- video, pdf, image, document, etc
  source_type VARCHAR(50), -- transcript, text, ocr, etc
  content_chunk TEXT,
  embedding vector(1536), -- OpenAI embedding dimension
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (user_id),
  INDEX ON embedding USING ivfflat (embedding vector_cosine_ops)
);

-- AI Conversations with file context
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  summary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (user_id)
);

-- AI Messages in conversations
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20), -- user, assistant
  content TEXT NOT NULL,
  file_references JSONB, -- [{fileId: UUID, fileName: string, type: string}]
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (conversation_id)
);

-- Upload sessions for resumable uploads
CREATE TABLE IF NOT EXISTS upload_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  total_size BIGINT,
  uploaded_size BIGINT DEFAULT 0,
  chunk_size INTEGER DEFAULT 5242880, -- 5MB default
  status VARCHAR(50) DEFAULT 'active', -- active, paused, completed, failed
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
  INDEX (user_id),
  INDEX (status)
);

-- Upload chunks (for resumable uploads)
CREATE TABLE IF NOT EXISTS upload_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES upload_sessions(id) ON DELETE CASCADE,
  chunk_number INTEGER,
  chunk_path TEXT,
  chunk_size BIGINT,
  chunk_hash VARCHAR(64), -- SHA256 for verification
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (session_id, chunk_number)
);

-- Processing jobs queue
CREATE TABLE IF NOT EXISTS processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_type VARCHAR(50), -- transcription, embedding, analysis
  file_id UUID,
  file_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'queued', -- queued, processing, completed, failed
  progress FLOAT DEFAULT 0, -- 0-100
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  INDEX (user_id),
  INDEX (status),
  INDEX (job_type)
);

-- File analytics
CREATE TABLE IF NOT EXISTS file_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_id UUID,
  view_count INTEGER DEFAULT 0,
  ai_queries_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_user_created ON videos(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_processed_files_user ON processed_files(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_embeddings_user ON file_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_user_status ON processing_jobs(user_id, status);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_videos_updated BEFORE UPDATE ON videos
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_processed_files_updated BEFORE UPDATE ON processed_files
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_ai_conversations_updated BEFORE UPDATE ON ai_conversations
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_upload_sessions_updated BEFORE UPDATE ON upload_sessions
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_processing_jobs_updated BEFORE UPDATE ON processing_jobs
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Views for common queries

-- Active uploads
CREATE OR REPLACE VIEW v_active_uploads AS
SELECT 
  us.*,
  COUNT(uc.id) as total_chunks,
  SUM(uc.chunk_size) as chunks_size
FROM upload_sessions us
LEFT JOIN upload_chunks uc ON us.id = uc.session_id
WHERE us.status = 'active' AND us.expires_at > CURRENT_TIMESTAMP
GROUP BY us.id;

-- User storage usage
CREATE OR REPLACE VIEW v_user_storage_usage AS
SELECT 
  u.id,
  u.username,
  COALESCE(SUM(v.file_size), 0) as video_storage,
  COUNT(DISTINCT v.id) as video_count,
  COUNT(DISTINCT pf.id) as processed_files_count
FROM users u
LEFT JOIN videos v ON u.id = v.user_id AND v.status = 'completed'
LEFT JOIN processed_files pf ON u.id = pf.user_id
GROUP BY u.id, u.username;

-- Recent AI conversations
CREATE OR REPLACE VIEW v_recent_ai_conversations AS
SELECT 
  ac.*,
  COUNT(am.id) as message_count,
  MAX(am.created_at) as last_message_at
FROM ai_conversations ac
LEFT JOIN ai_messages am ON ac.id = am.conversation_id
GROUP BY ac.id
ORDER BY ac.updated_at DESC;
