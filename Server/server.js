// server.js — Edu-Smart Backend Entry Point
require('dotenv').config();

const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');

// ─── Route Imports ───────────────────────────
const authRoutes       = require('./routes/authRoutes');
const studentRoutes    = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const aiRoutes         = require('./routes/aiRoutes');

// ─── App Setup ───────────────────────────────
const app  = express();
const PORT = process.env.PORT || 5000;

// ─── CORS Configuration ──────────────────────
app.use(
  cors({
    origin:      process.env.CLIENT_URL ||['http://localhost:3004', 'http://127.0.0.1:3004'],
    credentials: true,
    methods:     ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  })
);

// ─── Body Parser Middleware ──────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request Logger (dev only) ───────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ─── Health Check ────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: '🎓 Edu-Smart API is running',
    version: '1.0.0',
    endpoints: {
      auth:       '/api/auth',
      students:   '/api/students',
      attendance: '/api/attendance',
      ai:         '/api/ai',
    },
  });
});

// ─── API Routes ──────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/students',   studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/ai',         aiRoutes);

// ─── 404 Handler ─────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ─── Global Error Handler ────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ─── MongoDB Connection & Server Start ───────
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // These options prevent deprecation warnings
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connected successfully');

    app.listen(PORT, () => {
      console.log(`🚀 Edu-Smart server running on http://localhost:${PORT}`);
      console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

startServer();

// ─── Graceful Shutdown ───────────────────────
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});
