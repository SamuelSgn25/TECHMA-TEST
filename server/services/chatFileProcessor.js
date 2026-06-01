/**
 * Chat File Processor
 * Extracts content from various file formats for AI chat
 * Supports: PDF, DOCX, Images (OCR), Audio, Video
 */

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const { execSync } = require('child_process');

ffmpeg.setFfmpegPath(ffmpegStatic);

class ChatFileProcessor {
  /**
   * Determine file type and extract content
   */
  static async extractContent(filePath, mimeType, fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const size = fs.statSync(filePath).size;

    console.log(`🔍 Processing file: ${fileName} (${(size / 1024 / 1024).toFixed(2)}MB, ${mimeType})`);

    try {
      // PDF files
      if (mimeType.includes('pdf') || ext === '.pdf') {
        return await this.processPDF(filePath, fileName);
      }

      // Word documents
      if (mimeType.includes('wordprocessingml') || mimeType.includes('msword') || ext === '.docx') {
        return await this.processDocx(filePath, fileName);
      }

      // Images (OCR)
      if (mimeType.includes('image') || ['.png', '.jpg', '.jpeg', '.gif', '.bmp'].includes(ext)) {
        return await this.processImage(filePath, fileName);
      }

      // Audio files
      if (mimeType.includes('audio') || ['.mp3', '.wav', '.m4a', '.flac', '.ogg'].includes(ext)) {
        return await this.processAudio(filePath, fileName);
      }

      // Video files
      if (mimeType.includes('video') || ['.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv'].includes(ext)) {
        return await this.processVideo(filePath, fileName);
      }

      // Plain text
      if (mimeType.includes('text') || ext === '.txt') {
        return await this.processText(filePath, fileName);
      }

      // JSON
      if (mimeType.includes('json') || ext === '.json') {
        return await this.processJSON(filePath, fileName);
      }

      throw new Error(`Format non supporté: ${mimeType}`);
    } catch (error) {
      console.error(`❌ File processing error:`, error);
      throw error;
    }
  }

