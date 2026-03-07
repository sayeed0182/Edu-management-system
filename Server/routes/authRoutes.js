// routes/authRoutes.js
const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Helper: Sign a JWT token
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// Helper: Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id:         user._id,
      name:       user.name,
      email:      user.email,
      role:       user.role,
      department: user.department,
      studentId:  user.studentId,
    },
  });
};

// ─────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, department, studentId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // Create the User account
    const user = await User.create({ name, email, password, role, department });

    // If registering as a Student, create their Student profile
    if (role === 'Student') {
      if (!studentId) {
        return res.status(400).json({ success: false, message: 'Student ID is required for Student role.' });
      }
      const studentProfile = await Student.create({
        name,
        email,
        studentId,
        department: department || 'General',
        userId: user._id,
      });
      user.studentId = studentProfile._id;
      await user.save();
    }

    sendTokenResponse(user, 201, res);
  } catch (err) {
    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email or Student ID already exists.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

   // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');

   
// NEW CODE - Directly compares the plain text password
// Use the Bcrypt compare method defined in your User model
    const isMatch = await user.comparePassword(password);

    if (!user || !isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/auth/me  (Protected)
// ─────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
