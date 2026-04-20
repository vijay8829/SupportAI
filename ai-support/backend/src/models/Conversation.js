const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const conversationSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4(),
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  // Visitor info (anonymous users)
  visitorId: { type: String },
  visitorName: { type: String, default: 'Visitor' },
  visitorEmail: { type: String },
  // Conversation metadata
  status: {
    type: String,
    enum: ['open', 'resolved', 'escalated'],
    default: 'open',
  },
  messagesCount: { type: Number, default: 0 },
  // Aggregate feedback
  satisfactionScore: { type: Number, min: 0, max: 1 }, // avg of thumbs up=1/down=0
  // Last message preview for listing
  lastMessageAt: { type: Date, default: Date.now },
  lastMessagePreview: { type: String, maxlength: 200 },
}, { timestamps: true });

conversationSchema.index({ company: 1, lastMessageAt: -1 });
conversationSchema.index({ company: 1, status: 1 });
// sessionId already has unique index from schema definition

module.exports = mongoose.model('Conversation', conversationSchema);
