const mongoose = require('mongoose');

const documentChunkSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  // Vector embedding stored as array of floats
  embedding: {
    type: [Number],
    required: true,
    select: false, // Don't return by default (large field)
  },
  chunkIndex: { type: Number, required: true },
  // Metadata for source attribution
  metadata: {
    documentName: String,
    documentType: String,
    pageNumber: Number,
    section: String,
  },
}, { timestamps: true });

documentChunkSchema.index({ company: 1, document: 1 });
documentChunkSchema.index({ company: 1, chunkIndex: 1 });

// Cosine similarity computed in application layer
// For production, use MongoDB Atlas Vector Search or Pinecone

module.exports = mongoose.model('DocumentChunk', documentChunkSchema);
