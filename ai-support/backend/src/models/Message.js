const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  // For assistant messages: which chunks were used as context
  sourcesUsed: [{
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    documentName: String,
    chunkContent: String,
    similarity: Number,
  }],
  // User feedback on this message
  feedback: {
    rating: {
      type: String,
      enum: ['up', 'down', null],
      default: null,
    },
    comment: { type: String },
    ratedAt: { type: Date },
  },
  // Token usage for cost tracking
  tokenUsage: {
    promptTokens: Number,
    completionTokens: Number,
    totalTokens: Number,
  },
  // Response time in ms
  responseTimeMs: { type: Number },
}, { timestamps: true });

messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ company: 1, createdAt: -1 });
messageSchema.index({ company: 1, 'feedback.rating': 1 });

module.exports = mongoose.model('Message', messageSchema);
