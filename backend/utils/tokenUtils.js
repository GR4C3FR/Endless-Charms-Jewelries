const crypto = require('crypto');
const bcrypt = require('bcrypt');

/**
 * Token Utilities for Email Verification
 * Generates secure tokens with expiration
 */

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
 * Generate token expiration date (24 hours from now)
 * @returns {Date} - Expiration date
 */
const getTokenExpiration = () => {
  const expirationTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
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

module.exports = {
  generateVerificationToken,
  hashToken,
  compareToken,
  getTokenExpiration,
  isTokenExpired
};
