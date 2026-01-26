# Email Verification System - Implementation Guide

## 📋 Overview

This document explains the complete email verification system implemented for Endless Charms. The system ensures users verify their email addresses during signup using secure tokens and Gmail SMTP.

---

## 🏗️ Architecture

### Database Schema Changes

**User Model** ([models/User.js](models/User.js))
```javascript
{
  // Existing fields...
  
  // New email verification fields:
  isVerified: {
    type: Boolean,
    default: false  // All new users start unverified
  },
  verificationToken: {
    type: String,
    select: false  // Not included in queries by default (security)
  },
  verificationTokenExpires: {
    type: Date,
    select: false  // Not included in queries by default
  }
}
```

---

## 📂 File Structure

```
backend/
├── models/
│   └── User.js (✅ Updated with verification fields)
├── routes/
│   └── auth.js (✅ Updated with verification endpoints)
├── middleware/
│   └── verificationAuth.js (🆕 New - Verification check middleware)
├── utils/
│   ├── emailService.js (🆕 New - Email sending logic)
│   └── tokenUtils.js (🆕 New - Token generation & validation)
└── .env (✅ Updated with email credentials)
```

---

## 🔑 Key Features

### 1. User Signup with Email Verification

**Endpoint:** `POST /api/auth/signup`

**Flow:**
1. User submits signup form (firstName, lastName, email, password)
2. System validates input and checks for existing users
3. Generates secure 64-character hex token
4. Hashes token with bcrypt (same as passwords)
5. Stores hashed token in database with 24-hour expiration
6. Creates user account with `isVerified: false`
7. Sends verification email to user
8. Returns success response

**Code Location:** `routes/auth.js` lines ~15-105

---

### 2. Email Verification Link

**Endpoint:** `GET /api/auth/verify-email?token=<TOKEN>`

**Flow:**
1. User clicks verification link in email
2. System receives token from URL query
3. Finds unverified users with unexpired tokens
4. Compares plain token with hashed tokens using bcrypt
5. If match found and not expired:
   - Sets `isVerified: true`
   - Clears verification token fields
   - Returns success
6. If invalid/expired: Returns error

**Code Location:** `routes/auth.js` lines ~305-380

**Security Features:**
- Tokens are hashed in database (not stored in plain text)
- 24-hour expiration prevents stale links
- Tokens are single-use (deleted after verification)
- Cannot reuse tokens after verification

---

### 3. Resend Verification Email

**Endpoint:** `POST /api/auth/resend-verification`

**Flow:**
1. Logged-in user requests new verification email
2. System checks if user is already verified
3. If not verified:
   - Generates new token
   - Updates database with new token & expiration
   - Sends new verification email
4. Returns success/error

**Code Location:** `routes/auth.js` lines ~382-440

**Requirements:**
- User must be logged in (session-based)
- User must not already be verified

---

### 4. Login with Verification Status

**Endpoint:** `POST /api/auth/login`

**Updated Behavior:**
- Users CAN log in even if email is not verified
- Response includes `isVerified` status
- Warning message if not verified
- This allows access to resend verification feature

**Why allow unverified login?**
- Users can request new verification emails
- Users can browse non-sensitive content
- Verification is only required for sensitive actions (checkout, etc.)

**Code Location:** `routes/auth.js` lines ~107-180

---

## 📧 Email Service

**File:** `utils/emailService.js`

### Configuration

Uses Gmail SMTP with nodemailer:
```javascript
{
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,      // endlesscharmsofficial@gmail.com
    pass: process.env.EMAIL_PASSWORD   // Gmail App Password
  }
}
```

### Email Template

