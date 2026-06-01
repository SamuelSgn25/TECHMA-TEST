/**
 * Embedding Service
 * Generates vector embeddings for semantic search
 * Supports multiple content types (text, transcripts, documents)
 */

const Bull = require('bull');
const axios = require('axios');
const { query } = require('../db');

// Initialize embedding queue
const embeddingQueue = new Bull('embeddings', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

class EmbeddingService {
  /**
   * Generate embeddings using OpenAI API (or local model)
   * Using text-embedding-3-small or Ollama for local deployment
   */
  static async generateEmbedding(text) {
    try {
      // Option 1: Using OpenAI API
      if (process.env.OPENAI_API_KEY) {
        return await this.generateWithOpenAI(text);
      }
      
      // Option 2: Using local Ollama
      if (process.env.OLLAMA_ENDPOINT) {
        return await this.generateWithOllama(text);
      }

      // Option 3: Using Google Generative AI (Gemini)
      if (process.env.GEMINI_API_KEY) {
        return await this.generateWithGemini(text);
      }

      throw new Error('No embedding service configured');
    } catch (error) {
      console.error('Embedding generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings using OpenAI API
   */
  static async generateWithOpenAI(text) {
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        input: text,
        model: 'text-embedding-3-small'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.data[0].embedding;
  }

  /**
   * Generate embeddings using local Ollama
   */
  static async generateWithOllama(text) {
    const response = await axios.post(
      `${process.env.OLLAMA_ENDPOINT}/api/embeddings`,
      {
        model: 'nomic-embed-text',
        prompt: text
      }
    );

    return response.data.embedding;
  }

  /**
   * Generate embeddings using Google Gemini
   */
  static async generateWithGemini(text) {
    const { TextServiceClient } = require('@google-ai/generativelanguage').v1;
    const client = new TextServiceClient({
      apiKey: process.env.GEMINI_API_KEY
    });

    const request = {
      model: 'models/embedding-001',
      text: text
    };

    const response = await client.embedText(request);
    return response.embedding.value;
  }

  /**
   * Chunk long text for embedding
   * Each chunk should be <= 2048 tokens (~8000 chars)
   */
  static chunkText(text, chunkSize = 8000) {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Generate and save embeddings for content
   */
  static async generateAndSaveEmbeddings(userId, fileId, content, contentType) {
    try {
      // Chunk content if too long
      const chunks = this.chunkText(content);
      
      console.log(`📊 Generating embeddings for ${chunks.length} chunks...`);

      const embeddings = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await this.generateEmbedding(chunk);

        // Save to database
        await query(
          `INSERT INTO file_embeddings (user_id, file_id, file_type, content_chunk, embedding)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            userId,
            fileId,
            contentType,
            chunk,
            JSON.stringify(embedding)
          ]
        );

        embeddings.push({ chunk, embedding });
        
        if ((i + 1) % 5 === 0) {
          console.log(`✅ Saved ${i + 1}/${chunks.length} embeddings`);
        }
      }

      return { success: true, totalChunks: chunks.length };
    } catch (error) {
      console.error('Failed to save embeddings:', error);
      throw error;
    }
  }

  /**
   * Semantic search across user's files
   */
  static async semanticSearch(userId, query, limit = 5, threshold = 0.7) {
    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Search similar embeddings using PostgreSQL pgvector
      const results = await this.searchSimilar(userId, queryEmbedding, limit, threshold);

      return results;
    } catch (error) {
      console.error('Semantic search failed:', error);
      throw error;
    }
  }

  /**
   * Search similar embeddings using cosine similarity
   * Requires pgvector extension in PostgreSQL
   */
  static async searchSimilar(userId, embedding, limit = 5, threshold = 0.7) {
    const results = await query(
      `SELECT 
        file_id,
        file_type,
        content_chunk,
        1 - (embedding <=> $1::vector) as similarity
       FROM file_embeddings
       WHERE user_id = $2 
       AND (1 - (embedding <=> $1::vector)) > $3
       ORDER BY similarity DESC
       LIMIT $4`,
      [
        JSON.stringify(embedding),
        userId,
        threshold,
        limit
      ]
    );

    return results.rows;
  }

  /**
   * Get file summary using embeddings
   * Extracts most important chunks
   */
  static async generateFileSummary(fileId, limit = 3) {
    const results = await query(
      `SELECT DISTINCT content_chunk, file_type
       FROM file_embeddings
       WHERE file_id = $1
       GROUP BY content_chunk, file_type
       LIMIT $2`,
      [fileId, limit]
    );

    return results.rows.map(r => r.content_chunk).join(' ... ');
  }
}

// Process embedding queue
embeddingQueue.process(async (job) => {
  const { userId, fileId, content, contentType } = job.data;

  try {
    console.log(`🔄 Processing embeddings for file: ${fileId}`);

    const result = await EmbeddingService.generateAndSaveEmbeddings(
      userId,
      fileId,
      content,
      contentType
    );

    console.log(`✅ Embeddings generated for file ${fileId}`);
    return result;
  } catch (error) {
    console.error(`❌ Embedding job failed for ${fileId}:`, error);
    throw error;
  }
});

embeddingQueue.on('completed', (job) => {
  console.log(`✅ Embedding job ${job.id} completed`);
});

embeddingQueue.on('failed', (job, err) => {
  console.error(`❌ Embedding job ${job.id} failed:`, err.message);
});

module.exports = { EmbeddingService, embeddingQueue };
