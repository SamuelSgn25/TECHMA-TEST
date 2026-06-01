# Enhanced API Documentation - Drive AI 2.0

## Table of Contents
1. [Upload Endpoints](#upload-endpoints)
2. [Video Processing Endpoints](#video-processing-endpoints)
3. [AI Chat Endpoints](#ai-chat-endpoints)
4. [File Processing Endpoints](#file-processing-endpoints)
5. [Transcription Endpoints](#transcription-endpoints)

---

## Upload Endpoints

### Resumable Upload (Tus Protocol)

#### POST `/api/upload`
Initiate a resumable upload session.

**Request:**
```json
{
  "filename": "large-video.mp4",
  "filesize": 53687091200,
  "filetype": "video/mp4"
}
```

**Response:**
```json
{
  "uploadId": "550e8400-e29b-41d4-a716-446655440000",
  "chunkSize": 5242880,
  "totalChunks": 10240
}
```

#### PATCH `/api/upload/{uploadId}`
Upload a chunk. The client is responsible for splitting the file and uploading each chunk.

**Headers:**
```
Upload-Offset: 0
Upload-Length: 53687091200
Content-Type: application/offset+octet-stream
```

**Body:** Binary chunk data

**Response:**
```json
{
  "offset": 5242880,
  "progress": 4.88
}
```

#### GET `/api/upload/{uploadId}/status`
Get upload status and resume information.

**Response:**
```json
{
  "uploadId": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "large-video.mp4",
  "totalSize": 53687091200,
  "uploadedSize": 26843545600,
  "progress": 50,
  "status": "active",
  "lastChunkNumber": 5120,
  "expiresAt": "2024-05-21T10:30:00Z"
}
```

#### POST `/api/upload/{uploadId}/complete`
Mark upload as complete and start processing.

**Response:**
```json
{
  "success": true,
  "videoId": "v_550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "message": "Upload completed. Processing started."
}
```

---

## Video Processing Endpoints

### GET `/api/videos`
List user's videos with metadata.

**Query Parameters:**
```
?status=completed&sort=-created_at&limit=20&offset=0
```

**Response:**
```json
{
  "videos": [
    {
      "id": "v_550e8400-e29b-41d4-a716-446655440000",
      "filename": "large-video.mp4",
      "fileSize": 53687091200,
      "duration": 3600,
      "framerate": 30,
      "resolution": "1920x1080",
      "status": "completed",
      "transcriptionStatus": "completed",
      "thumbnailPath": "/uploads/v_550e8400_thumb.jpg",
      "createdAt": "2024-05-20T10:00:00Z",
      "updatedAt": "2024-05-20T10:45:00Z"
    }
  ],
  "total": 42,
  "page": 1
}
```

### GET `/api/videos/{videoId}`
Get detailed video information.

**Response:**
```json
{
  "id": "v_550e8400-e29b-41d4-a716-446655440000",
  "filename": "large-video.mp4",
  "fileSize": 53687091200,
  "duration": 3600,
  "metadata": {
    "codec_video": "h264",
    "codec_audio": "aac",
    "bitrate": 5000000,
    "framerate": 30,
    "resolution": "1920x1080"
  },
  "status": "completed",
  "transcriptionStatus": "completed",
  "uploadProgress": 100,
  "thumbnail": "/uploads/v_550e8400_thumb.jpg",
  "createdAt": "2024-05-20T10:00:00Z"
}
```

### DELETE `/api/videos/{videoId}`
Delete a video and its transcription.

**Response:**
```json
{
  "success": true,
  "message": "Video deleted successfully"
}
```

---

## AI Chat Endpoints

### POST `/api/ai/chat`
Main endpoint for AI chat with semantic search.

**Request:**
```json
{
  "query": "Quelle est la conclusion principale de cette vidéo?",
  "fileIds": ["v_550e8400-e29b-41d4-a716-446655440000"],
  "conversationId": "conv_12345",
  "temperature": 0.7,
  "useSemanticSearch": true,
  "maxSourcesUsed": 3
}
```

**Response:**
```json
{
  "response": "La conclusion principale est...",
  "sources": [
    {
      "fileId": "v_550e8400-e29b-41d4-a716-446655440000",
      "type": "video",
      "similarity": 0.95
    }
  ],
  "followUpQuestions": [
    "Peux-tu détailler cette réponse?",
    "Y a-t-il d'autres perspectives?"
  ],
  "tokensUsed": 245
}
```

### GET `/api/ai/conversations`
List user's AI conversations.

**Query Parameters:**
```
?sort=-updatedAt&limit=20
```

**Response:**
```json
{
  "conversations": [
    {
      "id": "conv_12345",
      "title": "Analysis of Q1 Report",
      "summary": "Discussed key metrics and trends",
      "messageCount": 8,
      "lastMessageAt": "2024-05-20T15:30:00Z",
      "createdAt": "2024-05-20T10:00:00Z"
    }
  ],
  "total": 15
}
```

### GET `/api/ai/conversations/{conversationId}`
Get conversation history.

**Query Parameters:**
```
?limit=50&offset=0
```

**Response:**
```json
{
  "conversation": {
    "id": "conv_12345",
    "title": "Analysis of Q1 Report",
    "messages": [
      {
        "id": "msg_1",
        "role": "user",
        "content": "Résume cette vidéo",
        "fileReferences": [
          {
            "fileId": "v_550e8400",
            "fileName": "presentation.mp4",
            "type": "video"
          }
        ],
        "createdAt": "2024-05-20T10:00:00Z"
      },
      {
        "id": "msg_2",
        "role": "assistant",
        "content": "Cette présentation couvre...",
        "tokensUsed": 150,
        "createdAt": "2024-05-20T10:01:00Z"
      }
    ]
  }
}
```

### POST `/api/ai/conversations`
Create new conversation.

**Request:**
```json
{
  "title": "Budget Review 2024"
}
```

**Response:**
```json
{
  "id": "conv_new123",
  "title": "Budget Review 2024",
  "createdAt": "2024-05-20T16:00:00Z"
}
```

### DELETE `/api/ai/conversations/{conversationId}`
Delete a conversation.

**Response:**
```json
{
  "success": true,
  "message": "Conversation deleted"
}
```

---

## File Processing Endpoints

### POST `/api/files/upload`
Upload small files (< 500MB) - uses standard multipart.

**Form Data:**
```
file: <binary>
folder_id: optional
```

**Response:**
```json
{
  "id": "f_550e8400-e29b-41d4-a716-446655440000",
  "filename": "document.pdf",
  "fileSize": 2567890,
  "fileType": "pdf",
  "uploadedAt": "2024-05-20T10:00:00Z"
}
```

### POST `/api/files/{fileId}/process`
Manually trigger file processing/extraction.

**Request:**
```json
{
  "extractMetadata": true,
  "generateEmbeddings": true
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "job_550e8400",
  "status": "queued",
  "estimatedTime": 45
}
```

### GET `/api/files/{fileId}/content`
Get processed file content.

**Response:**
```json
{
  "fileId": "f_550e8400",
  "filename": "document.pdf",
  "fileType": "pdf",
  "content": "Extracted text content...",
  "metadata": {
    "pages": 23,
    "language": "fr",
    "createdDate": "2024-01-15"
  }
}
```

### POST `/api/files/search`
Semantic search across all user files.

**Request:**
```json
{
  "query": "budget analysis",
  "limit": 5,
  "similarityThreshold": 0.7,
  "fileTypes": ["pdf", "video", "document"]
}
```

**Response:**
```json
{
  "results": [
    {
      "fileId": "f_550e8400",
      "filename": "Budget 2024.pdf",
      "fileType": "pdf",
      "content": "Budget allocations include...",
      "similarity": 0.92
    },
    {
      "fileId": "v_550e8401",
      "filename": "CFO Presentation.mp4",
      "fileType": "video",
      "transcriptSnippet": "We reviewed the budget...",
      "similarity": 0.87
    }
  ],
  "searchTime": 234
}
```

---

## Transcription Endpoints

### GET `/api/videos/{videoId}/transcript`
Get video transcript.

**Query Parameters:**
```
?format=text|json|srt
```

**Response (JSON):**
```json
{
  "videoId": "v_550e8400",
  "language": "en",
  "fullText": "Complete transcript text...",
  "segments": [
    {
      "start": 0,
      "end": 5.2,
      "text": "Good morning everyone"
    },
    {
      "start": 5.2,
      "end": 12.3,
      "text": "Today we'll discuss..."
    }
  ],
  "accuracy": 0.95,
  "generatedAt": "2024-05-20T10:45:00Z"
}
```

### POST `/api/videos/{videoId}/transcript/search`
Search within video transcript.

**Request:**
```json
{
  "query": "budget",
  "limit": 5
}
```

**Response:**
```json
{
  "results": [
    {
      "segment": 12,
      "start": 245.3,
      "end": 258.7,
      "text": "The budget for next year...",
      "relevance": 0.98
    }
  ]
}
```

### POST `/api/videos/{videoId}/transcript/export`
Export transcript in various formats.

**Request:**
```json
{
  "format": "pdf|docx|srt|vtt",
  "includeTimestamps": true,
  "includeTimecodes": true
}
```

**Response:**
Binary file download with appropriate Content-Type header.

---

## Processing Jobs Endpoints

### GET `/api/jobs`
List processing jobs for user.

**Query Parameters:**
```
?status=processing,completed&sort=-createdAt&limit=20
```

**Response:**
```json
{
  "jobs": [
    {
      "id": "job_550e8400",
      "fileId": "v_550e8400",
      "jobType": "transcription",
      "status": "processing",
      "progress": 75,
      "estimatedTimeRemaining": 12,
      "createdAt": "2024-05-20T10:00:00Z",
      "updatedAt": "2024-05-20T10:35:00Z"
    }
  ],
  "total": 3
}
```

### GET `/api/jobs/{jobId}`
Get job details and status.

**Response:**
```json
{
  "id": "job_550e8400",
  "fileId": "v_550e8400",
  "jobType": "transcription",
  "status": "processing",
  "progress": 75,
  "metadata": {
    "totalSegments": 100,
    "processedSegments": 75
  },
  "createdAt": "2024-05-20T10:00:00Z"
}
```

---

## Error Responses

All endpoints can return these error codes:

### 400 Bad Request
```json
{
  "error": "Invalid request",
  "details": "File size exceeds maximum allowed (100GB)"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Please authenticate first"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

### 500 Internal Server Error
```json
{
  "error": "Server error",
  "jobId": "job_550e8400",
  "message": "An error occurred during processing"
}
```

---

## WebSocket Events (For Real-time Updates)

### Connection
```javascript
const ws = new WebSocket('wss://api.example.com/ws?token=jwt_token');
```

### Upload Progress
```json
{
  "event": "upload:progress",
  "uploadId": "550e8400-e29b-41d4-a716-446655440000",
  "progress": 45.5,
  "bytesTransferred": 24423654400
}
```

### Processing Progress
```json
{
  "event": "job:progress",
  "jobId": "job_550e8400",
  "status": "processing",
  "progress": 75,
  "message": "Processing video segments..."
}
```

### Processing Complete
```json
{
  "event": "job:completed",
  "jobId": "job_550e8400",
  "fileId": "v_550e8400",
  "result": {
    "transcriptLength": 8543,
    "accuracy": 0.95
  }
}
```

---

## Authentication

All requests (except `/api/auth/login`, `/api/auth/register`) require:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Rate Limits

- **Default**: 100 requests/minute per user
- **Upload**: 5 concurrent uploads per user
- **AI Chat**: 30 requests/minute per user
- **Processing Jobs**: 10 concurrent jobs per user

---

## Implementation Notes

1. **Large File Handling**: Use the Tus resumable upload endpoint for files > 500MB
2. **Async Processing**: All long-running operations (transcription, embedding generation) are queued and processed asynchronously
3. **Semantic Search**: Requires vector embeddings to be generated first
4. **Rate Limiting**: Implement backoff strategies in client applications