**Features:**
- Professional HTML design with gold theme matching Endless Charms branding
- Responsive layout (max-width: 600px)
- Clear "Verify Email" call-to-action button
- Expiration warning (24 hours)
- Fallback plain text link
- Plain text version for non-HTML email clients
- Brand colors: Gold (#d4af37) with gradient header

**From:** Endless Charms <endlesscharmsofficial@gmail.com>  
**Subject:** Verify Your Email - Endless Charms

---

## 🔐 Token Security

**File:** `utils/tokenUtils.js`

### Token Generation
```javascript
crypto.randomBytes(32).toString('hex')
// Generates: 64-character hexadecimal string
// Example: "a3f9e2b1c4d7..." (64 chars)
```

### Token Hashing
- Uses bcrypt with salt rounds of 10
- Same security level as password hashing
- Prevents token theft from database breaches

### Token Comparison
- Uses bcrypt.compare() for constant-time comparison
- Prevents timing attacks

### Expiration
- Tokens expire after 24 hours
- Checked during verification
- Expired tokens cannot be used

---

## 🛡️ Middleware for Protected Routes

**File:** `middleware/verificationAuth.js`

### `requireVerification` Middleware

Use this middleware to protect routes that require verified users:

```javascript
const { requireVerification } = require('../middleware/verificationAuth');

// Example: Protect checkout
router.post('/checkout', requireVerification, async (req, res) => {
  // Only verified users can reach this code
});
```

**What it does:**
1. Checks if user is logged in
2. Checks if user's email is verified
3. If not verified: Returns 403 error with message
4. If verified: Proceeds to next middleware/route

### `requireAuth` Middleware

Basic authentication without verification requirement:

```javascript
const { requireAuth } = require('../middleware/verificationAuth');

// Example: View profile (doesn't require verification)
router.get('/profile', requireAuth, async (req, res) => {
  // Any logged-in user can reach this code
});
```

---

## ⚙️ Environment Variables

**File:** `.env`

### Required Variables

```bash
# Email Configuration
EMAIL_USER=endlesscharmsofficial@gmail.com
EMAIL_PASSWORD=your_gmail_app_password_here

# Base URL for verification links
BASE_URL=http://localhost:3000  # Change to production URL in production
```

### Gmail App Password Setup

**IMPORTANT:** You cannot use your regular Gmail password. You must generate an App Password.

**Steps:**
1. Go to Google Account Security: https://myaccount.google.com/security
2. Enable 2-Step Verification (if not already enabled)
3. Go to App Passwords: https://myaccount.google.com/apppasswords
4. Select "Mail" and "Other (Custom name)"
5. Enter name: "Endless Charms"
6. Click "Generate"
7. Copy the 16-character password (format: xxxx xxxx xxxx xxxx)
8. Paste it in `.env` file as `EMAIL_PASSWORD` (remove spaces)

**Example:**
```bash
EMAIL_PASSWORD=abcdEFGH1234ijkl
```

---

## 🚀 Usage Guide

### 1. Initial Setup

```bash
# 1. Install dependencies (already done)
npm install

# 2. Configure .env file
# - Add EMAIL_PASSWORD (Gmail App Password)
# - Verify EMAIL_USER is correct
# - Update BASE_URL for production

# 3. Start server
npm run dev
```

### 2. Testing the Flow

**A. Signup Flow:**
```javascript
// POST /api/auth/signup
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123"
}

// Response:
{
  "success": true,
  "message": "User registered successfully. Please check your email to verify your account.",
  "user": {
    "id": "...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "isVerified": false
  },
  "requiresVerification": true
}
```

**B. Check Email:**
- User receives email from "Endless Charms"
- Clicks "Verify Email" button
- Redirects to: `http://localhost:3000/verify-email?token=<TOKEN>`

**C. Email Verification:**
```javascript
// GET /api/auth/verify-email?token=a3f9e2b1c4d7...

// Response:
{
  "success": true,
  "message": "Email verified successfully! You can now access all features.",
  "user": {
    "id": "...",
    "email": "john@example.com",
    "isVerified": true
  }
}
```

**D. Login:**
```javascript
// POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}

// Response (if verified):
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "isAdmin": false,
    "isVerified": true  // ← Now true!
  },
  "warning": null
}

// Response (if NOT verified):
{
  ...
  "isVerified": false,
  "warning": "Please verify your email address to access all features"
}
```

**E. Resend Verification:**
```javascript
// POST /api/auth/resend-verification
// (Requires logged-in session)

// Response:
{
  "success": true,
  "message": "Verification email sent! Please check your inbox."
}
```

---

## 🎯 Applying Verification Requirements

### Example: Protect Checkout Route

**File:** `routes/orders.js` (or wherever checkout is handled)

```javascript
const { requireVerification } = require('../middleware/verificationAuth');

// Before: No verification check
router.post('/checkout', async (req, res) => {
  // Anyone can checkout
});

// After: Requires verified email
router.post('/checkout', requireVerification, async (req, res) => {
  // Only verified users can checkout
});
```

### Recommended Routes to Protect

**Require Verification:**
- ✅ Checkout/Place Order
- ✅ Leave Reviews
- ✅ Access Purchase History
- ✅ Save Payment Methods
- ✅ Subscribe to Newsletter

**Don't Require Verification:**
- ❌ Browse Products
- ❌ Add to Bag
- ❌ View Profile
- ❌ Update Profile Info
- ❌ Resend Verification Email

---

## 🐛 Error Handling

### Common Errors & Solutions

**1. "Cannot find module 'nodemailer'"**
```bash
npm install nodemailer --save
```

**2. "Invalid login: 535-5.7.8 Username and Password not accepted"**
- You're using regular Gmail password instead of App Password
- Generate App Password as described above

**3. "Verification email not received"**
- Check spam/junk folder
- Verify EMAIL_USER in .env is correct
- Check server logs for email sending errors
- Verify Gmail App Password is correct

**4. "Invalid or expired verification token"**
- Token may have expired (24-hour limit)
- Use resend verification endpoint
- Check if user is already verified

**5. "Failed to send verification email"**
- Gmail may have blocked the email (too many emails sent)
- Check Gmail account security settings
- Verify 2-Step Verification is enabled
- Try generating new App Password

---

## 🔍 Debugging

### Enable Detailed Logs

The system includes console logs for debugging:

```bash
✅ Verification email sent: <messageId>
📧 Verification email sent to: user@example.com
❌ Error sending verification email: <error>
✅ Email verified for user: user@example.com
📧 Verification email resent to: user@example.com
```

### Test Email Sending

Create a test script:

```javascript
// test-email.js
require('dotenv').config();
const { sendVerificationEmail } = require('./utils/emailService');

sendVerificationEmail('your-test-email@gmail.com', 'Test User', 'test-token-123')
  .then(() => console.log('✅ Email sent successfully'))
  .catch(err => console.error('❌ Email error:', err));
```

Run:
```bash
node test-email.js
```

---

## 🌐 Production Deployment

### Environment Updates

**Update `.env` for production:**

```bash
# Production email (same Gmail)
EMAIL_USER=endlesscharmsofficial@gmail.com
EMAIL_PASSWORD=<your_app_password>

# Production URL (IMPORTANT!)
BASE_URL=https://endlesscharms.com  # Your actual domain
```

### Security Checklist

- [ ] Use HTTPS for production site
- [ ] Never commit `.env` file to Git
- [ ] Rotate App Password periodically
- [ ] Monitor email sending limits (Gmail: ~500/day)
- [ ] Consider using dedicated email service for high volume (SendGrid, AWS SES)
- [ ] Set up email domain verification (SPF, DKIM records)

---

## 📊 Database Queries

### Find Unverified Users

```javascript
const unverifiedUsers = await User.find({ isVerified: false });
console.log(`${unverifiedUsers.length} unverified users`);
```

### Manually Verify a User

```javascript
const user = await User.findOne({ email: 'user@example.com' });
user.isVerified = true;
user.verificationToken = undefined;
user.verificationTokenExpires = undefined;
await user.save();
```

### Find Expired Tokens

```javascript
const expiredTokenUsers = await User.find({
  isVerified: false,
  verificationTokenExpires: { $lt: new Date() }
});
```

---

## 🎨 Frontend Integration

### Display Verification Status

**After Login:**
```javascript
if (response.user.isVerified) {
  // Show normal interface
} else {
  // Show verification reminder banner
  showBanner('Please verify your email to access all features');
}
```

### Verification Page

Create a frontend page at `/verify-email` that:
1. Extracts token from URL (`?token=...`)
2. Calls `GET /api/auth/verify-email?token=...`
3. Shows success or error message
4. Redirects to home/profile after success

**Example (EJS):**
```html
<!-- views/verify-email.ejs -->
<script>
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (token) {
  fetch(`/api/auth/verify-email?token=${token}`)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert('✅ Email verified successfully!');
        window.location.href = '/';
      } else {
        alert('❌ ' + data.message);
      }
    });
}
</script>
```

### Resend Verification Button

```html
<button id="resend-verification">Resend Verification Email</button>

<script>
document.getElementById('resend-verification').addEventListener('click', () => {
  fetch('/api/auth/resend-verification', { method: 'POST' })
    .then(res => res.json())
    .then(data => alert(data.message));
});
</script>
```

---

## 📝 API Reference

### POST /api/auth/signup
**Creates new user account and sends verification email**

**Request:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string (min 8 chars)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email to verify your account.",
  "user": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "isVerified": false
  },
  "requiresVerification": true
}
```

---

### GET /api/auth/verify-email
**Verifies user's email with token**

**Query Parameters:**
- `token` (required): Verification token from email

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully! You can now access all features.",
  "user": {
    "id": "string",
    "email": "string",
    "isVerified": true
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "message": "Invalid or expired verification token"
}
```

