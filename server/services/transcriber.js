/**
 * Transcription Service
 * Handles video transcription using Whisper
 * Supports batching for large files
 */

const Bull = require('bull');
const path = require('path');
const { execSync } = require('child_process');
const { query } = require('../db');
const fs = require('fs');

// Initialize transcription queue
const transcriptionQueue = new Bull('transcription', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

class TranscriptionService {
  /**
   * Check if Whisper is installed
   */
  static async checkWhisperInstallation() {
    try {
      execSync('whisper --version', { stdio: 'pipe' });
      return true;
    } catch (error) {
      console.error('Whisper not found. Install with: pip install openai-whisper');
      return false;
    }
  }

  /**
   * Transcribe a single video file or segment
   */
  static async transcribeFile(filePath, language = 'auto', model = 'base') {
    try {
      console.log(`🎙️  Transcribing: ${filePath}`);
      
      const outputDir = path.dirname(filePath);
      const outputFile = path.join(outputDir, `${path.basename(filePath)}_transcript.json`);

      // Run Whisper CLI
      const cmd = `whisper "${filePath}" --model ${model} --language ${language} --output_format json --output_dir "${outputDir}"`;
      
      execSync(cmd, { stdio: 'inherit' });

      // Read and parse the JSON output
      const transcript = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
      
      return {
        text: transcript.text,
        segments: transcript.segments,
        language: transcript.language
      };
    } catch (error) {
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  /**
   * Transcribe video segments in parallel
   */
  static async transcribeSegments(segmentFiles, maxConcurrent = 3) {
    const results = [];
    
    for (let i = 0; i < segmentFiles.length; i += maxConcurrent) {
      const batch = segmentFiles.slice(i, i + maxConcurrent);
      const batchResults = await Promise.all(
        batch.map(file => this.transcribeFile(file))
      );
      results.push(...batchResults);
      
      console.log(`✅ Processed ${Math.min(i + maxConcurrent, segmentFiles.length)}/${segmentFiles.length} segments`);
    }
    
    return results;
  }

  /**
   * Merge segmented transcripts into continuous transcript
   */
  static mergeTranscripts(segmentTranscripts) {
    const mergedText = segmentTranscripts
      .map(t => t.text)
      .join(' ');

    // Merge segments with adjusted timestamps
    let timeOffset = 0;
    const mergedSegments = [];

    segmentTranscripts.forEach((transcript, idx) => {
      if (transcript.segments) {
        const adjustedSegments = transcript.segments.map(seg => ({
          ...seg,
          start: seg.start + timeOffset,
          end: seg.end + timeOffset,
          segment_index: idx
        }));
        mergedSegments.push(...adjustedSegments);
        
        // Calculate time offset for next segment
        if (transcript.segments.length > 0) {
          timeOffset = adjustedSegments[adjustedSegments.length - 1].end;
        }
      }
    });

    return {
      text: mergedText,
      segments: mergedSegments,
      language: segmentTranscripts[0]?.language || 'en'
    };
  }

  /**
   * Save transcription to database
   */
  static async saveTranscription(videoId, transcriptData) {
    return await query(
      `INSERT INTO video_transcripts (video_id, transcript, segments, language, confidence)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        videoId,
        transcriptData.text,
        JSON.stringify(transcriptData.segments),
        transcriptData.language,
        0.95 // Default confidence
      ]
    );
  }

  /**
   * Update video transcription status
   */
  static async updateTranscriptionStatus(videoId, status) {
    return await query(
      `UPDATE videos SET transcription_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [status, videoId]
    );
  }

  /**
   * Generate transcript summary using AI
   */
  static async generateSummary(transcriptText, maxLength = 500) {
    // This will be implemented with Gemini API
    // For now, return basic summary
    const sentences = transcriptText.split('. ');
    const summary = sentences.slice(0, 5).join('. ');
    return summary.substring(0, maxLength);
  }
}

// Process transcription queue
transcriptionQueue.process(async (job) => {
  const { videoId, userId, filePath, segments = [] } = job.data;

  try {
    await TranscriptionService.updateTranscriptionStatus(videoId, 'processing');

    // Check if video needs segmentation
    let transcriptData;
    
    if (segments.length > 0) {
      // Transcribe segments in parallel (max 3 concurrent)
      console.log(`🎙️  Transcribing ${segments.length} segments...`);
      const segmentResults = await TranscriptionService.transcribeSegments(segments, 3);
      transcriptData = TranscriptionService.mergeTranscripts(segmentResults);
    } else {
      // Single file transcription
      transcriptData = await TranscriptionService.transcribeFile(filePath);
    }

    // Save to database
    const result = await TranscriptionService.saveTranscription(videoId, transcriptData);

    // Generate embeddings for semantic search
    await embeddingQueue.add(
      {
        videoId,
        userId,
        content: transcriptData.text,
        contentType: 'video_transcript'
      },
      { priority: 10 }
    );

    await TranscriptionService.updateTranscriptionStatus(videoId, 'completed');

    console.log(`✅ [${videoId}] Transcription completed`);
    return { success: true, transcriptLength: transcriptData.text.length };
  } catch (error) {
    console.error(`❌ [${videoId}] Transcription failed:`, error);
    await TranscriptionService.updateTranscriptionStatus(videoId, 'failed');
    throw error;
  }
});

transcriptionQueue.on('completed', (job) => {
  console.log(`✅ Transcription job ${job.id} completed`);
});

transcriptionQueue.on('failed', (job, err) => {
  console.error(`❌ Transcription job ${job.id} failed:`, err.message);
});

module.exports = { TranscriptionService, transcriptionQueue };
