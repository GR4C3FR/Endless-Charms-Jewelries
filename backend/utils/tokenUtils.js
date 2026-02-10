const crypto = require('crypto');
const bcrypt = require('bcrypt');

/**
 * Token Utilities for Email Verification, Password Reset, and Remember Me
 * Generates secure tokens with expiration
 */

// ========================================
// TOKEN GENERATION & HASHING
// ========================================

/**
 * Generate a secure random verification token
 * @returns {string} - 64-character hexadecimal token
 */
const generateVerificationToken = () => {
  // Generate 32 random bytes and convert to hexadecimal string (64 characters)
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a token for secure storage in database
 * @param {string} token - Plain text token to hash
 * @returns {Promise<string>} - Hashed token
 */
const hashToken = async (token) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(token, salt);
};

/**
 * Compare plain token with hashed token
 * @param {string} plainToken - Plain text token from URL
 * @param {string} hashedToken - Hashed token from database
 * @returns {Promise<boolean>} - True if tokens match
 */
const compareToken = async (plainToken, hashedToken) => {
  return bcrypt.compare(plainToken, hashedToken);
};

/**
 * Generate token expiration date
 * @param {number} hours - Hours until expiration (default 24)
 * @returns {Date} - Expiration date
 */
const getTokenExpiration = (hours = 24) => {
  const expirationTime = hours * 60 * 60 * 1000;
  return new Date(Date.now() + expirationTime);
};

/**
 * Check if token has expired
 * @param {Date} expirationDate - Token expiration date from database
 * @returns {boolean} - True if token has expired
 */
const isTokenExpired = (expirationDate) => {
  return new Date() > new Date(expirationDate);
};

// ========================================
// UNIFIED TOKEN VERIFICATION FUNCTION
// ========================================

/**
 * Verify a token against users in the database
 * This is a reusable function for email verification and password reset
 * 
 * @param {Object} User - Mongoose User model
 * @param {string} token - Plain text token to verify
 * @param {Object} options - Configuration options
 * @param {string} options.tokenField - Field name for hashed token (e.g., 'verificationToken', 'resetPasswordToken')
 * @param {string} options.expiresField - Field name for expiration (e.g., 'verificationTokenExpires', 'resetPasswordExpires')
 * @param {Object} options.additionalQuery - Additional query criteria (e.g., { isVerified: false })
 * @returns {Promise<Object>} - { success, user, message }
 */
const verifyTokenFromDatabase = async (User, token, options) => {
  const { tokenField, expiresField, additionalQuery = {} } = options;

  if (!token) {
    return {
      success: false,
      user: null,
      message: 'Token is required'
    };
  }

  try {
    // Build query for users with unexpired tokens
    const query = {
      [expiresField]: { $gt: new Date() },
      ...additionalQuery
    };

    // Find users and select the token fields explicitly
    const users = await User.find(query).select(`+${tokenField} +${expiresField}`);

    if (!users || users.length === 0) {
      return {
        success: false,
        user: null,
        message: 'Invalid or expired token'
      };
    }

    // Find the user whose token matches
    let matchedUser = null;
    for (const user of users) {
      const hashedToken = user[tokenField];
      console.log('🔍 Checking token for user:', user.email, 'hashedToken exists:', !!hashedToken);
      if (hashedToken) {
        const isMatch = await compareToken(token, hashedToken);
        console.log('🔍 Token match result:', isMatch);
        if (isMatch) {
          matchedUser = user;
          break;
        }
      }
    }

    if (!matchedUser) {
      return {
        success: false,
        user: null,
        message: 'Invalid or expired token'
      };
    }

    // Double-check expiration
    if (isTokenExpired(matchedUser[expiresField])) {
      return {
        success: false,
        user: null,
        message: 'Token has expired. Please request a new one.'
      };
    }

    return {
      success: true,
      user: matchedUser,
      message: 'Token verified successfully'
    };

  } catch (error) {
    console.error('Token verification error:', error);
    return {
      success: false,
      user: null,
      message: 'Error verifying token'
    };
  }
};

/**
 * Generate and save a token for a user
 * Reusable for verification emails, password resets, etc.
 * 
 * @param {Object} user - Mongoose user document
 * @param {Object} options - Configuration options
 * @param {string} options.tokenField - Field name for hashed token
 * @param {string} options.expiresField - Field name for expiration
 * @param {number} options.expirationHours - Hours until expiration
 * @returns {Promise<Object>} - { success, plainToken, message }
 */
