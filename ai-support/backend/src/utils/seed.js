/**
 * Seed script: creates a demo company + admin user for testing.
 * Run: node src/utils/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Company = require('../models/Company');
const User = require('../models/User');

const seed = async () => {
  await connectDB();

  const slug = 'demo-company';
  let company = await Company.findOne({ slug });

  if (!company) {
    company = await Company.create({
      name: 'Demo Company',
      slug,
      systemPrompt: 'You are a helpful customer support assistant for Demo Company. Answer questions ONLY based on the provided context. Be friendly and professional.',
      welcomeMessage: 'Hi there! 👋 How can I help you today?',
      primaryColor: '#6366f1',
    });
    console.log('✅ Created company:', company.name, '(slug:', slug + ')');
  } else {
    console.log('ℹ️  Company already exists:', company.name);
  }

  const email = 'admin@demo.com';
  const existing = await User.findOne({ email });

  if (!existing) {
    await User.create({
      name: 'Admin User',
      email,
      password: 'password123',
      company: company._id,
      role: 'owner',
    });
    console.log('✅ Created admin user:');
    console.log('   Email:    admin@demo.com');
    console.log('   Password: password123');
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  console.log('\n🚀 Demo credentials:');
  console.log('   Company slug: demo-company');
  console.log('   Admin email:  admin@demo.com');
  console.log('   Password:     password123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
