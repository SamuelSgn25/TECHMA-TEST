/**
 * Video Processing Service
 * Handles video uploads, transcription, and metadata extraction
 */

const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const Bull = require('bull');
const { query } = require('../db');

ffmpeg.setFfmpegPath(ffmpegStatic);

// Initialize Bull queue for async processing
const videoProcessingQueue = new Bull('video-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

class VideoProcessor {
  /**
   * Extract video metadata using FFprobe
   */
  static async getVideoMetadata(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) reject(err);
        else resolve({
          duration: metadata.format.duration,
          size: metadata.format.size,
          bitrate: metadata.format.bit_rate,
          streams: metadata.streams,
          format: metadata.format.format_name,
          hasVideo: metadata.streams.some(s => s.codec_type === 'video'),
          hasAudio: metadata.streams.some(s => s.codec_type === 'audio')
        });
      });
    });
  }

  /**
   * Generate thumbnail from video
   */
  static async generateThumbnail(filePath, outputPath, timestamp = '00:00:10') {
    return new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .screenshot({
          timestamps: [timestamp],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '320x180'
        })
        .on('end', () => resolve(outputPath))
        .on('error', reject);
    });
  }

  /**
   * Convert video to optimized format for streaming
   */
  static async createStreamingVersion(filePath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-preset fast',
          '-crf 28',
          '-b:v 2000k',
          '-maxrate 2500k',
          '-bufsize 5000k'
        ])
        .save(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .on('progress', (progress) => {
          console.log(`Conversion progress: ${progress.percent}%`);
        });
    });
  }

  /**
   * Chunk video into segments for transcription
   * Returns array of segment file paths
   */
  static async chunkVideoForTranscription(filePath, outputDir, segmentDuration = 600) {
    // 600 seconds = 10 minutes per segment
    return new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .outputOptions([
          `-f segment`,
          `-segment_time ${segmentDuration}`,
          `-c copy`
        ])
        .save(path.join(outputDir, 'segment_%03d.mp4'))
        .on('end', async () => {
          // Get list of created segments
          const files = fs.readdirSync(outputDir)
            .filter(f => f.startsWith('segment_'))
            .map(f => path.join(outputDir, f))
            .sort();
          resolve(files);
        })
        .on('error', reject);
    });
  }

  /**
   * Queue a video for processing
   */
  static async queueVideoForProcessing(videoId, userId, filePath) {
    const job = await videoProcessingQueue.add(
      { videoId, userId, filePath },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: true,
        timeout: 3600000 // 1 hour timeout
      }
    );
    return job;
  }

  /**
   * Mark video processing status
   */
  static async updateProcessingStatus(videoId, status, metadata = {}) {
    return await query(
      `UPDATE videos SET 
        status = $1,
        duration = COALESCE($2, duration),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [status, metadata.duration || null, videoId]
    );
  }
}

// Process video queue
videoProcessingQueue.process(async (job) => {
  const { videoId, userId, filePath } = job.data;

  try {
    // Step 1: Extract metadata
    console.log(`[${videoId}] Extracting metadata...`);
    const metadata = await VideoProcessor.getVideoMetadata(filePath);
    
    // Step 2: Generate thumbnail
    console.log(`[${videoId}] Generating thumbnail...`);
    const thumbnailPath = path.join(
      path.dirname(filePath),
      `${videoId}_thumb.jpg`
    );
    await VideoProcessor.generateThumbnail(filePath, thumbnailPath);

    // Step 3: Update database
    await VideoProcessor.updateProcessingStatus(videoId, 'processing', metadata);

    // Step 4: Queue for transcription (separate job)
    console.log(`[${videoId}] Queuing for transcription...`);
    await transcriptionQueue.add(
      { videoId, userId, filePath },
      { priority: 5 }
    );

    console.log(`[${videoId}] ✅ Video processing completed`);
    return { success: true, metadata };
  } catch (error) {
    console.error(`[${videoId}] ❌ Processing failed:`, error);
    await VideoProcessor.updateProcessingStatus(videoId, 'failed');
    throw error;
  }
});

// Handle job completion
videoProcessingQueue.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

videoProcessingQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

module.exports = { VideoProcessor, videoProcessingQueue };
