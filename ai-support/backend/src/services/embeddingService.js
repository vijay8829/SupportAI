const OpenAI = require('openai');

let openaiClient = null;

const getClient = () => {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
};

/** Check whether we have a real OpenAI key */
const isDemoMode = () => {
  const key = process.env.OPENAI_API_KEY || '';
  return !key || key.startsWith('sk-your') || key === 'your-key-here' || key.length < 20;
};

/**
 * Create a deterministic pseudo-embedding from text using a simple hash.
 * Dimension = 1536 (same as text-embedding-3-small).
 * Similar text → similar vectors, good enough for demo keyword retrieval.
 */
const mockEmbedding = (text) => {
  const DIMS = 1536;
  const vec = new Array(DIMS).fill(0);
  const cleaned = text.toLowerCase().replace(/\W+/g, ' ').trim();
  const words = cleaned.split(' ').filter(Boolean);

  // Word-frequency weighted spread across dimensions
  for (const word of words) {
    let h = 0x811c9dc5;
    for (let i = 0; i < word.length; i++) {
      h ^= word.charCodeAt(i);
      h = (h * 0x01000193) >>> 0; // FNV-1a hash, 32-bit
    }
    const idx = h % DIMS;
    vec[idx] += 1;
    // also spread to neighbouring dims for smoother similarity
    vec[(idx + 1) % DIMS] += 0.5;
    vec[(idx - 1 + DIMS) % DIMS] += 0.5;
  }

  // L2-normalise
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / mag);
};

/**
 * Generate embedding vector for a single text string.
 */
const generateEmbedding = async (text) => {
  if (isDemoMode()) return mockEmbedding(text);

  const client = getClient();
  const cleanText = text.replace(/\n+/g, ' ').trim();
  const response = await client.embeddings.create({
    model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
    input: cleanText,
  });
  return response.data[0].embedding;
};

/**
 * Generate embeddings for multiple texts in batch.
 */
const generateEmbeddingsBatch = async (texts) => {
  if (isDemoMode()) return texts.map(t => mockEmbedding(t));

  const client = getClient();
  const cleanTexts = texts.map(t => t.replace(/\n+/g, ' ').trim());

  const batchSize = 100;
  const allEmbeddings = [];

  for (let i = 0; i < cleanTexts.length; i += batchSize) {
    const batch = cleanTexts.slice(i, i + batchSize);
    const response = await client.embeddings.create({
      model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
      input: batch,
    });
    const embeddings = response.data
      .sort((a, b) => a.index - b.index)
      .map(item => item.embedding);
    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
};

module.exports = { generateEmbedding, generateEmbeddingsBatch, isDemoMode };
