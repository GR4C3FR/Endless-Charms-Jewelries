const nodemailer = require('nodemailer');

/**
 * Email Service for Endless Charms
 * Handles sending verification emails and other transactional emails
 */

// Create reusable transporter using Gmail SMTP
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER || 'endlesscharmsofficial@gmail.com';
  const emailPass = process.env.EMAIL_PASSWORD || 'cygf hxwe ebqx lrkc';
  
  console.log('📧 Creating email transporter for:', emailUser);
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    },
    debug: true, // Enable debug output
    logger: true // Log to console
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
    const baseUrl = process.env.BASE_URL || 'https://endlesscharms.store';
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
      font-family: 'Arial', 'Helvetica Neue', Helvetica, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      overflow: hidden;
    }
    .header {
      background-color: #ffffff;
      padding: 40px 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #5D0E1A;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 28px;
      font-weight: 400;
      letter-spacing: 1px;
    }
    .header-divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 0 30px;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #5D0E1A;
      font-family: Georgia, 'Times New Roman', serif;
      font-weight: 400;
      font-size: 22px;
      margin-top: 0;
      letter-spacing: 0.5px;
    }
    .content p {
      margin: 15px 0;
      font-size: 15px;
      line-height: 1.7;
      color: #4b5563;
    }
    .verify-button {
      display: inline-block;
      margin: 28px 0;
      padding: 12px 32px;
      background-color: #5D0E1A;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 500;
      font-size: 15px;
      letter-spacing: 0.3px;
    }
    .button-container {
      text-align: center;
    }
    .footer {
      background-color: #ffffff;
      padding: 20px 30px;
      text-align: center;
      font-size: 13px;
      color: #9ca3af;
    }
    .footer-divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 0 30px;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 24px 0;
    }
    .info-box {
      border-left: 3px solid #5D0E1A;
      padding: 12px 16px;
      margin: 24px 0;
      font-size: 13px;
      color: #6b7280;
    }
    .dev-warning {
      border-left: 3px solid #9ca3af;
      padding: 12px 16px;
      margin: 20px 0;
      font-size: 13px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Endless Charms</h1>
    </div>
    <div class="header-divider"></div>
    
    <div class="content">
      <h2>Welcome to Endless Charms, ${userName}.</h2>
      
      <p>Thank you for joining us. We are delighted to have you here.</p>
      
      <p>To complete your registration and begin exploring our collection, please verify your email address by clicking the button below.</p>
      
      <div class="button-container">
        <a href="${verificationLink}" class="verify-button">Verify Email</a>
      </div>
      
      ${devWarning}
      
      <div class="info-box">
        <strong>Please note:</strong> This verification link will expire in 24 hours for security reasons.
      </div>
      
      <div class="divider"></div>
      
      <p style="font-size: 13px; color: #9ca3af;">
        If the button above doesn't work, copy and paste this link into your browser:
      </p>
      <p style="font-size: 13px; color: #5D0E1A; word-break: break-all;">
        ${verificationLink}
      </p>
      
      <p style="margin-top: 28px; font-size: 13px; color: #9ca3af;">
        If you didn't create an account with Endless Charms, please disregard this email.
      </p>
    </div>
    
    <div class="footer-divider"></div>
    <div class="footer">
      <p style="margin: 5px 0; color: #5D0E1A; font-family: Georgia, 'Times New Roman', serif; font-size: 15px; letter-spacing: 0.5px;">Endless Charms</p>
      <p style="margin: 5px 0; font-size: 12px;">Crafting Memories, One Charm at a Time</p>
      <p style="margin: 15px 0 5px 0; font-size: 11px;">
        &copy; ${new Date().getFullYear()} Endless Charms. All rights reserved.
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
        address: process.env.EMAIL_USER || 'endlesscharmsofficial@gmail.com'
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
  try {
    const transporter = createTransporter();
    
    const baseUrl = process.env.BASE_URL || 'https://endlesscharms.store';
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Endless Charms</title>
  <style>
    body {
      font-family: 'Arial', 'Helvetica Neue', Helvetica, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      overflow: hidden;
    }
    .header {
      background-color: #ffffff;
      padding: 40px 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #5D0E1A;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 28px;
      font-weight: 400;
      letter-spacing: 1px;
    }
    .header-divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 0 30px;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #5D0E1A;
      font-family: Georgia, 'Times New Roman', serif;
      font-weight: 400;
      font-size: 22px;
      margin-top: 0;
      letter-spacing: 0.5px;
    }
    .content p {
      margin: 15px 0;
      font-size: 15px;
      line-height: 1.7;
      color: #4b5563;
    }
    .reset-button {
      display: inline-block;
      margin: 28px 0;
      padding: 12px 32px;
      background-color: #5D0E1A;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 500;
      font-size: 15px;
      letter-spacing: 0.3px;
    }
    .button-container {
      text-align: center;
    }
    .footer {
      background-color: #ffffff;
      padding: 20px 30px;
      text-align: center;
      font-size: 13px;
      color: #9ca3af;
    }
    .footer-divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 0 30px;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 24px 0;
    }
    .info-box {
      border-left: 3px solid #5D0E1A;
      padding: 12px 16px;
      margin: 24px 0;
      font-size: 13px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Endless Charms</h1>
    </div>
    <div class="header-divider"></div>
    
    <div class="content">
      <h2>Password Reset Request</h2>
      
      <p>Hello ${userName},</p>
      
      <p>We received a request to reset the password associated with your Endless Charms account. To create a new password, please click the button below.</p>
      
      <div class="button-container">
        <a href="${resetLink}" class="reset-button">Reset Password</a>
      </div>
      
      <div class="info-box">
        <strong>Please note:</strong> This link will expire in 1 hour for security reasons.
      </div>
      
      <div class="divider"></div>
      
      <p style="font-size: 13px; color: #9ca3af;">
        If the button above doesn't work, copy and paste this link into your browser:
      </p>
      <p style="font-size: 13px; color: #5D0E1A; word-break: break-all;">
        ${resetLink}
      </p>
      
      <p style="margin-top: 28px; font-size: 13px; color: #9ca3af;">
        If you didn't request a password reset, please disregard this email. Your password will remain unchanged.
      </p>
    </div>
    
    <div class="footer-divider"></div>
    <div class="footer">
      <p style="margin: 5px 0; color: #5D0E1A; font-family: Georgia, 'Times New Roman', serif; font-size: 15px; letter-spacing: 0.5px;">Endless Charms</p>
      <p style="margin: 5px 0; font-size: 12px;">Crafting Memories, One Charm at a Time</p>
      <p style="margin: 15px 0 5px 0; font-size: 11px;">
        &copy; ${new Date().getFullYear()} Endless Charms. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `;
    
    const textContent = `
Password Reset Request - Endless Charms

Hello ${userName},

We received a request to reset your password. Visit this link to create a new password:
${resetLink}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

---
Endless Charms
    `;
    
    const mailOptions = {
      from: { name: 'Endless Charms', address: process.env.EMAIL_USER || 'endlesscharmsofficial@gmail.com' },
      to: userEmail,
      subject: 'Reset Your Password - Endless Charms',
      text: textContent,
      html: htmlContent
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw error;
  }
};

/**
 * Send order confirmation email (for future implementation)
 */
const sendOrderConfirmationEmail = async (userEmail, userName, orderDetails) => {
  // TODO: Implement order confirmation email
  console.log('Order confirmation email functionality - to be implemented');
};

/**
 * Send contact form submission to Endless Charms
 */
const sendContactFormEmail = async (name, email, phone, message) => {
  try {
    const transporter = createTransporter();
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #620418; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
    .field { margin-bottom: 20px; }
    .label { font-weight: bold; color: #620418; }
    .value { margin-top: 5px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Contact Form Submission</h2>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Name:</div>
        <div class="value">${name}</div>
      </div>
      <div class="field">
        <div class="label">Email:</div>
        <div class="value">${email}</div>
      </div>
      <div class="field">
        <div class="label">Phone Number:</div>
        <div class="value">${phone}</div>
      </div>
      <div class="field">
        <div class="label">Message:</div>
        <div class="value">${message}</div>
      </div>
    </div>
    <div class="footer">
      <p>This message was sent from the Endless Charms contact form.</p>
    </div>
  </div>
</body>
</html>
    `;
    
    const textContent = `
New Contact Form Submission

Name: ${name}
Email: ${email}
Phone: ${phone}
Message: ${message}

---
This message was sent from the Endless Charms contact form.
    `;
    
    const mailOptions = {
      from: {
        name: 'Endless Charms Contact Form',
        address: process.env.EMAIL_USER || 'endlesscharmsofficial@gmail.com'
      },
      to: process.env.EMAIL_USER || 'endlesscharmsofficial@gmail.com', // Send to Endless Charms email
      replyTo: email, // Allow replying directly to the customer
      subject: `Contact Form: Message from ${name}`,
      text: textContent,
      html: htmlContent
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Contact form email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error sending contact form email:', error);
    throw error;
  }
};

