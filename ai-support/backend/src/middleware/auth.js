const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).populate('company');
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    req.company = user.company;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    next(error);
  }
};

// Verify company slug for chat widget (no auth required, just company context)
const resolveCompany = async (req, res, next) => {
  try {
    const Company = require('../models/Company');
    const slug = req.params.slug || req.body.companySlug || req.query.companySlug;
    if (!slug) {
      return res.status(400).json({ error: 'Company identifier required' });
    }
    const company = await Company.findOne({ slug, isActive: true });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    req.company = company;
    next();
  } catch (error) {
    next(error);
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

module.exports = { authenticate, resolveCompany, requireRole };
