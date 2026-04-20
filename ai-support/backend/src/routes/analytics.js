const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

router.use(authenticate);

router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/top-questions', analyticsController.getTopQuestions);

module.exports = router;
