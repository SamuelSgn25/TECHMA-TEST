/**
 * Enhanced Database Schema - FIXED FOR POSTGRESQL
 * Supports video processing, embeddings, and advanced AI features
 */

-- ====================================================================
-- STEP 1: INSTALL EXTENSIONS
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ====================================================================
-- STEP 2: CREATE TABLES
-- ====================================================================

-- Videos table with metadata and processing status
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT,
  file_size BIGINT,
  duration FLOAT,
  framerate INTEGER,
  resolution VARCHAR(50),
  codec_video VARCHAR(50),
  codec_audio VARCHAR(50),
  status VARCHAR(50) DEFAULT 'uploading',
  upload_progress FLOAT DEFAULT 0,
  transcription_status VARCHAR(50) DEFAULT 'pending',
  thumbnail_path TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Video transcripts with segments
CREATE TABLE IF NOT EXISTS video_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  transcript TEXT NOT NULL,
  segments JSONB,
  language VARCHAR(10) DEFAULT 'en',
  confidence FLOAT DEFAULT 0.9,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Processed files (PDF, images, documents)
CREATE TABLE IF NOT EXISTS processed_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_id UUID UNIQUE,
  file_name TEXT NOT NULL,
  file_type VARCHAR(50),
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vector embeddings for semantic search
CREATE TABLE IF NOT EXISTS file_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_id UUID,
  file_type VARCHAR(50),
  source_type VARCHAR(50),
  content_chunk TEXT,
  embedding vector(1536),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Conversations with file context
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  summary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Messages in conversations
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20),
  content TEXT NOT NULL,
  file_references JSONB,
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Upload sessions for resumable uploads
CREATE TABLE IF NOT EXISTS upload_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  total_size BIGINT,
  uploaded_size BIGINT DEFAULT 0,
  chunk_size INTEGER DEFAULT 5242880,
  status VARCHAR(50) DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
);

-- Upload chunks (for resumable uploads)
CREATE TABLE IF NOT EXISTS upload_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES upload_sessions(id) ON DELETE CASCADE,
  chunk_number INTEGER,
  chunk_path TEXT,
  chunk_size BIGINT,
  chunk_hash VARCHAR(64),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (session_id, chunk_number)
);

-- Processing jobs queue
CREATE TABLE IF NOT EXISTS processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_type VARCHAR(50),
  file_id UUID,
  file_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'queued',
  progress FLOAT DEFAULT 0,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
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

-- ====================================================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- ====================================================================

-- Videos indexes
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_transcription_status ON videos(transcription_status);
CREATE INDEX IF NOT EXISTS idx_videos_user_created ON videos(user_id, created_at DESC);

-- Video transcripts indexes
CREATE INDEX IF NOT EXISTS idx_video_transcripts_video_id ON video_transcripts(video_id);

-- Processed files indexes
CREATE INDEX IF NOT EXISTS idx_processed_files_user_id ON processed_files(user_id);
CREATE INDEX IF NOT EXISTS idx_processed_files_file_id ON processed_files(file_id);
CREATE INDEX IF NOT EXISTS idx_processed_files_user_created ON processed_files(user_id, created_at DESC);

-- File embeddings indexes
CREATE INDEX IF NOT EXISTS idx_file_embeddings_user_id ON file_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_file_embeddings_file_id ON file_embeddings(file_id);
-- Vector similarity index (using IVFFlat for better performance with large datasets)
CREATE INDEX IF NOT EXISTS idx_file_embeddings_vector ON file_embeddings 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- AI Conversations indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_updated ON ai_conversations(user_id, updated_at DESC);

-- AI Messages indexes
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_created ON ai_messages(conversation_id, created_at DESC);

-- Upload sessions indexes
CREATE INDEX IF NOT EXISTS idx_upload_sessions_user_id ON upload_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_status ON upload_sessions(status);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_user_status ON upload_sessions(user_id, status);

-- Processing jobs indexes
CREATE INDEX IF NOT EXISTS idx_processing_jobs_user_id ON processing_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_user_status ON processing_jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_job_type ON processing_jobs(job_type);

-- File analytics indexes
CREATE INDEX IF NOT EXISTS idx_file_analytics_user_id ON file_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_file_analytics_file_id ON file_analytics(file_id);

