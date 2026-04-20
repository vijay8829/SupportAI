require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./src/config/database');
const errorHandler = require('./src/middleware/errorHandler');
const authRoutes = require('./src/routes/auth');
const documentRoutes = require('./src/routes/documents');
const chatRoutes = require('./src/routes/chat');
const analyticsRoutes = require('./src/routes/analytics');

const app = express();

// Trust Cloudflare / reverse proxy — fixes express-rate-limit X-Forwarded-For warning
app.set('trust proxy', 1);

// Connect to MongoDB + clean up stuck processing docs from a previous crashed run
connectDB().then(async () => {
  try {
    const Document = require('./src/models/Document');
    const fixed = await Document.updateMany(
      { status: 'processing' },
      { status: 'failed', errorMessage: 'Server restarted while processing — please re-upload.' }
    );
    if (fixed.modifiedCount > 0)
      console.log(`[Startup] Reset ${fixed.modifiedCount} stuck processing document(s) to failed.`);
  } catch { /* non-fatal */ }
});

// Security & performance middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
// Skip compression for SSE routes (compression buffers the stream)
app.use(compression({
  filter: (req, res) => {
    if (req.path.includes('/message')) return false; // SSE chat endpoint
    return compression.filter(req, res);
  },
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS — allow all origins in development (covers localhost + tunnels like cloudflare/localtunnel)
const corsOrigin = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : true; // true = reflect any Origin in dev

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { error: 'Too many requests, please try again later' },
});

const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30, // 30 messages per minute per IP
  message: { error: 'Chat rate limit exceeded' },
});

app.use('/api/', apiLimiter);
app.use('/api/chat/:slug/message', chatLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    env: process.env.NODE_ENV || 'development',
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n✅  AI Support backend running on http://localhost:${PORT}  [${process.env.NODE_ENV || 'development'}]\n`);
});

// Handle port-in-use gracefully instead of crashing
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌  Port ${PORT} is already in use.\n`
      + `   Kill the existing process first:\n`
      + `   Windows: netstat -ano | findstr :${PORT}  then  taskkill /PID <pid> /F\n`
      + `   macOS/Linux: lsof -ti:${PORT} | xargs kill -9\n`);
    process.exit(1);
  } else {
    throw err;
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

module.exports = app;
