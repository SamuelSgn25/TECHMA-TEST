/**
 * Enhanced AI Service
 * RAG (Retrieval-Augmented Generation) implementation
 * Combines vector search with Gemini for better answers
 */

const axios = require('axios');
const { query } = require('../db');
const { EmbeddingService } = require('./embeddingService');

require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.0-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

class EnhancedAIService {
  /**
   * Enhanced chat with semantic search
   * Uses user's files as context via embeddings
   */
  static async chat(userId, prompt, conversationHistory = [], options = {}) {
    try {
      const {
        fileIds = [],
        temperature = 0.7,
        useSemanticSearch = true,
        maxSourcesUsed = 3
      } = options;

      let context = '';
      let sources = [];

      // Step 1: Perform semantic search if enabled
      if (useSemanticSearch) {
        console.log(`🔍 Searching for relevant context...`);
        const searchResults = await EmbeddingService.semanticSearch(
          userId,
          prompt,
          maxSourcesUsed,
          0.7 // similarity threshold
        );

        sources = searchResults;
        
        if (searchResults.length > 0) {
          context = '\n\n## RELEVANT CONTEXT FROM YOUR FILES:\n';
          searchResults.forEach((result, idx) => {
            context += `\n### Source ${idx + 1} (${result.file_type}, ${(result.similarity * 100).toFixed(1)}% match)\n`;
            context += result.content_chunk.substring(0, 500) + '...';
          });
        }
      }

      // Step 2: Specific file context if provided
      if (fileIds.length > 0) {
        context += await this.getFileContext(fileIds);
      }

      // Step 3: Build augmented prompt
      const augmentedPrompt = this.buildAugmentedPrompt(prompt, context);

      // Step 4: Build message history for Gemini
      const contents = this.formatConversationForGemini(conversationHistory, augmentedPrompt);

      // Step 5: Call Gemini API
      console.log(`🤖 Calling Gemini AI...`);
      const response = await axios.post(API_URL, 
        { 
          contents,
          generationConfig: {
            temperature: temperature,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048
          }
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      );

      const aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

      // Step 6: Generate follow-up suggestions
      const followUps = await this.generateFollowUpQuestions(aiResponse, prompt);

      return {
        response: aiResponse || "Pas de réponse générée.",
        sources: sources.map(s => ({
          fileId: s.file_id,
          type: s.file_type,
          similarity: s.similarity
        })),
        followUpQuestions: followUps,
        tokensUsed: response.data.usageMetadata?.totalTokenCount || 0
      };
    } catch (error) {
      console.error('AI Chat Error:', error);
      return this.handleAIError(error);
    }
  }

  /**
   * Build context string from specific files
   */
  static async getFileContext(fileIds) {
    try {
      if (fileIds.length === 0) return '';

      const placeholders = fileIds.map(() => '?').join(',');
      const results = await query(
        `SELECT file_id, file_name, content, file_type FROM processed_files WHERE file_id = ANY($1::uuid[])`,
        [fileIds]
      );

      let context = '\n\n## FILES UPLOADED FOR THIS QUERY:\n';
      results.rows.forEach((file, idx) => {
        context += `\n### [${idx + 1}] ${file.file_name} (${file.file_type})\n`;
        context += file.content.substring(0, 1000) + '...';
      });

      return context;
    } catch (error) {
      console.error('Error getting file context:', error);
      return '';
    }
  }

  /**
   * Build augmented prompt with context
   */
  static buildAugmentedPrompt(userPrompt, context) {
    const systemPrompt = `Tu es Drive AI, un assistant intelligent qui aide les utilisateurs à analyser leurs fichiers (vidéos, PDFs, images, JSON).

Tu as accès au contexte des fichiers de l'utilisateur ci-dessous. Utilise ce contexte pour répondre précisément à la question.

Si le contexte ne contient pas la réponse, dis-le clairement.

IMPORTANT: 
- Cite toujours les fichiers sources quand tu utilises leur contenu
- Sois concis mais complet
- Si tu analyses une vidéo transcrite, explique d'où vient cette information`;

    return `${systemPrompt}${context}\n\n## QUESTION DE L'UTILISATEUR:\n${userPrompt}`;
  }

  /**
   * Format conversation history for Gemini API
   */
  static formatConversationForGemini(history, currentPrompt) {
    let contents = history
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    // Ensure first message is from user
    while (contents.length > 0 && contents[0].role !== 'user') {
      contents.shift();
    }

    // Add current prompt
    contents.push({
      role: 'user',
      parts: [{ text: currentPrompt }]
    });

    return contents;
  }

  /**
   * Generate follow-up questions
   */
  static async generateFollowUpQuestions(response, originalQuestion) {
    try {
      // Use simple heuristics or call Gemini again for suggestions
      const followUps = [
        'Peux-tu détailler cette réponse?',
        'Quelles sont les implications de ce résultat?',
        'Y a-t-il d\'autres perspectives sur ce sujet?'
      ];

      return followUps;
    } catch (error) {
      return [];
    }
  }

  /**
   * Handle AI errors gracefully
   */
  static handleAIError(error) {
    const status = error.response?.status;
    const msg = error.response?.data?.error?.message || error.message;

    console.error(`❌ AI Error (${status}):`, msg);

    let userMessage = 'Une erreur est survenue avec l\'IA.';

    if (status === 429) {
      userMessage = '⏳ Le quota Gemini est temporairement atteint. Réessayez dans ~1 minute.';
    } else if (status === 400) {
      userMessage = '❌ Requête invalide. Vérifiez votre clé API Gemini.';
    } else if (status === 500) {
      userMessage = '❌ Erreur serveur Gemini. Réessayez plus tard.';
    }

    return {
      response: userMessage,
      sources: [],
      followUpQuestions: [],
      error: msg
    };
  }

  /**
   * Analyze specific file for insights
   */
  static async analyzeFile(userId, fileId, fileName, fileType, analysisType = 'general') {
    try {
      const prompt = this.getAnalysisPrompt(fileName, fileType, analysisType);
      
      return await this.chat(userId, prompt, [], {
        fileIds: [fileId],
        temperature: 0.5
      });
    } catch (error) {
      console.error('File analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get appropriate prompt for file analysis
   */
  static getAnalysisPrompt(fileName, fileType, analysisType) {
    const prompts = {
      general: `Analyse le fichier "${fileName}" et fournis un résumé des points clés.`,
      
      summary: `Crée un résumé détaillé de "${fileName}". Identifie:
        1. Le thème principal
        2. Les points clés
        3. Les conclusions ou recommandations`,
      
      technical: `Analyse technique de "${fileName}":
        1. Architecture/structure
        2. Technologies/outils utilisés
        3. Points forts et faiblesses`,
      
      content: `Quels sont les contenus importants dans "${fileName}"?
        Fournis des citations et des explications.`,
      
      video: `Basé sur la transcription, résume la vidéo:
        1. Sujet principal
        2. Points clés mentionnés
        3. Conclusions`
    };

    return prompts[analysisType] || prompts.general;
  }

  /**
   * Compare multiple files
   */
  static async compareFiles(userId, fileIds, comparisonType = 'general') {
    try {
      const prompt = `Compare les fichiers suivants:
        ${fileIds.map((id, idx) => `Fichier ${idx + 1}: [REF-${id}]`).join('\n')}
        
        Identifie les similarités, différences et relations entre ces documents.`;

      return await this.chat(userId, prompt, [], {
        fileIds: fileIds,
        temperature: 0.6,
        maxSourcesUsed: 5
      });
    } catch (error) {
      console.error('File comparison failed:', error);
      throw error;
    }
  }
}

module.exports = { EnhancedAIService };
