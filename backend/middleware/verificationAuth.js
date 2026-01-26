const User = require('../models/User');

/**
 * Middleware to check if user's email is verified
 * Use this middleware to protect routes that require verified users
 * For example: placing orders, accessing certain features, etc.
 * 
 * Usage:
 * router.post('/sensitive-action', requireVerification, (req, res) => { ... });
 */
const requireVerification = async (req, res, next) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Please log in to continue'
      });
    }

    // Find user
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address to access this feature',
        requiresVerification: true
      });
    }

    // User is verified, proceed to next middleware/route handler
    next();

  } catch (error) {
    console.error('Verification check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking verification status'
    });
  }
};

/**
 * Middleware to check if user is logged in (doesn't require verification)
 * Use this for basic authentication without email verification requirement
 */
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      message: 'Please log in to continue'
    });
  }
  next();
};

module.exports = {
  requireVerification,
  requireAuth
};
