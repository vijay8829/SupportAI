const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['pdf', 'text', 'faq', 'url'],
    required: true,
  },
  originalName: { type: String },
  fileSize: { type: Number }, // in bytes
  status: {
    type: String,
    enum: ['processing', 'ready', 'failed'],
    default: 'processing',
  },
  errorMessage: { type: String },
  chunksCount: { type: Number, default: 0 },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Metadata about what the document covers
  description: { type: String, trim: true },
}, { timestamps: true });

documentSchema.index({ company: 1, status: 1 });
documentSchema.index({ company: 1, createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
