const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Normalizes and cleans raw text extracted from documents.
 * Removes extra whitespaces, carriage returns, and control characters.
 */
function normalizeText(text) {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ \u00A0]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Parses uploaded buffer (PDF, DOCX, or UTF-8 Plain Text) into normalized string.
 * @param {Buffer} buffer - File buffer from Multer memory storage
 * @param {string} mimeType - MIME type or extension
 * @returns {Promise<{ text: string, wordCount: number }>}
 */
async function parseDocumentBuffer(buffer, mimeType) {
  let extractedText = '';

  if (mimeType.includes('pdf') || mimeType.endsWith('.pdf')) {
    try {
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text || '';
    } catch (err) {
      throw new Error(`Failed to parse PDF document: ${err.message}. Ensure the file is not password protected.`);
    }
  } else if (
    mimeType.includes('wordprocessingml') ||
    mimeType.includes('docx') ||
    mimeType.endsWith('.docx')
  ) {
    try {
      const docxData = await mammoth.extractRawText({ buffer });
      extractedText = docxData.value || '';
    } catch (err) {
      throw new Error(`Failed to parse DOCX document: ${err.message}.`);
    }
  } else if (mimeType.includes('text') || mimeType.includes('plain')) {
    extractedText = buffer.toString('utf-8');
  } else {
    throw new Error(`Unsupported document format '${mimeType}'. Supported formats: PDF, DOCX, TXT.`);
  }

  const cleanedText = normalizeText(extractedText);
  if (!cleanedText || cleanedText.length < 30) {
    throw new Error(
      'Document parsing resulted in insufficient readable text. The document may be an image-only scan or corrupted.'
    );
  }

  const wordCount = cleanedText.split(/\s+/).filter(Boolean).length;
  return { text: cleanedText, wordCount };
}

module.exports = {
  normalizeText,
  parseDocumentBuffer,
};
