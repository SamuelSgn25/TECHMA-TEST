# PostgreSQL pgvector Installation Guide

## 🔧 Fix for: "extension "vector" is not available"

### Problem
PostgreSQL doesn't have the pgvector extension installed on your system.

### ✅ Solution: Install pgvector

#### Option 1: Using Package Manager (Ubuntu/Debian) - RECOMMENDED

```bash
# Update package list
sudo apt-get update

# Install pgvector for your PostgreSQL version
sudo apt-get install postgresql-16-pgvector

# If version differs:
# sudo apt-get install postgresql-14-pgvector
# sudo apt-get install postgresql-15-pgvector
```

#### Option 2: Build from Source

```bash
# Install build dependencies
sudo apt-get install build-essential postgresql-server-dev-16

# Clone pgvector repository
git clone --recursive https://github.com/pgvector/pgvector.git
cd pgvector

# Build and install
make
sudo make install

# Verify installation
pgvector_version
```

#### Option 3: Using Docker

If you're using PostgreSQL in Docker:

```bash
# Use pre-built image with pgvector
docker run -d \
  --name postgres-pgvector \
  -e POSTGRES_PASSWORD=password \
  pgvector/pgvector:pg16

# Then connect and apply schema
psql -h localhost -U postgres -d drive_ai -f server/schema_enhanced_fixed.sql
```

---

## ✅ Verify Installation

```bash
# Connect to PostgreSQL
psql -U postgres -h localhost

# Check if pgvector is available
SELECT * FROM pg_available_extensions WHERE name = 'vector';

# Output should show: vector | | | | plpgsql language extension
```

---

## 📝 Apply the Fixed Schema

Once pgvector is installed:

```bash
# Navigate to project directory
cd ~/TECHMA-TEST

# Apply the FIXED schema (not the old one)
psql -U postgres -h localhost -d drive_ai -f server/schema_enhanced_fixed.sql

# Expected output at end:
# component                   | status
# ----------------------------|------------------
# Vector Extension            | ✓ Installed
# UUID-OSSP Extension         | ✓ Installed
# Tables Created              | 15
# Indexes Created             | 20+
```

---

## ✅ Verify Tables Created

```bash
psql -U postgres -h localhost -d drive_ai

# List all tables
\dt

# Should show:
# - videos
# - video_transcripts
# - processed_files
# - file_embeddings
# - ai_conversations
# - ai_messages
# - upload_sessions
# - upload_chunks
# - processing_jobs
# - file_analytics
```

---

## 🔍 Troubleshooting

### Error: "control file could not be open"

```bash
# Find where pgvector should be installed
sudo find /usr -name "vector.control" 2>/dev/null

# If not found, reinstall:
sudo apt-get remove postgresql-16-pgvector
sudo apt-get install postgresql-16-pgvector
```

### Error: "could not load library"

```bash
# Ensure PostgreSQL service is restarted
sudo systemctl restart postgresql

# Then try again
psql -U postgres -h localhost -d drive_ai -f server/schema_enhanced_fixed.sql
```

### Error: "column does not exist"

Make sure you're using the FIXED schema (`schema_enhanced_fixed.sql`), not the original one.

---

## 📋 What's Different in the Fixed Schema

### Original Schema (BROKEN)
```sql
-- ❌ Invalid MySQL syntax in PostgreSQL
CREATE TABLE videos (
  id UUID PRIMARY KEY,
  INDEX (user_id),
  INDEX (status)
);
```

### Fixed Schema (WORKING)
```sql
-- ✅ Proper PostgreSQL syntax
CREATE TABLE videos (
  id UUID PRIMARY KEY,
  user_id INTEGER NOT NULL,
  status VARCHAR(50)
);

-- Indexes defined separately
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_status ON videos(status);
```

### Key Changes
1. ✅ All inline `INDEX ()` statements removed
2. ✅ Separate `CREATE INDEX` statements at the end
3. ✅ Fixed pgvector/vector index syntax
4. ✅ Added proper triggers for `updated_at`
5. ✅ Added verification queries
6. ✅ Better organized into logical sections

---

## ✅ Verification Checklist

- [ ] pgvector extension installed: `sudo apt-get install postgresql-16-pgvector`
- [ ] PostgreSQL restarted: `sudo systemctl restart postgresql`
- [ ] Fixed schema applied: `psql -f server/schema_enhanced_fixed.sql`
- [ ] Verification queries passed
- [ ] All 10 tables created
- [ ] All indexes created

---

## ⏭️ Next Steps

After successful schema installation:

1. **Install Node dependencies**: `cd server && npm install`
2. **Configure environment**: Copy `.env.example` to `.env`
3. **Start Redis**: `redis-server`
4. **Start backend**: `npm run dev`
5. **Start frontend**: `cd ../client && npm run dev`

---

**Ready to proceed?** Run the fixed schema now:
```bash
psql -U postgres -h localhost -d drive_ai -f server/schema_enhanced_fixed.sql
```