---

### POST /api/auth/resend-verification
**Resends verification email to logged-in user**

**Headers:**
- Requires active session (user must be logged in)

**Response (200):**
```json
{
  "success": true,
  "message": "Verification email sent! Please check your inbox."
}
```

**Error (400):**
```json
{
  "success": false,
  "message": "Email is already verified"
}
```

**Error (401):**
```json
{
  "success": false,
  "message": "Please log in to resend verification email"
}
```

---

### POST /api/auth/login
**Authenticates user (allows unverified users)**

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200 - Verified):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "isAdmin": false,
    "isVerified": true
  },
  "warning": null
}
```

**Response (200 - Unverified):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    ...
    "isVerified": false
  },
  "warning": "Please verify your email address to access all features"
}
```

---

## ✅ Testing Checklist

- [ ] User can sign up with valid email
- [ ] Verification email is received
- [ ] Email has correct branding and design
- [ ] Verification link works
- [ ] User becomes verified after clicking link
- [ ] Token expires after 24 hours
- [ ] Can't reuse verification token
- [ ] Can resend verification email
- [ ] Unverified users can log in
- [ ] Unverified users blocked from protected routes
- [ ] Verified users can access protected routes
- [ ] Google OAuth users auto-verified (if needed)
- [ ] Error messages are clear and helpful

