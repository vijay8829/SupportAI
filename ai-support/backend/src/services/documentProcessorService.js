const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');
const { generateEmbeddingsBatch, isDemoMode } = require('./embeddingService');
const { storeChunk, deleteChunksByDocument } = require('./vectorService');
const Document = require('../models/Document');

const CHUNK_SIZE    = 600;   // characters per chunk
const CHUNK_OVERLAP = 120;   // overlap for continuity
const PDF_WORKER    = path.join(__dirname, '../workers/pdfParser.js');

/** Split text into overlapping chunks at sentence boundaries */
const splitIntoChunks = (text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) => {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    if (end < text.length) {
      const breakPoints = ['. ', '! ', '? ', '\n\n', '\n'];
      for (const bp of breakPoints) {
        const idx = text.lastIndexOf(bp, end);
        if (idx > start + chunkSize * 0.5) { end = idx + bp.length; break; }
      }
    } else {
      end = text.length;
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 30) chunks.push(chunk);

    start = end - overlap;
    if (start >= text.length) break;
  }

  return chunks;
};

/** Parse FAQ format "Q: ... A: ..." into individual chunks */
const parseFaqText = (text) => {
  const faqPattern = /(?:Q:|Question:)\s*(.*?)\s*(?:A:|Answer:)\s*(.*?)(?=(?:Q:|Question:)|$)/gis;
  const chunks = [];
  let match;
  while ((match = faqPattern.exec(text)) !== null) {
    const q = match[1].trim(), a = match[2].trim();
    if (q && a) chunks.push(`Question: ${q}\nAnswer: ${a}`);
  }
  return chunks.length > 0 ? chunks : null;
};

/**
 * Extract text from a PDF buffer using an isolated child process.
 * The child exits when done, releasing all pdf-parse memory automatically.
 */
const extractPdfText = (buffer) => {
  return new Promise((resolve, reject) => {
    const child = fork(PDF_WORKER, [], {
      // Inherit env but give the child its own memory space
      silent: true,
      execArgv: ['--max-old-space-size=256'],
    });

    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('PDF parsing timed out after 30 seconds.'));
    }, 30_000);

    child.on('message', ({ text, error }) => {
      clearTimeout(timeout);
      if (error) {
        reject(new Error(
          `Could not extract text from PDF: ${error}. ` +
          'The file may be a scanned image or corrupted. Please upload a text-based PDF.'
        ));
      } else {
        resolve(text);
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      reject(new Error(`PDF worker process error: ${err.message}`));
    });

    child.on('exit', (code, signal) => {
      clearTimeout(timeout);
      // If the child exits without sending a message (e.g. OOM), reject gracefully
      if (signal === 'SIGKILL') {
        reject(new Error('PDF parser ran out of memory. Try a smaller or text-based PDF.'));
      }
    });

    // Send the buffer as base64 so it travels cleanly over IPC
    child.send({ bufferBase64: buffer.toString('base64'), maxPages: 50 });
  });
};

/**
 * Main document processing pipeline:
 *  1. Extract text
 *  2. Split into chunks
 *  3. Generate embeddings (real or mock for demo mode)
 *  4. Store chunks
 *  5. Mark document ready
 */
const processDocument = async ({ documentId, companyId, buffer, filePath, mimetype, docType, documentName }) => {
  await Document.findByIdAndUpdate(documentId, { status: 'processing', errorMessage: null });

  // If we received a filePath (disk storage), read the buffer from disk
  let buf = buffer;
  if (!buf && filePath) {
    buf = fs.readFileSync(filePath);
  }

  try {
    // ── Step 1: Extract text ──────────────────────────────────────
    let rawText = '';

    if (docType === 'pdf' || mimetype === 'application/pdf') {
      // Run pdf-parse in an isolated child process to prevent OOM in main server
      rawText = await extractPdfText(buf);
    } else {
      rawText = buf.toString('utf-8');
    }

    // Normalize whitespace
    rawText = rawText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, '  ')
      .replace(/[ ]{3,}/g, '  ')
      .trim();

    if (!rawText || rawText.length < 10) {
      throw new Error(
        'No readable text found in the document. ' +
        'For PDFs, ensure the file contains selectable text (not just images/scans). ' +
        'For text files, make sure the content is not empty.'
      );
    }

    // ── Step 2: Split into chunks ─────────────────────────────────
    let textChunks;
    if (docType === 'faq') {
      textChunks = parseFaqText(rawText) || splitIntoChunks(rawText);
    } else {
      textChunks = splitIntoChunks(rawText);
    }

    if (textChunks.length === 0) {
      throw new Error('Document produced no chunks. Please check the file content.');
    }

    // Cap chunks to prevent memory issues (very large docs)
    const MAX_CHUNKS = 500;
    if (textChunks.length > MAX_CHUNKS) {
      console.warn(`[DocumentProcessor] Capping ${textChunks.length} chunks to ${MAX_CHUNKS} for "${documentName}"`);
      textChunks = textChunks.slice(0, MAX_CHUNKS);
    }

    const demo = isDemoMode();
    if (demo) {
      console.log(`[DocumentProcessor] Demo mode — using mock embeddings for "${documentName}"`);
    }

    // ── Step 3: Generate embeddings ───────────────────────────────
    const embeddings = await generateEmbeddingsBatch(textChunks);

    // ── Step 4: Delete old chunks (re-processing scenario) ────────
    await deleteChunksByDocument(documentId);

    // ── Step 5: Store chunks in batches to avoid memory spikes ────
    const STORE_BATCH = 50;
    for (let i = 0; i < textChunks.length; i += STORE_BATCH) {
      const batch = textChunks.slice(i, i + STORE_BATCH);
      await Promise.all(batch.map((content, j) =>
        storeChunk({
          companyId,
          documentId,
          content,
          embedding: embeddings[i + j],
          chunkIndex: i + j,
          metadata: { documentName, documentType: docType },
        })
      ));
    }

    // ── Step 6: Mark ready ────────────────────────────────────────
    await Document.findByIdAndUpdate(documentId, {
      status: 'ready',
      chunksCount: textChunks.length,
      errorMessage: null,
    });

    console.log(`[DocumentProcessor] ✅ "${documentName}" — ${textChunks.length} chunks${demo ? ' (demo/mock embeddings)' : ''}`);
    return { chunksCount: textChunks.length };

  } catch (error) {
    await Document.findByIdAndUpdate(documentId, {
      status: 'failed',
      errorMessage: error.message,
    });
    console.error(`[DocumentProcessor] ❌ Failed "${documentName}":`, error.message);
    throw error;
  } finally {
    // Clean up temp file if it was written to disk
    if (filePath) {
      fs.unlink(filePath, () => {}); // best-effort, non-blocking
    }
  }
};

module.exports = { processDocument, splitIntoChunks };
