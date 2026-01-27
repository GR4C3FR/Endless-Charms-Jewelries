const nodemailer = require('nodemailer');

/**
 * Email Service for Endless Charms
 * Handles sending verification emails and other transactional emails
 */

// Create reusable transporter using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,     // endlesscharmsofficial@gmail.com
      pass: process.env.EMAIL_PASSWORD  // Gmail App Password
    }
  });
};

/**
 * Send verification email to user
 * @param {string} userEmail - Recipient email address
 * @param {string} userName - User's first name
 * @param {string} verificationToken - Unique verification token
 * @returns {Promise} - Returns promise from nodemailer
 */
const sendVerificationEmail = async (userEmail, userName, verificationToken) => {
  try {
    const transporter = createTransporter();
    
    // Get base URL from environment or use default
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;
    
    // Check if running in development mode
    const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
      // Add development warning if using localhost
    const devWarning = isLocalhost ? `
      <div class="dev-warning">
        <strong>⚠️ Development Mode:</strong> 
        <p style="margin: 5px 0;">Make sure your local development server is running at <strong>${baseUrl}</strong> before clicking the verification link.</p>
        <p style="margin: 5px 0; font-size: 13px;">If you're the developer, keep your terminal/server running when testing email verification.</p>
      </div>
    ` : '';
    
    // Email HTML template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Endless Charms</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%);
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 28px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #d4af37;
      margin-top: 0;
    }
    .content p {
      margin: 15px 0;
      font-size: 16px;
    }
    .verify-button {
      display: inline-block;
      margin: 30px 0;
      padding: 15px 40px;
      background-color: #d4af37;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      font-size: 16px;
      transition: background-color 0.3s;
    }
    .verify-button:hover {
      background-color: #b8941f;
    }
    .button-container {
      text-align: center;
    }
    .footer {
      background-color: #f8f8f8;
      padding: 20px 30px;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
    .divider {
      height: 1px;
      background-color: #e0e0e0;
      margin: 20px 0;
    }    .info-box {
      background-color: #fff9e6;
      border-left: 4px solid #d4af37;
      padding: 15px;
      margin: 20px 0;
      font-size: 14px;
    }
    .dev-warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>✨ Endless Charms ✨</h1>
    </div>
    
    <div class="content">
      <h2>Welcome to Endless Charms, ${userName}!</h2>
      
      <p>Thank you for joining our community of jewelry lovers. We're thrilled to have you here!</p>
      
      <p>To complete your registration and start exploring our exquisite collection of handcrafted jewelry, please verify your email address by clicking the button below:</p>
        <div class="button-container">
        <a href="${verificationLink}" class="verify-button">Verify Email</a>
      </div>
      
      ${devWarning}
      
      <div class="info-box">
        <strong>⏰ Important:</strong> This verification link will expire in 24 hours for security reasons.
      </div>
      
      <div class="divider"></div>
      
      <p style="font-size: 14px; color: #666;">
        If the button above doesn't work, copy and paste this link into your browser:
      </p>
      <p style="font-size: 14px; color: #d4af37; word-break: break-all;">
        ${verificationLink}
      </p>
      
      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        If you didn't create an account with Endless Charms, please ignore this email.
      </p>
    </div>
    
    <div class="footer">
      <p style="margin: 5px 0;"><strong>Endless Charms</strong></p>
      <p style="margin: 5px 0;">Crafting Memories, One Charm at a Time</p>
      <p style="margin: 15px 0 5px 0; font-size: 12px;">
        © ${new Date().getFullYear()} Endless Charms. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `;
    
    // Plain text version for email clients that don't support HTML
    const textContent = `
Welcome to Endless Charms, ${userName}!

Thank you for joining our community of jewelry lovers.

To complete your registration, please verify your email address by visiting this link:
${verificationLink}

This link will expire in 24 hours for security reasons.

If you didn't create an account with Endless Charms, please ignore this email.

---
Endless Charms
Crafting Memories, One Charm at a Time
© ${new Date().getFullYear()} Endless Charms. All rights reserved.
    `;
    
    // Send email
    const mailOptions = {
      from: {
        name: 'Endless Charms',
        address: process.env.EMAIL_USER
      },
      to: userEmail,
      subject: 'Verify Your Email - Endless Charms',
      text: textContent,
      html: htmlContent
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw error;
  }
};

/**
 * Send password reset email (for future implementation)
 */
const sendPasswordResetEmail = async (userEmail, userName, resetToken) => {
  // TODO: Implement password reset email
  console.log('Password reset email functionality - to be implemented');
};

/**
 * Send order confirmation email (for future implementation)
 */
const sendOrderConfirmationEmail = async (userEmail, userName, orderDetails) => {
  // TODO: Implement order confirmation email
  console.log('Order confirmation email functionality - to be implemented');
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail
};
