const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Document = require('../models/Document');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const companyId = req.company._id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      totalConversations,
      openConversations,
      totalMessages,
      recentMessages,
      documents,
      feedbackStats,
      avgResponseTime,
      dailyMessageCounts,
    ] = await Promise.all([
      Conversation.countDocuments({ company: companyId }),
      Conversation.countDocuments({ company: companyId, status: 'open' }),
      Message.countDocuments({ company: companyId, role: 'assistant' }),
      Message.countDocuments({ company: companyId, role: 'assistant', createdAt: { $gte: sevenDaysAgo } }),
      Document.countDocuments({ company: companyId, status: 'ready' }),
      Message.aggregate([
        { $match: { company: companyId, 'feedback.rating': { $in: ['up', 'down'] } } },
        { $group: { _id: '$feedback.rating', count: { $sum: 1 } } },
      ]),
      Message.aggregate([
        { $match: { company: companyId, role: 'assistant', responseTimeMs: { $exists: true } } },
        { $group: { _id: null, avg: { $avg: '$responseTimeMs' } } },
      ]),
      // Messages per day for last 30 days
      Message.aggregate([
        { $match: { company: companyId, role: 'user', createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const upCount = feedbackStats.find(f => f._id === 'up')?.count || 0;
    const downCount = feedbackStats.find(f => f._id === 'down')?.count || 0;
    const totalFeedback = upCount + downCount;
    const satisfactionRate = totalFeedback > 0 ? Math.round((upCount / totalFeedback) * 100) : null;

    res.json({
      overview: {
        totalConversations,
        openConversations,
        totalMessages,
        recentMessages,
        documents,
        satisfactionRate,
        avgResponseTimeMs: Math.round(avgResponseTime[0]?.avg || 0),
      },
      feedback: { up: upCount, down: downCount, total: totalFeedback },
      dailyMessages: dailyMessageCounts.map(d => ({ date: d._id, count: d.count })),
    });
  } catch (error) {
    next(error);
  }
};

exports.getTopQuestions = async (req, res, next) => {
  try {
    // Find user messages that got negative feedback (for improvement)
    const lowRated = await Message.find({
      company: req.company._id,
      role: 'assistant',
      'feedback.rating': 'down',
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate({ path: 'conversation', select: 'sessionId' })
      .lean();

    res.json({ lowRatedResponses: lowRated });
  } catch (error) {
    next(error);
  }
};