  /**
   * Process PDF files
   */
  static async processPDF(filePath, fileName) {
    try {
      console.log(`📄 Extracting PDF content...`);
      
      const pdfBuffer = fs.readFileSync(filePath);
      const pdfData = await pdf(pdfBuffer);

      const content = `
=== PDF: ${fileName} ===
Pages: ${pdfData.numpages}
Language: ${pdfData.metadata?.metadata?.['dc:language'] || 'unknown'}

CONTENT:
${pdfData.text.substring(0, 10000)}
${pdfData.text.length > 10000 ? '\n[...contenu tronqué...]' : ''}
      `.trim();

      return {
        success: true,
        content,
        metadata: {
          type: 'pdf',
          pages: pdfData.numpages,
          fileName
        }
      };
    } catch (error) {
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }

  /**
   * Process DOCX files
   */
  static async processDocx(filePath, fileName) {
    try {
      console.log(`📋 Extracting DOCX content...`);
      
      const buffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer });

      const content = `
=== DOCUMENT: ${fileName} ===
${result.value.substring(0, 10000)}
${result.value.length > 10000 ? '\n[...contenu tronqué...]' : ''}
      `.trim();

      return {
        success: true,
        content,
        metadata: {
          type: 'docx',
          wordCount: result.value.split(/\s+/).length,
          fileName
        }
      };
    } catch (error) {
      throw new Error(`DOCX processing failed: ${error.message}`);
    }
  }

  /**
   * Process image files with OCR
   */
  static async processImage(filePath, fileName) {
    try {
      console.log(`🖼️ Extracting text from image...`);
      
      const result = await Tesseract.recognize(filePath);
      const text = result.data.text;

      const content = `
=== IMAGE OCR: ${fileName} ===
Confidence: ${result.data.confidence.toFixed(2)}%

TEXT DETECTED:
${text.substring(0, 5000)}
${text.length > 5000 ? '\n[...texte tronqué...]' : ''}
      `.trim();

      return {
        success: true,
        content,
        metadata: {
          type: 'image',
          confidence: result.data.confidence,
          fileName
        }
      };
    } catch (error) {
      throw new Error(`Image OCR failed: ${error.message}`);
    }
  }

  /**
   * Process audio files (transcription)
   */
  static async processAudio(filePath, fileName) {
    try {
      console.log(`🎙️ Transcribing audio...`);

      // Check if Whisper is installed
      try {
        execSync('whisper --version', { stdio: 'pipe' });
      } catch {
        throw new Error('Whisper not installed. Install with: pip install openai-whisper');
      }

      const outputDir = path.dirname(filePath);
      const tempOutput = path.join(outputDir, `temp_${Date.now()}`);

      // Use smaller model for faster processing
      const cmd = `whisper "${filePath}" --model tiny --language fr --output_format json --output_dir "${tempOutput}"`;
      
      try {
        execSync(cmd, { stdio: 'pipe', timeout: 600000 }); // 10 min timeout
      } catch (execError) {
        console.warn('Whisper processing warning:', execError.message);
      }

      // Find and read the output JSON
      const jsonFiles = fs.readdirSync(tempOutput).filter(f => f.endsWith('.json'));
      if (jsonFiles.length === 0) {
        throw new Error('Whisper output not found');
      }

      const outputFile = path.join(tempOutput, jsonFiles[0]);
      const transcript = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));

      // Cleanup
      try {
        fs.rmSync(tempOutput, { recursive: true });
      } catch (e) {
        console.warn('Cleanup warning:', e.message);
      }

      const content = `
=== AUDIO TRANSCRIPT: ${fileName} ===
Duration: Estimated from file
Language: ${transcript.language || 'auto-detected'}

TRANSCRIPT:
${transcript.text.substring(0, 10000)}
${transcript.text.length > 10000 ? '\n[...transcript tronqué...]' : ''}
      `.trim();

      return {
        success: true,
        content,
        metadata: {
          type: 'audio',
          language: transcript.language,
          fileName,
          isTranscribed: true
        }
      };
    } catch (error) {
      console.error('Audio processing error:', error);
      throw new Error(`Audio processing failed: ${error.message}`);
    }
  }

  /**
   * Process video files (metadata + transcription if audio)
   */
  static async processVideo(filePath, fileName) {
    try {
      console.log(`🎬 Processing video...`);

      // Extract metadata
      const metadata = await this.getVideoMetadata(filePath);

      let transcriptContent = '';
      if (metadata.hasAudio) {
        try {
          console.log(`🎙️ Extracting audio from video for transcription...`);
          
          // Extract audio to temporary file
          const outputDir = path.dirname(filePath);
          const audioPath = path.join(outputDir, `temp_audio_${Date.now()}.wav`);

          await new Promise((resolve, reject) => {
            ffmpeg(filePath)
              .output(audioPath)
              .audioCodec('pcm_s16le')
              .on('end', resolve)
              .on('error', reject)
              .run();
          });

          // Transcribe extracted audio
          try {
            execSync('whisper --version', { stdio: 'pipe' });

            const tempOutput = path.join(outputDir, `temp_${Date.now()}`);
            const cmd = `whisper "${audioPath}" --model tiny --language fr --output_format json --output_dir "${tempOutput}"`;

            try {
              execSync(cmd, { stdio: 'pipe', timeout: 600000 });
            } catch (e) {
              console.warn('Whisper warning:', e.message);
            }

            const jsonFiles = fs.readdirSync(tempOutput).filter(f => f.endsWith('.json'));
            if (jsonFiles.length > 0) {
              const outputFile = path.join(tempOutput, jsonFiles[0]);
              const transcript = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
              transcriptContent = `\n\nTRANSCRIPT:\n${transcript.text.substring(0, 8000)}`;

              try {
                fs.rmSync(tempOutput, { recursive: true });
              } catch (e) {
                console.warn('Cleanup warning:', e.message);
              }
            }
          } catch (transcribeError) {
            console.warn('Transcription not available:', transcribeError.message);
          }

          // Cleanup audio file
          try {
            fs.unlinkSync(audioPath);
          } catch (e) {
            console.warn('Audio cleanup warning:', e.message);
          }
        } catch (audioError) {
          console.warn('Audio extraction failed:', audioError.message);
        }
      }

      const content = `
=== VIDEO: ${fileName} ===
Duration: ${Math.floor(metadata.duration / 60)} minutes
Size: ${(metadata.size / 1024 / 1024 / 1024).toFixed(2)} GB
Format: ${metadata.format}
Has Video: ${metadata.hasVideo ? 'Yes' : 'No'}
Has Audio: ${metadata.hasAudio ? 'Yes' : 'No'}
${transcriptContent}
      `.trim();

      return {
        success: true,
        content,
        metadata: {
          type: 'video',
          duration: metadata.duration,
          size: metadata.size,
          fileName,
          hasAudio: metadata.hasAudio,
          hasVideo: metadata.hasVideo
        }
      };
    } catch (error) {
      console.error('Video processing error:', error);
      throw new Error(`Video processing failed: ${error.message}`);
    }
  }

  /**
   * Extract video metadata
   */
  static getVideoMetadata(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) reject(err);
        else {
          resolve({
            duration: metadata.format.duration || 0,
            size: metadata.format.size || 0,
            bitrate: metadata.format.bit_rate || 0,
            format: metadata.format.format_name || 'unknown',
            hasVideo: metadata.streams.some(s => s.codec_type === 'video'),
            hasAudio: metadata.streams.some(s => s.codec_type === 'audio')
          });
        }
      });
    });
  }

  /**
   * Process plain text files
   */
  static async processText(filePath, fileName) {
    try {
      console.log(`📝 Reading text file...`);
      
      const text = fs.readFileSync(filePath, 'utf-8');
      const content = `
=== TEXT FILE: ${fileName} ===
${text.substring(0, 10000)}
${text.length > 10000 ? '\n[...contenu tronqué...]' : ''}
      `.trim();

      return {
        success: true,
        content,
        metadata: {
          type: 'text',
          wordCount: text.split(/\s+/).length,
          fileName
        }
      };
    } catch (error) {
      throw new Error(`Text processing failed: ${error.message}`);
    }
  }

  /**
   * Process JSON files
   */
  static async processJSON(filePath, fileName) {
    try {
      console.log(`📊 Processing JSON file...`);
      
      const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const jsonString = JSON.stringify(jsonData, null, 2);

      const content = `
=== JSON FILE: ${fileName} ===
${jsonString.substring(0, 10000)}
${jsonString.length > 10000 ? '\n[...contenu tronqué...]' : ''}
      `.trim();

      return {
        success: true,
        content,
        metadata: {
          type: 'json',
          fileName
        }
      };
    } catch (error) {
      throw new Error(`JSON processing failed: ${error.message}`);
    }
  }
}

module.exports = ChatFileProcessor;
