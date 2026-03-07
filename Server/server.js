// server.js - Edu-Smart Backend Entry Point
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes         = require('./routes/authRoutes');
const studentRoutes      = require('./routes/studentRoutes');
const attendanceRoutes   = require('./routes/attendanceRoutes');
const aiRoutes           = require('./routes/aiRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const { setSocketIO }    = require('./socket');

const app  = express();
const PORT = process.env.PORT || 5000;

// ✅ FIX: Added port 3000 (React default) alongside 3004.
// Without this, all API calls from `npm start` are blocked with CORS errors.
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL]
  : [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3004',
      'http://127.0.0.1:3004',
    ];

app.use(
  cors({
    origin:      allowedOrigins,
    credentials: true,
    methods:     ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Edu-Smart API is running',
    version: '1.0.0',
    endpoints: {
      auth:          '/api/auth',
      students:      '/api/students',
      attendance:    '/api/attendance',
      ai:            '/api/ai',
      announcements: '/api/announcements',
    },
  });
});

app.use('/api/auth',          authRoutes);
app.use('/api/students',      studentRoutes);
app.use('/api/attendance',    attendanceRoutes);
app.use('/api/ai',            aiRoutes);
app.use('/api/announcements', announcementRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: allowedOrigins } });

setSocketIO(io);

io.on('connection', (socket) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Socket connected: ${socket.id}`);
  }
  socket.on('disconnect', () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Socket disconnected: ${socket.id}`);
    }
  });
});

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connected successfully');
    server.listen(PORT, () => {
      console.log(`🚀 Edu-Smart server running on http://localhost:${PORT}`);
      console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

startServer();

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await mongoose.connection.close();
  server.close(() => process.exit(0));
});