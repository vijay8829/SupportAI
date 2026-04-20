const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Company = require('../models/Company');
const { generateAnswer, generateAnswerStream } = require('../services/ragService');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/chat/:slug/message  — streaming SSE endpoint
 */
exports.sendMessage = async (req, res, next) => {
  const { content, sessionId, visitorName, visitorEmail, stream = true } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  try {
    const company = req.company;

    // Get or create conversation
    let conversation;
    if (sessionId) {
      conversation = await Conversation.findOne({ sessionId, company: company._id });
    }

    if (!conversation) {
      conversation = await Conversation.create({
        sessionId: sessionId || uuidv4(),
        company: company._id,
        visitorName: visitorName || 'Visitor',
        visitorEmail,
      });
    }

    // Save user message
    const userMessage = await Message.create({
      conversation: conversation._id,
      company: company._id,
      role: 'user',
      content: content.trim(),
    });

    // Get recent conversation history for context
    const previousMessages = await Message.find({ conversation: conversation._id })
      .sort({ createdAt: 1 })
      .limit(20)
      .select('role content')
      .lean();

    // Increment usage counter
    await Company.findByIdAndUpdate(company._id, { $inc: { messagesThisMonth: 1 } });

    if (stream) {
      // SSE headers — disable every layer of buffering
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');     // nginx
      res.setHeader('Transfer-Encoding', 'chunked');
      res.flushHeaders();

      // Helper: write + flush immediately after every event
      const sendEvent = (event, data) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        if (typeof res.flush === 'function') res.flush(); // compression middleware
      };

      sendEvent('start', { sessionId: conversation.sessionId, messageId: userMessage._id });

      let result;
      try {
        result = await generateAnswerStream({
          company,
          userMessage: content.trim(),
          previousMessages: previousMessages.slice(0, -1), // exclude current user msg
          onChunk: (text) => sendEvent('chunk', { text }),
        });
      } catch (aiError) {
        console.error('[Chat] RAG error:', aiError.message);
        const errorMsg = 'I apologize, but I encountered an error processing your request. Please try again.';
        sendEvent('chunk', { text: errorMsg });
        result = { answer: errorMsg, sourcesUsed: [], tokenUsage: null, responseTimeMs: 0 };
      }

      // Save assistant message
      const assistantMessage = await Message.create({
        conversation: conversation._id,
        company: company._id,
        role: 'assistant',
        content: result.answer,
        sourcesUsed: result.sourcesUsed,
        tokenUsage: result.tokenUsage,
        responseTimeMs: result.responseTimeMs,
      });

      // Update conversation metadata
      await Conversation.findByIdAndUpdate(conversation._id, {
        lastMessageAt: new Date(),
        lastMessagePreview: result.answer.slice(0, 200),
        $inc: { messagesCount: 2 },
      });

      sendEvent('done', {
        messageId: assistantMessage._id,
        sessionId: conversation.sessionId,
        sources: result.sourcesUsed,
        responseTimeMs: result.responseTimeMs,
      });

      res.end();
    } else {
      // Non-streaming fallback
      const result = await generateAnswer({
        company,
        userMessage: content.trim(),
        previousMessages: previousMessages.slice(0, -1),
      });

      const assistantMessage = await Message.create({
        conversation: conversation._id,
        company: company._id,
        role: 'assistant',
        content: result.answer,
        sourcesUsed: result.sourcesUsed,
        tokenUsage: result.tokenUsage,
        responseTimeMs: result.responseTimeMs,
      });

      await Conversation.findByIdAndUpdate(conversation._id, {
        lastMessageAt: new Date(),
        lastMessagePreview: result.answer.slice(0, 200),
        $inc: { messagesCount: 2 },
      });

      res.json({
        sessionId: conversation.sessionId,
        message: {
          id: assistantMessage._id,
          role: 'assistant',
          content: result.answer,
          sources: result.sourcesUsed,
          responseTimeMs: result.responseTimeMs,
        },
      });
    }
  } catch (error) {
    if (res.headersSent) {
      console.error('[Chat] Error after headers sent:', error.message);
      return res.end();
    }
    next(error);
  }
};

/**
 * GET /api/chat/:slug/history/:sessionId  — get chat history
 */
exports.getHistory = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      sessionId: req.params.sessionId,
      company: req.company._id,
    });

    if (!conversation) return res.json({ messages: [], sessionId: req.params.sessionId });

    const messages = await Message.find({ conversation: conversation._id })
      .sort({ createdAt: 1 })
      .select('-__v')
      .lean();

    res.json({
      sessionId: conversation.sessionId,
      messages: messages.map(m => ({
        id: m._id,
        role: m.role,
        content: m.content,
        sources: m.sourcesUsed,
        feedback: m.feedback,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/chat/feedback/:messageId  — thumbs up/down
 */
exports.submitFeedback = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    if (!['up', 'down'].includes(rating)) {
      return res.status(400).json({ error: 'Rating must be "up" or "down"' });
    }

    const message = await Message.findOneAndUpdate(
      { _id: req.params.messageId, company: req.company._id, role: 'assistant' },
      { feedback: { rating, comment, ratedAt: new Date() } },
      { new: true }
    );

    if (!message) return res.status(404).json({ error: 'Message not found' });

    // Recompute conversation satisfaction score
    const allFeedback = await Message.find({
      conversation: message.conversation,
      'feedback.rating': { $in: ['up', 'down'] },
    }).select('feedback');

    if (allFeedback.length > 0) {
      const score = allFeedback.filter(m => m.feedback.rating === 'up').length / allFeedback.length;
      await Conversation.findByIdAndUpdate(message.conversation, { satisfactionScore: score });
    }

    res.json({ message: 'Feedback recorded', rating });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/conversations  — list all conversations for admin
 */
exports.listConversations = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = { company: req.company._id };
    if (status) filter.status = status;

    const [conversations, total] = await Promise.all([
      Conversation.find(filter)
        .sort({ lastMessageAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      Conversation.countDocuments(filter),
    ]);

    res.json({
      conversations,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/conversations/:id/messages  — get messages in a conversation
 */
exports.getConversationMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, company: req.company._id });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const messages = await Message.find({ conversation: conversation._id })
      .sort({ createdAt: 1 })
      .lean();

    res.json({ conversation, messages });
  } catch (error) {
    next(error);
  }
};
