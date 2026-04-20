const router = require('express').Router();
const { authenticate, resolveCompany } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

// Public chat endpoints (widget — resolve company by slug, no user auth)
router.post('/:slug/message', resolveCompany, chatController.sendMessage);
router.get('/:slug/history/:sessionId', resolveCompany, chatController.getHistory);

// Feedback (resolves company from message, requires company context via slug)
router.post('/:slug/feedback/:messageId', resolveCompany, chatController.submitFeedback);

// Admin: list all conversations
router.get('/admin/conversations', authenticate, chatController.listConversations);
router.get('/admin/conversations/:id/messages', authenticate, chatController.getConversationMessages);

module.exports = router;
