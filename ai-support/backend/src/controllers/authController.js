const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Company = require('../models/Company');

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { name, email, password, companyName } = req.body;

    // Create slug from company name
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check slug availability
    const existingCompany = await Company.findOne({ slug });
    const finalSlug = existingCompany ? `${slug}-${Date.now()}` : slug;

    const company = await Company.create({ name: companyName, slug: finalSlug });
    const user = await User.create({ name, email, password, company: company._id, role: 'owner' });

    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      company: { id: company._id, name: company.name, slug: company.slug },
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email, isActive: true }).select('+password').populate('company');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      company: {
        id: user.company._id,
        name: user.company.name,
        slug: user.company.slug,
        primaryColor: user.company.primaryColor,
        welcomeMessage: user.company.welcomeMessage,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
    company: {
      id: req.company._id,
      name: req.company.name,
      slug: req.company.slug,
      primaryColor: req.company.primaryColor,
      welcomeMessage: req.company.welcomeMessage,
      systemPrompt: req.company.systemPrompt,
      logoUrl: req.company.logoUrl,
      plan: req.company.plan,
      messagesThisMonth: req.company.messagesThisMonth,
      documentsCount: req.company.documentsCount,
    },
  });
};

exports.updateCompany = async (req, res, next) => {
  try {
    const { systemPrompt, welcomeMessage, primaryColor, logoUrl } = req.body;
    const updated = await Company.findByIdAndUpdate(
      req.company._id,
      { systemPrompt, welcomeMessage, primaryColor, logoUrl },
      { new: true, runValidators: true }
    );
    res.json({ company: updated });
  } catch (error) {
    next(error);
  }
};
