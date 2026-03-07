// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// --- Middleware: Verify JWT and attach user to request ---
const protect = async (req, res, next) => {
  try {
    // 1. Check for token in Authorization header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // 2. Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Check if user still exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists or is inactive.',
      });
    }

    // 4. Attach user to request object
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

// --- Middleware: Restrict to specific roles ---
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden. This route is restricted to: ${roles.join(', ')}`,
      });
    }
    next();
  };
};

module.exports = { protect, restrictTo };