---

## 🎓 Additional Notes

### Google OAuth Users

Currently, Google OAuth users don't go through email verification (Google already verified the email). If you want to require verification for Google users too, update the Google OAuth callback:

```javascript
// routes/auth.js - Google callback
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    // Mark Google users as verified automatically
    if (req.user && !req.user.isVerified) {
      req.user.isVerified = true;
      await req.user.save();
    }
    // ... rest of code
  }
);
```

### Email Rate Limits

**Gmail Limits:**
- Free Gmail: ~500 emails/day
- Google Workspace: ~2,000 emails/day

For higher volumes, consider:
- **SendGrid**: 100 emails/day free, then paid
- **AWS SES**: $0.10 per 1,000 emails
- **Mailgun**: 5,000 emails/month free

---

## 🆘 Support

If you encounter issues:

1. Check server logs for error messages
2. Verify .env configuration
3. Test email sending independently
4. Check Gmail account security settings
5. Ensure database connection is working
6. Verify token hasn't expired

---

## 📚 Further Enhancements

Possible improvements:
- [ ] Add email verification reminder after X days
- [ ] Send welcome email after verification
- [ ] Add rate limiting to resend endpoint
- [ ] Track verification attempts
- [ ] Add admin panel to view verification stats
- [ ] Implement password reset with similar token system
- [ ] Add email templates for other notifications (orders, etc.)
- [ ] Multi-language email support

---

**Implementation Complete! ✨**

All components are now in place for a secure, professional email verification system.
