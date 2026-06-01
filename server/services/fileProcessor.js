/**
 * Universal File Processor
 * Handles multiple file formats (PDF, Image, JSON, DOCX, Video, Audio)
 */

const pdf = require('pdf-parse');
const Tesseract = require('tesseract.js');
const mammoth = require('mammoth');
const { query } = require('../db');
const fs = require('fs');
const path = require('path');

class FileProcessor {
  static processors = {};

  /**
   * Process PDF files - extract text and metadata
   */
  static async processPDF(filePath) {
    try {
      console.log(`📄 Processing PDF: ${filePath}`);

      const pdfBuffer = fs.readFileSync(filePath);
      const pdfData = await pdf(pdfBuffer);

      return {
        type: 'pdf',
        text: pdfData.text,
        pages: pdfData.numpages,
        metadata: pdfData.metadata,
        info: pdfData.info,
        version: pdfData.version
      };
    } catch (error) {
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }

  /**
   * Process Image files - extract text using OCR
   */
  static async processImage(filePath) {
    try {
      console.log(`🖼️  Processing Image: ${filePath}`);

      const result = await Tesseract.recognize(filePath);
      
      return {
        type: 'image',
        text: result.data.text,
        confidence: result.data.confidence,
        languages: result.data.paragraphs
      };
    } catch (error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  /**
   * Process DOCX/DOCM files - extract text
   */
  static async processDocx(filePath) {
    try {
      console.log(`📋 Processing DOCX: ${filePath}`);

      const buffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer });

      return {
        type: 'docx',
        text: result.value,
        messages: result.messages // Any warnings/errors
      };
    } catch (error) {
      throw new Error(`DOCX processing failed: ${error.message}`);
    }
  }

  /**
   * Process JSON files - extract structured data
   */
  static async processJSON(filePath) {
    try {
      console.log(`📊 Processing JSON: ${filePath}`);

      const content = fs.readFileSync(filePath, 'utf-8');
      const jsonData = JSON.parse(content);

      // Convert to readable text
      const text = this.jsonToText(jsonData);

      return {
        type: 'json',
        text: text,
        schema: this.analyzeJsonSchema(jsonData),
        data: jsonData
      };
    } catch (error) {
      throw new Error(`JSON processing failed: ${error.message}`);
    }
  }

  /**
   * Convert JSON object to readable text
   */
  static jsonToText(obj, depth = 0) {
    const indent = '  '.repeat(depth);
    let text = '';

    if (typeof obj === 'string') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.jsonToText(item, depth + 1)).join('\n');
    }

    if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        text += `${indent}${key}: `;
        if (typeof value === 'object') {
          text += '\n' + this.jsonToText(value, depth + 1);
        } else {
          text += String(value);
        }
        text += '\n';
      }
    }

    return text;
  }

  /**
   * Analyze JSON schema/structure
   */
  static analyzeJsonSchema(obj) {
    const schema = {};
    
    if (Array.isArray(obj) && obj.length > 0) {
      schema.type = 'array';
      schema.itemSchema = this.getObjectSchema(obj[0]);
    } else if (typeof obj === 'object' && obj !== null) {
      schema.type = 'object';
      schema.properties = this.getObjectSchema(obj);
    }

    return schema;
  }

  /**
   * Get schema of object
   */
  static getObjectSchema(obj) {
    const schema = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null) {
        schema[key] = 'null';
      } else if (Array.isArray(value)) {
        schema[key] = 'array';
      } else {
        schema[key] = typeof value;
      }
    }

    return schema;
  }

  /**
   * Process text files - extract content
   */
  static async processText(filePath) {
    try {
      console.log(`📝 Processing Text: ${filePath}`);

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').length;

      return {
        type: 'text',
        text: content,
        lines: lines,
        size: content.length
      };
    } catch (error) {
      throw new Error(`Text processing failed: ${error.message}`);
    }
  }

  /**
   * Route file to appropriate processor
   */
  static async processFile(filePath, mimeType) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    try {
      switch (mimeType) {
        case 'application/pdf':
          return await this.processPDF(filePath);

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          return await this.processDocx(filePath);

        case 'application/json':
          return await this.processJSON(filePath);

        case 'text/plain':
        case 'text/csv':
        case 'text/html':
        case 'text/xml':
          return await this.processText(filePath);

        case 'image/jpeg':
        case 'image/png':
        case 'image/webp':
          return await this.processImage(filePath);

        default:
          // Try to process as text
          if (mimeType.startsWith('text/')) {
            return await this.processText(filePath);
          }
          throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      console.error(`Error processing file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Save processed content to database
   */
  static async saveProcessedContent(userId, fileId, fileName, content, metadata = {}) {
    try {
      await query(
        `INSERT INTO processed_files (user_id, file_id, file_name, file_type, content, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (file_id) DO UPDATE SET
         content = $5,
         metadata = $6,
         updated_at = CURRENT_TIMESTAMP`,
        [
          userId,
          fileId,
          fileName,
          metadata.type || 'unknown',
          content.text || content,
          JSON.stringify(metadata)
        ]
      );

      return { success: true, bytesProcessed: (content.text || content).length };
    } catch (error) {
      console.error('Failed to save processed content:', error);
      throw error;
    }
  }
}

module.exports = { FileProcessor };
