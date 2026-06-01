# TECHMA-TEST: Installation & Setup Guide v2.0

## Prerequisites

Before starting, ensure you have the following installed:

### System Requirements
- **Node.js**: v16.0.0 or higher
- **PostgreSQL**: v12 or higher
- **Redis**: v6.0 or higher (for job queue)
- **FFmpeg**: Latest version (for video processing)
- **Python**: 3.8+ (for Whisper/OpenAI audio processing)
- **Git**: For version control

### Operating Systems
- Linux (Ubuntu 20.04+ recommended)
- macOS (10.15+)
- Windows (with WSL2)

---

## Part 1: System Dependencies Installation

### Ubuntu/Debian
```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install core dependencies
sudo apt-get install -y \
  curl \
  wget \
  git \
  build-essential \
  python3-pip \
  postgresql \
  postgresql-contrib \
  redis-server \
  ffmpeg

# Install Node.js (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installations
node --version
npm --version
ffmpeg -version
redis-server --version
psql --version
python3 --version
```

### macOS (using Homebrew)
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install node postgresql redis ffmpeg python@3.11

# Start services
brew services start postgresql
brew services start redis
```

### Windows (with WSL2)
```powershell
# Install WSL2 Ubuntu
wsl --install -d Ubuntu-22.04

# Then follow Ubuntu instructions above
```

---

## Part 2: Python Environment (For Whisper)

```bash
# Install Python virtual environment
python3 -m venv ~/whisper-env

# Activate virtual environment
source ~/whisper-env/bin/activate  # Linux/macOS
# or
~/whisper-env\Scripts\activate  # Windows

# Install Whisper
pip install --upgrade pip
pip install openai-whisper
pip install torch torchaudio  # For GPU acceleration (optional)

# Verify Whisper
whisper --version

# For GPU support (CUDA)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

---

## Part 3: Database Setup

### PostgreSQL Configuration

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE USER techma_user WITH PASSWORD 'secure_password_here';
CREATE DATABASE techma_db OWNER techma_user;
GRANT ALL PRIVILEGES ON DATABASE techma_db TO techma_user;

# Enable pgvector extension
\c techma_db
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS uuid-ossp;

# Verify extensions
\dx

# Exit psql
\q
```

### Apply Schema

```bash
cd /path/to/TECHMA-TEST/server

# Apply enhanced schema
psql -U techma_user -d techma_db -f schema_enhanced.sql

# Verify tables
psql -U techma_user -d techma_db -c "\dt"
```

### Redis Configuration

```bash
# Start Redis server
redis-server

# Or as daemon
sudo systemctl start redis-server
sudo systemctl enable redis-server  # Enable on boot

# Verify Redis connection
redis-cli ping
# Expected output: PONG
```

---

## Part 4: Backend Setup

```bash
cd /path/to/TECHMA-TEST/server

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Environment Variables (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=techma_db
DB_USER=techma_user
DB_PASSWORD=secure_password_here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here_change_this
JWT_EXPIRATION=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# OpenAI API (Optional - for embeddings)
OPENAI_API_KEY=your_openai_api_key

# Whisper Configuration
WHISPER_MODEL=base  # tiny, base, small, medium, large
WHISPER_DEVICE=cpu  # cpu or cuda

# File Upload
MAX_FILE_SIZE=107374182400  # 100GB in bytes
UPLOAD_CHUNK_SIZE=5242880   # 5MB chunks
UPLOADS_DIR=./uploads

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Ollama (Optional - for local embeddings)
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=nomic-embed-text
```

### Install Dependencies

```bash
# Install from enhanced package.json
npm install -f
# OR manually install new packages
npm install @tus/server bull redis fluent-ffmpeg pdf-parse tesseract.js mammoth sharp pg-boss joi

# Install FFmpeg static bindings
npm install ffmpeg-static

# Verify installations
npm list --depth=0
```

### Create Upload Directory

```bash
mkdir -p uploads
chmod 755 uploads
mkdir -p uploads/chunks
chmod 755 uploads/chunks
mkdir -p uploads/temp
chmod 755 uploads/temp
```

### Start Backend

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run start

# Expected output:
# ✅ Server running on port 5000
# ✅ Database connected
# ✅ Redis connected
```

---

## Part 5: Frontend Setup

```bash
cd /path/to/TECHMA-TEST/client

# Copy environment template
cp .env.example .env

# Edit .env
nano .env
```

### Frontend Environment Variables (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### Install Dependencies & Start

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Expected output:
# ➜  Local:   http://localhost:5173/
```

---

## Part 6: Verification & Testing

### Check All Services

```bash
# Backend health
curl http://localhost:5000/api/health

# Frontend
open http://localhost:5173

# Redis
redis-cli ping

# PostgreSQL
psql -U techma_user -d techma_db -c "SELECT version();"

# FFmpeg
ffmpeg -version

# Whisper
whisper --version
```

### Database Health Check

```bash
psql -U techma_user -d techma_db

# Check tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

# Check extensions
SELECT * FROM pg_extension;

# Exit
\q
```

### Test Upload (using curl)

```bash
# Create test file
dd if=/dev/zero of=test_1gb.bin bs=1M count=1024

# Start resumable upload
curl -X POST http://localhost:5000/api/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "filename": "test_1gb.bin",
    "filesize": 1073741824,
    "filetype": "application/octet-stream"
  }'
