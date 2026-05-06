const nodemailer = require('nodemailer');
const logger = require('./logger');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
  });
};

const isEmailConfigured = () => {
  return (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    !process.env.SMTP_USER.includes('your_') &&
    !process.env.SMTP_PASS.includes('your_')
  );
};

const sendEmail = async ({ to, subject, html }) => {
  if (!isEmailConfigured()) {
    logger.warn(`Email skipped for ${to}: SMTP is not configured`);
    return null;
  }

  const transporter = createTransporter();
  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to,
    subject,
    html,
  };
  const info = await transporter.sendMail(mailOptions);
  logger.info(`Email sent to ${to}: ${info.messageId}`);
  return info;
};

const sendWelcomeEmail = async (user, verificationUrl) => {
  await sendEmail({
    to: user.email,
    subject: 'Welcome to ShopSphere – Verify Your Email',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:32px;border-radius:12px;">
        <h1 style="color:#6366f1;text-align:center;">Welcome to ShopSphere!</h1>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>Thank you for registering. Please verify your email address to get started.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${verificationUrl}" style="background:#6366f1;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Verify Email</a>
        </div>
        <p style="color:#6b7280;font-size:13px;">This link expires in 24 hours. If you didn't register, please ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
        <p style="color:#9ca3af;font-size:12px;text-align:center;">© ${new Date().getFullYear()} ShopSphere. All rights reserved.</p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (user, resetUrl) => {
  await sendEmail({
    to: user.email,
    subject: 'ShopSphere – Password Reset Request',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:32px;border-radius:12px;">
        <h1 style="color:#6366f1;text-align:center;">Reset Your Password</h1>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>We received a request to reset your ShopSphere password. Click the button below to proceed.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${resetUrl}" style="background:#ef4444;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Reset Password</a>
        </div>
        <p style="color:#6b7280;font-size:13px;">This link expires in 1 hour. If you did not request a password reset, please ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
        <p style="color:#9ca3af;font-size:12px;text-align:center;">© ${new Date().getFullYear()} ShopSphere. All rights reserved.</p>
      </div>
    `,
  });
};

const sendOrderConfirmationEmail = async (user, order) => {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${item.product?.name || item.name}</td>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

  await sendEmail({
    to: user.email,
    subject: `ShopSphere – Order Confirmed #${order.orderNumber}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:32px;border-radius:12px;">
        <h1 style="color:#10b981;text-align:center;">Order Confirmed!</h1>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>Your order <strong>#${order.orderNumber}</strong> has been placed successfully.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <thead><tr style="background:#6366f1;color:#fff;">
            <th style="padding:10px;text-align:left;">Product</th>
            <th style="padding:10px;text-align:center;">Qty</th>
            <th style="padding:10px;text-align:right;">Price</th>
          </tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <p style="text-align:right;font-size:18px;"><strong>Total: ₹${order.totalAmount.toFixed(2)}</strong></p>
        <p style="color:#6b7280;">Estimated delivery: 3–7 business days</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
        <p style="color:#9ca3af;font-size:12px;text-align:center;">© ${new Date().getFullYear()} ShopSphere. All rights reserved.</p>
      </div>
    `,
  });
};

module.exports = { sendEmail, sendWelcomeEmail, sendPasswordResetEmail, sendOrderConfirmationEmail };
