const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/emailService');
const { 
  generateVerificationToken, 
  hashToken, 
  compareToken,
  getTokenExpiration,
  isTokenExpired 
} = require('../utils/tokenUtils');

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
    }    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      // If user exists and is verified, reject the sign-up
      if (existingUser.isVerified) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email already registered' 
        });
      }
      
      // If user exists but is NOT verified, resend verification email
      // Do NOT create a new account, do NOT log them in
      const verificationToken = generateVerificationToken();
      const hashedToken = await hashToken(verificationToken);
      const tokenExpiration = getTokenExpiration();
      
      // Update the existing user with new verification token
      existingUser.verificationToken = hashedToken;
      existingUser.verificationTokenExpires = tokenExpiration;
      await existingUser.save();
      
      // Send verification email
      try {
        await sendVerificationEmail(existingUser.email, existingUser.firstName, verificationToken);
        console.log(`📧 Verification email resent to existing unverified user: ${existingUser.email}`);
      } catch (emailError) {
        console.error('❌ Failed to send verification email:', emailError);
      }
      
      // Return response indicating verification email was sent
      return res.status(200).json({
        success: true,
        message: 'An account with this email already exists but is not verified. A new verification email has been sent to your inbox.',
        requiresVerification: true,
        isExistingUser: true
      });
    }

    // Generate verification token for new user
    const verificationToken = generateVerificationToken();
    const hashedToken = await hashToken(verificationToken);
    const tokenExpiration = getTokenExpiration();

    // Create new user with isVerified = false (password will be hashed by pre-save hook)
    const user = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase(),
      password: password,  // Don't hash here - let the model handle it
      isVerified: false,   // User starts unverified
      verificationToken: hashedToken,
      verificationTokenExpires: tokenExpiration
    });

    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.firstName, verificationToken);
      console.log(`📧 Verification email sent to: ${user.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      // Don't fail the signup if email fails - user can resend later
    }

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
        message: 'User registered successfully. Please check your email to verify your account.',
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isVerified: user.isVerified
        },
        requiresVerification: true
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
    const { email, password, remember } = req.body;

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

    // User can login even if not verified, but we'll inform them
    // This allows them to access the resend verification email feature

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
      
      // Handle "Remember Me" - adjust cookie expiration
      if (remember === true || remember === 'true' || remember === 'on') {
        // Remember me: 30 days
        req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30;
      } else {
        // Don't remember: 24 hours
        req.session.cookie.maxAge = 1000 * 60 * 60 * 24;
      }

      // Save session explicitly before sending response
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Session save error:', saveErr);
          return res.status(500).json({ 
            success: false, 
            message: 'Error saving session' 
          });
        }

        // Return success with verification status
        res.json({
          success: true,
          message: 'Login successful',
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            isAdmin: user.isAdmin,
            isVerified: user.isVerified
          },
          // Warn if email is not verified
          warning: !user.isVerified ? 'Please verify your email address to access all features' : null
        });
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

// GET /api/auth/check-session - Check if user is authenticated
router.get('/check-session', (req, res) => {
  console.log('Session check - isAuthenticated:', req.isAuthenticated());
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', req.session);
  
  if (req.isAuthenticated()) {
    return res.json({
      authenticated: true,
      user: {
        id: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        isAdmin: req.user.isAdmin,
        isVerified: req.user.isVerified
      }
    });
  }
  
  res.json({ authenticated: false });
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

// GET /api/auth/verify-email - Verify user email with token
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    // Validate token presence
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find user with unexpired verification token
    // We need to select the token fields explicitly since they're excluded by default
    const users = await User.find({
      isVerified: false,
      verificationTokenExpires: { $gt: new Date() }
    }).select('+verificationToken +verificationTokenExpires');

    if (!users || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Find the user whose token matches
    let matchedUser = null;
    for (const user of users) {
      const isMatch = await compareToken(token, user.verificationToken);
      if (isMatch) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Check if token is expired
    if (isTokenExpired(matchedUser.verificationTokenExpires)) {
      return res.status(400).json({
        success: false,
        message: 'Verification token has expired. Please request a new one.'
      });
    }

    // Mark user as verified and clear verification token
    matchedUser.isVerified = true;
    matchedUser.verificationToken = undefined;
    matchedUser.verificationTokenExpires = undefined;
    await matchedUser.save();

    console.log(`✅ Email verified for user: ${matchedUser.email}`);

    // Return success (can redirect to a success page in frontend)
    res.json({
      success: true,
      message: 'Email verified successfully! You can now access all features.',
      user: {
        id: matchedUser._id,
        email: matchedUser.email,
        isVerified: matchedUser.isVerified
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email'
    });
  }
});

// POST /api/auth/resend-verification - Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Please log in to resend verification email'
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

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const hashedToken = await hashToken(verificationToken);
    const tokenExpiration = getTokenExpiration();

    // Update user with new token
    user.verificationToken = hashedToken;
    user.verificationTokenExpires = tokenExpiration;
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.firstName, verificationToken);
      console.log(`📧 Verification email resent to: ${user.email}`);

      res.json({
        success: true,
        message: 'Verification email sent! Please check your inbox.'
      });

    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again later.'
      });
    }

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending verification email'
    });
  }
});

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Check if user signed up with Google (no password)
    if (user.googleId && !user.password) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = generateVerificationToken();
    const hashedToken = await hashToken(resetToken);

    // Set reset token and expiration (1 hour)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    // Send password reset email
    const { sendPasswordResetEmail } = require('../utils/emailService');
    await sendPasswordResetEmail(user.email, user.firstName, resetToken);
    console.log(`📧 Password reset email sent to: ${user.email}`);

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing password reset request'
    });
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Find users with unexpired reset tokens
    const users = await User.find({
      resetPasswordExpires: { $gt: new Date() }
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!users || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Find the user whose token matches
    let matchedUser = null;
    for (const user of users) {
      const isMatch = await compareToken(token, user.resetPasswordToken);
      if (isMatch) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password and clear reset token
    matchedUser.password = password;
    matchedUser.resetPasswordToken = undefined;
    matchedUser.resetPasswordExpires = undefined;
    await matchedUser.save();

    console.log(`✅ Password reset successful for: ${matchedUser.email}`);

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
});

module.exports = router;