const generateAndSaveToken = async (user, options) => {
  const { tokenField, expiresField, expirationHours = 24 } = options;

  try {
    const plainToken = generateVerificationToken();
    const hashedToken = await hashToken(plainToken);
    const expiration = getTokenExpiration(expirationHours);

    user[tokenField] = hashedToken;
    user[expiresField] = expiration;
    await user.save();

    return {
      success: true,
      plainToken,
      message: 'Token generated successfully'
    };

  } catch (error) {
    console.error('Token generation error:', error);
    return {
      success: false,
      plainToken: null,
      message: 'Error generating token'
    };
  }
};

/**
 * Clear token fields from a user
 * 
 * @param {Object} user - Mongoose user document
 * @param {string} tokenField - Field name for hashed token
 * @param {string} expiresField - Field name for expiration
 * @returns {Promise<void>}
 */
const clearToken = async (user, tokenField, expiresField) => {
  user[tokenField] = undefined;
  user[expiresField] = undefined;
  await user.save();
};

// ========================================
// REMEMBER ME TOKEN UTILITIES
// ========================================

/**
 * Generate a secure device identifier for Remember Me functionality
 * Uses AES-256-GCM encryption to securely store credentials
 * 
 * @param {string} userId - User's database ID
 * @param {string} email - User's email
 * @param {string} password - User's password (will be encrypted)
 * @returns {Object} - { deviceToken, encryptedData }
 */
const generateRememberMeToken = (userId, email, password = null) => {
  // Generate a random token as the device identifier
  const deviceToken = crypto.randomBytes(32).toString('hex');
  
  // Create a payload with user credentials (encrypted, not plain text storage)
  const payload = {
    uid: userId.toString(),
    email: email,
    pwd: password, // Encrypted in the final output
    created: Date.now(),
    deviceToken
  };
  
  // Encrypt the payload using AES-256-GCM
  const secretKey = process.env.REMEMBER_ME_SECRET || process.env.SESSION_SECRET || 'ec-default-remember-key-change-in-production';
  const key = crypto.scryptSync(secretKey, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Combine IV + AuthTag + Encrypted data
  const encryptedData = iv.toString('hex') + ':' + authTag + ':' + encrypted;
  
  return {
    deviceToken,
    encryptedData
  };
};

/**
 * Decrypt and verify a Remember Me token
 * Returns the user email if valid, null otherwise
 * 
 * @param {string} encryptedData - The encrypted token from cookie
 * @returns {Object|null} - { userId, email, deviceToken } or null
 */
const decryptRememberMeToken = (encryptedData) => {
  try {
    if (!encryptedData) return null;
    
    const parts = encryptedData.split(':');
    if (parts.length !== 3) return null;
    
    const [ivHex, authTagHex, encrypted] = parts;
    
    const secretKey = process.env.REMEMBER_ME_SECRET || process.env.SESSION_SECRET || 'ec-default-remember-key-change-in-production';
    const key = crypto.scryptSync(secretKey, 'salt', 32);
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    const payload = JSON.parse(decrypted);
    
    // Check if token is not too old (30 days max)
    const maxAge = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - payload.created > maxAge) {
      return null;
    }
    
    return {
      userId: payload.uid,
      email: payload.email,
      password: payload.pwd || null,
      deviceToken: payload.deviceToken
    };
    
  } catch (error) {
    console.error('Remember Me token decryption failed:', error.message);
    return null;
  }
};

// ========================================
// PASSWORD VERIFICATION UTILITY
// ========================================

/**
 * Verify user's current password
 * Reusable for change password and other password verification needs
 * 
 * @param {Object} User - Mongoose User model
 * @param {string} userId - User's database ID
 * @param {string} currentPassword - Password to verify
 * @returns {Promise<Object>} - { success, user, message }
 */
const verifyUserPassword = async (User, userId, currentPassword) => {
  try {
    if (!userId || !currentPassword) {
      return {
        success: false,
        user: null,
        message: 'User ID and password are required'
      };
    }

    // Find user with password field
    const user = await User.findById(userId);
    
    if (!user) {
      return {
        success: false,
        user: null,
        message: 'User not found'
      };
    }

    // Check if user has a password
    if (!user.password) {
      return {
        success: false,
        user: null,
        message: 'No password set for this account'
      };
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return {
        success: false,
        user: null,
        message: 'Current password is incorrect'
      };
    }

    return {
      success: true,
      user,
      message: 'Password verified successfully'
    };

  } catch (error) {
    console.error('Password verification error:', error);
    return {
      success: false,
      user: null,
      message: 'Error verifying password'
    };
  }
};

module.exports = {
  generateVerificationToken,
  hashToken,
  compareToken,
  getTokenExpiration,
  isTokenExpired,
  // Unified verification
  verifyTokenFromDatabase,
  generateAndSaveToken,
  clearToken,
  // Remember Me
  generateRememberMeToken,
  decryptRememberMeToken,
  // Password verification
  verifyUserPassword
};
