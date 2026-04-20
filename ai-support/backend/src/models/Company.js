const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  // System prompt that defines the AI persona for this company
  systemPrompt: {
    type: String,
    default: 'You are a helpful customer support assistant. Answer questions based ONLY on the provided context. If you cannot find the answer in the context, politely say so and suggest contacting human support.',
  },
  // Branding
  primaryColor: { type: String, default: '#6366f1' },
  logoUrl: { type: String, default: '' },
  welcomeMessage: {
    type: String,
    default: 'Hello! How can I help you today?',
  },
  plan: {
    type: String,
    enum: ['free', 'starter', 'pro', 'enterprise'],
    default: 'free',
  },
  // Usage tracking
  messagesThisMonth: { type: Number, default: 0 },
  documentsCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// slug already has unique index from schema definition

module.exports = mongoose.model('Company', companySchema);
