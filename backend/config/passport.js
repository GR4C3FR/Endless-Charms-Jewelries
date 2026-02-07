const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      proxy: true  // CRITICAL: Trust reverse proxy for HTTPS callback URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User exists, return user
          return done(null, user);
        }        // Check if user exists with same email
        user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });

        if (user) {
          // User exists with email, link Google account and auto-verify
          user.googleId = profile.id;
          user.isVerified = true;  // Auto-verify when linking Google account
          if (profile.photos && profile.photos.length > 0) {
            user.avatar = profile.photos[0].value;
          }
          await user.save();
          return done(null, user);
        }// Create new user with temporary values
        // Google users are auto-verified since Google has already verified their email
        const newUser = new User({
          googleId: profile.id,
          firstName: 'User',
          lastName: 'Guest',
          email: profile.emails[0].value.toLowerCase(),
          avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '/images/profile-icon.png',
          isVerified: true  // Auto-verify Google OAuth users
        });

        await newUser.save();
        done(null, newUser);
      } catch (error) {
        console.error('Google OAuth error:', error);
        done(error, null);
      }
    }
  )
);

module.exports = passport;