/**
 * Send order status update email
 * @param {string} userEmail - Recipient email address
 * @param {string} userName - User's first name
 * @param {string} orderNumber - Order number
 * @param {string} status - New order status
 * @param {string} message - Status message
 * @param {string} trackingNumber - Optional tracking number
 */
const sendOrderStatusEmail = async (userEmail, userName, orderNumber, status, message, trackingNumber = null) => {
  try {
    const transporter = createTransporter();
    
    const statusColors = {
      'confirmed': '#3b82f6',
      'processing': '#8b5cf6',
      'shipped': '#06b6d4',
      'delivered': '#10b981',
      'completed': '#16a34a',
      'cancelled': '#ef4444'
    };
    
    const statusColor = statusColors[status] || '#d4af37';
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Update - Endless Charms</title>
  <style>
    body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%); padding: 30px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 28px; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
    .content { padding: 40px 30px; }
    .status-badge { display: inline-block; padding: 10px 20px; background-color: ${statusColor}; color: white; border-radius: 25px; font-weight: bold; text-transform: uppercase; margin: 15px 0; }
    .order-number { background: #f8f8f8; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .tracking-info { background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0284c7; }
    .footer { background-color: #f8f8f8; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>✨ Endless Charms ✨</h1>
    </div>
    <div class="content">
      <h2 style="color: #d4af37;">Order Update</h2>
      <p>Hi ${userName || 'Valued Customer'},</p>
      
      <div class="order-number">
        <strong>Order #${orderNumber}</strong>
      </div>
      
      <p><strong>Status:</strong> <span class="status-badge">${status.toUpperCase()}</span></p>
      
      <p>${message}</p>
      
      ${trackingNumber ? `
        <div class="tracking-info">
          <strong>📦 Tracking Information</strong>
          <p style="margin: 10px 0;"><strong>Carrier:</strong> LBC Express</p>
          <p style="margin: 10px 0;"><strong>Tracking Number:</strong> ${trackingNumber}</p>
          <p style="margin: 10px 0;"><a href="https://www.lbcexpress.com/tracking?TrackingNo=${trackingNumber}" target="_blank" style="color: #0284c7;">Track Your Package →</a></p>
        </div>
      ` : ''}
      
      <p>If you have any questions about your order, feel free to contact us:</p>
      <ul>
        <li>Email: endlesscharmsofficial@gmail.com</li>
        <li>Phone: +63 916 430 5638</li>
        <li>Facebook: @endlesscharmsph</li>
      </ul>
      
      <p>Thank you for choosing Endless Charms! 💍</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Endless Charms. All rights reserved.</p>
      <p>This is an automated message. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
    `;
    
    const textContent = `
Order Update - Endless Charms

Hi ${userName || 'Valued Customer'},

Your order #${orderNumber} has been updated.

Status: ${status.toUpperCase()}

${message}

${trackingNumber ? `Tracking Number: ${trackingNumber}
Track your package: https://www.lbcexpress.com/tracking?TrackingNo=${trackingNumber}` : ''}

If you have any questions, contact us:
- Email: endlesscharmsofficial@gmail.com
- Phone: +63 916 430 5638

Thank you for choosing Endless Charms!
    `;
    
    const mailOptions = {
      from: {
        name: 'Endless Charms',
        address: process.env.EMAIL_USER || 'endlesscharmsofficial@gmail.com'
      },
      to: userEmail,
      subject: `Order Update: #${orderNumber} - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      text: textContent,
      html: htmlContent
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Order status email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error sending order status email:', error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendContactFormEmail,
  sendOrderStatusEmail
};