```

---

## Part 7: Production Deployment

### Using PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'drive-ai-backend',
      script: './index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

### Using Docker

```bash
# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine

# Install FFmpeg and Python
RUN apk add --no-cache ffmpeg python3 py3-pip

# Install Whisper
RUN pip install openai-whisper

# Set working directory
WORKDIR /app

# Copy files
COPY package*.json ./
COPY server ./server

# Install dependencies
RUN npm ci --only=production

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
EOF

# Build and run
docker build -t drive-ai-server .
docker run -d \
  -p 5000:5000 \
  -e DB_HOST=host.docker.internal \
  -e REDIS_HOST=host.docker.internal \
  drive-ai-server
```

---

## Part 8: Monitoring & Logging

### Enable Logging

```bash
# Create logs directory
mkdir -p logs

# Update server to log to file
# In index.js add:
const fs = require('fs');
const logStream = fs.createWriteStream('./logs/server.log', { flags: 'a' });
// Pipe console.log to file
console.log = function(...args) {
  logStream.write(new Date().toISOString() + ' ' + args.join(' ') + '\n');
};
```

### Monitor Processes

```bash
# Check backend
pm2 status

# View logs
pm2 logs drive-ai-backend

# Monitor resources
pm2 monit
```

### Check Queue Status

```bash
# Redis queue monitoring
redis-cli

> LLEN bull:video-processing:waiting
> LLEN bull:transcription:waiting
> LLEN bull:embeddings:waiting

> QUIT
```

---

## Part 9: Troubleshooting

### Issue: FFmpeg not found
```bash
# Install FFmpeg
sudo apt-get install ffmpeg

# Or set FFmpeg path in code
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);
```

### Issue: pgvector extension not found
```bash
# Install pgvector
sudo apt-get install postgresql-$VERSION-pgvector
# Then in PostgreSQL:
CREATE EXTENSION vector;
```

### Issue: Redis connection failed
```bash
# Check Redis status
sudo systemctl status redis-server

# Restart Redis
sudo systemctl restart redis-server

# Or start manually
redis-server --daemonize yes
```

### Issue: Out of memory with large files
```bash
# Check available memory
free -h

# Increase swap (if needed)
sudo fallocate -l 50G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Issue: Slow transcription
```bash
# Use GPU acceleration for Whisper
# In .env: WHISPER_DEVICE=cuda

# Or install smaller model
WHISPER_MODEL=base  # or: tiny, small
```

---

## Part 10: Next Steps

1. **Configure Google OAuth**: Set up OAuth consent screen in Google Cloud Console
2. **Get Gemini API Key**: Visit https://makersuite.google.com/app/apikey
3. **Upload Test Files**: Try uploading different file types
4. **Test AI Features**: Ask questions about your files
5. **Monitor Performance**: Check processing times and accuracy

---

## Support & Resources

- **FFmpeg Documentation**: https://ffmpeg.org/documentation.html
- **Whisper Guide**: https://github.com/openai/whisper
- **PostgreSQL pgvector**: https://github.com/pgvector/pgvector
- **Gemini API Docs**: https://ai.google.dev/
- **Bull Queue Docs**: https://docs.bullmq.io/

---

## Summary

Your TECHMA-TEST 2.0 system is now configured to handle:
- ✅ Large video files (50GB+) with resumable uploads
- ✅ Automated video transcription
- ✅ Multi-format file processing (PDF, images, JSON)
- ✅ Vector embeddings for semantic search
- ✅ Advanced AI chat with RAG
- ✅ Async job processing with monitoring