-- ====================================================================
-- STEP 4: CREATE TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ====================================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
DROP TRIGGER IF EXISTS trigger_videos_updated ON videos;
CREATE TRIGGER trigger_videos_updated 
  BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_processed_files_updated ON processed_files;
CREATE TRIGGER trigger_processed_files_updated 
  BEFORE UPDATE ON processed_files
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_ai_conversations_updated ON ai_conversations;
CREATE TRIGGER trigger_ai_conversations_updated 
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_upload_sessions_updated ON upload_sessions;
CREATE TRIGGER trigger_upload_sessions_updated 
  BEFORE UPDATE ON upload_sessions
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_processing_jobs_updated ON processing_jobs;
CREATE TRIGGER trigger_processing_jobs_updated 
  BEFORE UPDATE ON processing_jobs
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ====================================================================
-- STEP 5: CREATE VIEWS FOR COMMON QUERIES
-- ====================================================================

-- Active uploads view
DROP VIEW IF EXISTS v_active_uploads CASCADE;
CREATE VIEW v_active_uploads AS
SELECT 
  us.id,
  us.user_id,
  us.filename,
  us.total_size,
  us.uploaded_size,
  us.status,
  us.created_at,
  us.expires_at,
  COALESCE(COUNT(uc.id), 0) as total_chunks,
  COALESCE(SUM(uc.chunk_size), 0) as chunks_size
FROM upload_sessions us
LEFT JOIN upload_chunks uc ON us.id = uc.session_id
WHERE us.status = 'active' AND us.expires_at > CURRENT_TIMESTAMP
GROUP BY us.id, us.user_id, us.filename, us.total_size, us.uploaded_size, us.status, us.created_at, us.expires_at;

-- User storage usage view
DROP VIEW IF EXISTS v_user_storage_usage CASCADE;
CREATE VIEW v_user_storage_usage AS
SELECT 
  u.id,
  u.username,
  COALESCE(SUM(v.file_size), 0)::BIGINT as video_storage,
  COUNT(DISTINCT v.id)::INTEGER as video_count,
  COUNT(DISTINCT pf.id)::INTEGER as processed_files_count
FROM users u
LEFT JOIN videos v ON u.id = v.user_id AND v.status = 'completed'
LEFT JOIN processed_files pf ON u.id = pf.user_id
GROUP BY u.id, u.username;

-- Recent AI conversations view
DROP VIEW IF EXISTS v_recent_ai_conversations CASCADE;
CREATE VIEW v_recent_ai_conversations AS
SELECT 
  ac.id,
  ac.user_id,
  ac.title,
  ac.summary,
  ac.created_at,
  ac.updated_at,
  COUNT(am.id)::INTEGER as message_count,
  MAX(am.created_at) as last_message_at
FROM ai_conversations ac
LEFT JOIN ai_messages am ON ac.id = am.conversation_id
GROUP BY ac.id, ac.user_id, ac.title, ac.summary, ac.created_at, ac.updated_at
ORDER BY ac.updated_at DESC;

-- Processing jobs status view
DROP VIEW IF EXISTS v_processing_jobs_status CASCADE;
CREATE VIEW v_processing_jobs_status AS
SELECT 
  pj.user_id,
  pj.job_type,
  pj.status,
  COUNT(*) FILTER (WHERE status = 'queued') as queued_count,
  COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
  AVG(progress) FILTER (WHERE status = 'processing')::FLOAT as avg_progress
FROM processing_jobs pj
GROUP BY pj.user_id, pj.job_type, pj.status;

-- ====================================================================
-- STEP 6: VERIFY INSTALLATION
-- ====================================================================

-- Check if all extensions are installed
SELECT 
  'Vector Extension' as component,
  CASE WHEN EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector') 
    THEN '✓ Installed' 
    ELSE '✗ Missing' 
  END as status;

SELECT 
  'UUID-OSSP Extension' as component,
  CASE WHEN EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') 
    THEN '✓ Installed' 
    ELSE '✗ Missing' 
  END as status;

-- Count created tables
SELECT 
  'Tables Created' as component,
  COUNT(*)::TEXT as status
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Count created indexes
SELECT 
  'Indexes Created' as component,
  COUNT(*)::TEXT as status
FROM pg_indexes 
WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%';

COMMIT;
