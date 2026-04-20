const DocumentChunk = require('../models/DocumentChunk');

/** Cosine similarity between two vectors */
const cosineSimilarity = (a, b) => {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

/** Simple keyword overlap score (0–1) for demo-mode fallback */
const keywordScore = (query, content) => {
  const qWords = new Set(query.toLowerCase().replace(/\W+/g, ' ').split(' ').filter(w => w.length > 2));
  const cWords = content.toLowerCase().replace(/\W+/g, ' ').split(' ');
  if (qWords.size === 0) return 0;
  let hits = 0;
  for (const w of cWords) if (qWords.has(w)) hits++;
  return Math.min(hits / qWords.size, 1);
};

/**
 * Store a document chunk with its embedding in MongoDB.
 */
const storeChunk = async ({ companyId, documentId, content, embedding, chunkIndex, metadata }) => {
  const chunk = new DocumentChunk({
    company: companyId,
    document: documentId,
    content,
    embedding,
    chunkIndex,
    metadata,
  });
  return chunk.save();
};

/**
 * Semantic (or keyword-fallback) search for top-k relevant chunks.
 *
 * Memory safety: fetches at most MAX_CHUNKS_IN_MEMORY chunks.
 * For production scale (>50k chunks) upgrade to MongoDB Atlas Vector Search.
 */
const MAX_CHUNKS_IN_MEMORY = 2000; // cap to prevent OOM

const similaritySearch = async ({ companyId, queryEmbedding, topK = 5, minScore = 0.25 }) => {
  // Check if the query embedding is a mock/zero-like vector (demo mode)
  const embeddingSum = queryEmbedding.reduce((s, v) => s + Math.abs(v), 0);
  const useMockEmbeddings = embeddingSum < 0.01; // all-zeros means real OpenAI wasn't called

  const chunks = await DocumentChunk.find({ company: companyId })
    .select('+embedding content metadata document chunkIndex')
    .populate('document', 'name type status')
    .limit(MAX_CHUNKS_IN_MEMORY)
    .lean();

  if (chunks.length === 0) return [];

  const readyChunks = chunks.filter(c => c.document?.status === 'ready');

  const scored = readyChunks.map(chunk => {
    let similarity;
    if (useMockEmbeddings) {
      // Demo mode: use keyword overlap instead of cosine similarity
      similarity = keywordScore(
        queryEmbedding.reduce ? '' : String(queryEmbedding), // fallback
        chunk.content
      );
    } else {
      similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
    }
    return { ...chunk, similarity };
  });

  return scored
    .filter(c => c.similarity >= (useMockEmbeddings ? 0.05 : minScore))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .map(({ embedding, ...rest }) => rest);
};

/**
 * Semantic search using actual query text for demo keyword matching.
 * Call this when you have the original query text available.
 */
const keywordSearch = async ({ companyId, queryText, topK = 5 }) => {
  const chunks = await DocumentChunk.find({ company: companyId })
    .select('content metadata document chunkIndex')
    .populate('document', 'name type status')
    .limit(MAX_CHUNKS_IN_MEMORY)
    .lean();

  if (chunks.length === 0) return [];

  const readyChunks = chunks.filter(c => c.document?.status === 'ready');

  return readyChunks
    .map(chunk => ({ ...chunk, similarity: keywordScore(queryText, chunk.content) }))
    .filter(c => c.similarity > 0.05)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
};

const deleteChunksByDocument = async (documentId) => {
  return DocumentChunk.deleteMany({ document: documentId });
};

const deleteChunksByCompany = async (companyId) => {
  return DocumentChunk.deleteMany({ company: companyId });
};

module.exports = {
  storeChunk,
  similaritySearch,
  keywordSearch,
  deleteChunksByDocument,
  deleteChunksByCompany,
};
