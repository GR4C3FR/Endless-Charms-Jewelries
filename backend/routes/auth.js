const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
const User = require('../models/User');

// POST /api/auth/signup - Register new user
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide first name, last name, email, and password' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid email address' 
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 8 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    // Create new user (password will be hashed by the pre-save hook)
    const user = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase(),
      password: password  // Don't hash here - let the model handle it
    });

    await user.save();

    // Use Passport login to establish session
    req.login(user, (err) => {
      if (err) {
        console.error('Signup session error:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error establishing session' 
        });
      }

      // Set additional session data
      req.session.userId = user._id;
      req.session.userEmail = user.email;

      // Return success without password
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        }
      });
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating user' 
    });
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Use Passport login to establish session
    req.login(user, (err) => {
      if (err) {
        console.error('Login session error:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error establishing session' 
        });
      }

      // Set additional session data
      req.session.userId = user._id;
      req.session.userEmail = user.email;

      // Return success
      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isAdmin: user.isAdmin
        }
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error logging in' 
    });
  }
});

// POST /api/auth/logout - Logout user
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error logging out' 
      });
    }
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  });
});

// GET /api/auth/logout - Logout user (for direct navigation)
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.redirect('/');
      }
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  });
});

// GET /api/auth/check - Check if user is logged in
router.get('/check', (req, res) => {
  if (req.session.userId) {
    res.json({ 
      success: true, 
      loggedIn: true,
      userId: req.session.userId,
      userEmail: req.session.userEmail
    });
  } else {
    res.json({ 
      success: true, 
      loggedIn: false 
    });
  }
});

// GET /api/auth/google - Start Google OAuth flow
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// GET /api/auth/google/callback - Google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Set session
    req.session.userId = req.user._id;
    req.session.userEmail = req.user.email;
    
    // Check if user needs to complete profile (firstName or lastName missing/default)
    const needsProfileCompletion = !req.user.firstName || 
                                   !req.user.lastName || 
                                   req.user.firstName === 'User' || 
                                   req.user.lastName === 'Guest' ||
                                   req.user.lastName === '';
    
    if (needsProfileCompletion) {
      req.session.needsProfileCompletion = true;
      return res.redirect('/complete-profile');
    }
    
    // Successful authentication, redirect home
    res.redirect('/?google_login=success');
  }
);

// POST /api/auth/complete-profile - Complete profile after Google OAuth
router.post('/complete-profile', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }
    
    const { firstName, lastName } = req.body;
    
    if (!firstName || !lastName) {
      return res.status(400).json({ 
        success: false, 
        message: 'First name and last name are required' 
      });
    }
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.session.userId,
      { 
        firstName: firstName.trim(), 
        lastName: lastName.trim() 
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Clear the needs completion flag
    delete req.session.needsProfileCompletion;
    
    res.json({ 
      success: true, 
      message: 'Profile completed successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error completing profile' 
    });
  }
});

module.exports = router;
