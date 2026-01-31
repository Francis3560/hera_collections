import nodemailer from 'nodemailer';
import { config } from '../../configs/config.js';
import {
  createOrderConfirmationEmail,
  createOrderProcessingEmail,
  createOrderShippedEmail,
  createAdminOrderNotification
} from './orderTemplates.js';
import {
  createPaymentSuccessEmail,
  createPaymentFailedEmail
} from './paymentTemplates.js';
import { wrapWithLayout } from './emailLayout.js';

const BRAND_PRIMARY = '#7C3AED';

const createTransporter = () => {
  try {
    const transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    return transporter;
  } catch (error) {
    throw new Error(`Failed to create transporter: ${error.message}`);
  }
};

const verifyTransporter = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Transporter verification failed:', error);
    return false;
  }
};

const createVerificationEmailTemplate = (userName, verificationCode) => {
  const content = `
    <p>Hello ${userName || 'valued customer'},</p>
    <p>Thank you for choosing Hera Collections. To secure your account and complete your registration, please verify your email address using the code below.</p>
    
    <div style="text-align: center; margin: 40px 0;">
        <div style="display: inline-block; background: #f3f4f6; border: 2px solid ${BRAND_PRIMARY}; color: ${BRAND_PRIMARY}; font-size: 48px; font-weight: 800; padding: 24px 48px; border-radius: 20px; letter-spacing: 12px; font-family: 'Courier New', monospace;">
            ${verificationCode}
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-top: 16px;">This code will expire in 24 hours.</p>
    </div>
    
    <div class="section">
        <span class="section-title">Next Steps</span>
        <ol style="margin: 0; padding-left: 20px; color: #4b5563;">
            <li style="margin-bottom: 8px;">Copy the 6-digit code above</li>
            <li style="margin-bottom: 8px;">Return to the verification page</li>
            <li style="margin-bottom: 8px;">Enter the code to activate your account</li>
        </ol>
    </div>
    
    <p style="font-size: 13px; color: #9ca3af; text-align: center;">If you did not request this, please ignore this email or contact support if you have concerns.</p>
  `;

  return wrapWithLayout('Verify Your Account', content);
};

// Welcome email template (after verification)
const createWelcomeEmailTemplate = (userName) => {
  const content = `
    <div style="text-align: center;">
        <div style="font-size: 64px; margin-bottom: 24px;">✨</div>
        <p>Hello <strong>${userName || 'there'}</strong>,</p>
        <p>Welcome to the family! Your account is now fully active, and you're ready to experience the finest collections.</p>
    </div>
    
    <div class="section">
        <span class="section-title">What's Next?</span>
        <div style="display: grid; gap: 20px;">
            <div style="display: flex; gap: 16px;">
                <div style="font-size: 24px;">👜</div>
                <div>
                    <div style="font-weight: 700;">Explore Collections</div>
                    <div style="font-size: 14px; color: #6b7280;">Discover our latest premium bags and accessories.</div>
                </div>
            </div>
            <div style="display: flex; gap: 16px;">
                <div style="font-size: 24px;">👔</div>
                <div>
                    <div style="font-weight: 700;">Curated Picks</div>
                    <div style="font-size: 14px; color: #6b7280;">Hand-picked items tailored for your lifestyle.</div>
                </div>
            </div>
        </div>
    </div>
    
    <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/collections" class="button">Start Shopping</a>
    </div>
    
    <p style="text-align: center; color: #6b7280; font-size: 14px;">If you have any questions, our support team is always here to help.</p>
  `;

  return wrapWithLayout('Welcome to Hera Collection', content);
};

const sendEmail = async (to, subject, html, text = null) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Hera Collections" <${config.email.user}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

export const sendVerificationEmail = async (userEmail, userName, verificationCode) => {
  const subject = 'Verify Your Email - Hera Collection';
  const html = createVerificationEmailTemplate(userName, verificationCode);
  
  return await sendEmail(userEmail, subject, html);
};

export const sendWelcomeEmail = async (userEmail, userName) => {
  const subject = 'Welcome to Hera Collection!';
  const html = createWelcomeEmailTemplate(userName);
  
  return await sendEmail(userEmail, subject, html);
};


export { createTransporter, verifyTransporter, sendEmail };
export const sendOrderConfirmationEmail = async (order, customerName, orderItems) => {
  const subject = `Order Confirmation - ${order.orderNumber} - Hera Collections`;
  const html = createOrderConfirmationEmail(order, customerName, orderItems);
  
  const customerEmail = order.customerEmail;
  if (!customerEmail) {
    console.warn('No customer email for order confirmation');
    return null;
  }
  
  return await sendEmail(customerEmail, subject, html);
};

export const sendOrderProcessingEmail = async (order, customerName) => {
  const subject = `Your Order is Being Processed - ${order.orderNumber}`;
  const html = createOrderProcessingEmail(order, customerName);
  
  const customerEmail = order.customerEmail;
  if (!customerEmail) {
    console.warn('No customer email for order processing notification');
    return null;
  }
  
  return await sendEmail(customerEmail, subject, html);
};

export const sendOrderShippedEmail = async (order, customerName, trackingNumber = null, estimatedDelivery = null) => {
  const subject = `Your Order Has Shipped! - ${order.orderNumber}`;
  const html = createOrderShippedEmail(order, customerName, trackingNumber, estimatedDelivery);
  
  const customerEmail = order.customerEmail;
  if (!customerEmail) {
    console.warn('No customer email for shipping notification');
    return null;
  }
  
  return await sendEmail(customerEmail, subject, html);
};

export const sendAdminOrderNotification = async (order, items, customerName) => {
  const subject = `📦 New Order Received - ${order.orderNumber}`;
  const html = createAdminOrderNotification(order, items, customerName);
  
  const adminEmail = process.env.ADMIN_EMAIL || config.email.user;
  if (!adminEmail) {
    console.warn('No admin email configured for order notifications');
    return null;
  }
  
  return await sendEmail(adminEmail, subject, html);
};

export const sendOrderStatusUpdateEmail = async (order, customerName, oldStatus, newStatus) => {
  const content = `
    <p>Dear ${customerName},</p>
    <p>The status of your order <strong>#${order.orderNumber}</strong> has been updated.</p>
    
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 20px; padding: 32px; text-align: center; margin: 32px 0;">
        <div style="font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">Order Status</div>
        <div style="display: flex; align-items: center; justify-content: center; gap: 16px;">
            <span style="color: #9ca3af; text-decoration: line-through; font-size: 18px;">${statusMap[oldStatus]?.text || oldStatus}</span>
            <span style="font-size: 24px; color: #6b7280;">→</span>
            <span class="status-badge" style="background: ${statusMap[newStatus]?.color || '#f3f4f6'}; color: white; font-size: 24px; padding: 8px 24px;">
                ${statusMap[newStatus]?.text || newStatus}
            </span>
        </div>
    </div>
    
    <div class="section">
        <span class="section-title">Order Summary</span>
        <div class="item-row">
            <div style="color: #6b7280;">Order Total</div>
            <div style="font-weight: 700;">KES ${order.totalAmount.toLocaleString()}</div>
        </div>
        <div class="item-row">
            <div style="color: #6b7280;">Shipping Status</div>
            <div style="font-weight: 600;">${newStatus === 'SHIPPED' ? 'In Transit' : 'Processing'}</div>
        </div>
    </div>
    
    <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order.id}" class="button">View Order Details</a>
    </div>
  `;

  const html = wrapWithLayout('Order Status Updated', content);

  const subject = `Order Status Updated: ${order.orderNumber} is now ${statusMap[newStatus]?.text || newStatus}`;
  
  const customerEmail = order.customerEmail;
  if (!customerEmail) {
    console.warn('No customer email for status update');
    return null;
  }
  
  return await sendEmail(customerEmail, subject, html);
};
export const sendPaymentSuccessEmail = async (paymentIntent, order, customer) => {
  const subject = `Payment Successful - Order ${order?.orderNumber || paymentIntent.id}`;
  const html = createPaymentSuccessEmail(paymentIntent, order, customer);
  
  const customerEmail = customer?.email;
  if (!customerEmail) {
    console.warn('No customer email for payment success notification');
    return null;
  }
  
  return await sendEmail(customerEmail, subject, html);
};

export const sendPaymentFailedEmail = async (paymentIntent, customer, failureReason) => {
  const subject = `Payment Failed - Hera Collections`;
  const html = createPaymentFailedEmail(paymentIntent, customer, failureReason);
  
  const customerEmail = customer?.email;
  if (!customerEmail) {
    console.warn('No customer email for payment failure notification');
    return null;
  }
  
  return await sendEmail(customerEmail, subject, html);
};
export const sendLowStockAlertEmail = async (product, currentStock, threshold) => {
  const subject = `⚠️ Low Stock Alert: ${product.title}`;
  
  const content = `
    <div style="background: #FFFBEB; border: 1px solid #FEF3C7; color: #92400E; padding: 16px; border-radius: 12px; text-align: center; margin-bottom: 32px; font-weight: 700;">
        ⚠️ LOW STOCK NOTIFICATION
    </div>
    
    <p>The following product has reached its low stock threshold and may need restocking soon.</p>
    
    <div class="section">
        <span class="section-title">Product Details</span>
        <div class="item-row">
            <div style="color: #6b7280;">Product Name</div>
            <div style="font-weight: 700;">${product.title}</div>
        </div>
        <div class="item-row">
            <div style="color: #6b7280;">Current Inventory</div>
            <div style="font-weight: 800; color: #b91c1c; font-size: 20px;">${currentStock} units</div>
        </div>
        <div class="item-row">
            <div style="color: #6b7280;">Threshold Level</div>
            <div style="font-weight: 600;">${threshold} units</div>
        </div>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.ADMIN_URL || 'http://localhost:3000/admin'}/products/${product.id}" class="button" style="background: #111827; margin-right: 12px;">View Product</a>
        <a href="${process.env.ADMIN_URL || 'http://localhost:3000/admin'}/inventory" class="button">Manage Inventory</a>
    </div>
    
    <p style="font-size: 13px; color: #6b7280; text-align: center;">This is an automated operational alert from your inventory management system.</p>
  `;

  const html = wrapWithLayout('Low Stock Alert', content);

  const adminEmail = process.env.ADMIN_EMAIL || config.email.user;
  if (!adminEmail) {
    console.warn('No admin email configured for stock alerts');
    return null;
  }
  const inventoryEmail = process.env.INVENTORY_EMAIL || adminEmail;
  
  return await sendEmail([adminEmail, inventoryEmail], subject, html);
};


const createGoogleWelcomeEmailTemplate = (userName) => {
  const content = `
    <div style="text-align: center;">
        <div style="font-size: 64px; margin-bottom: 24px;">✨</div>
        <p>Hello <strong>${userName || 'there'}</strong>,</p>
        <p>Thank you for joining Hera Collections with your Google account! Your account is verified and ready for use.</p>
    </div>
    
    <div class="section">
        <span class="section-title">Get Started</span>
        <p>Explore our curated collections of premium bags and accessories. As a Google user, you have instant access to all our membership features.</p>
    </div>
    
    <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">Go to Dashboard</a>
    </div>
    
    <p style="text-align: center; color: #6b7280; font-size: 14px;">If you have any questions, feel free to reply to this email.</p>
  `;

  return wrapWithLayout('Welcome to Hera Collection', content);
};

export const sendGoogleWelcomeEmail = async (userEmail, userName) => {
  const subject = 'Welcome to Hera Collection! (Google Signup)';
  const html = createGoogleWelcomeEmailTemplate(userName);
  
  return await sendEmail(userEmail, subject, html);
};
const createPasswordResetEmailTemplate = (userName, resetLink) => {
  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 64px; margin-bottom: 24px;">🔐</div>
      <p>Hello <strong>${userName || 'User'}</strong>,</p>
      <p>We received a request to reset the password for your Hera Collection account.</p>
    </div>
    
    <div class="section">
        <span class="section-title">Reset Your Password</span>
        <p>To create a new password, please click the button below. This link will expire in 1 hour for your security.</p>
        
        <div style="text-align: center;">
            <a href="${resetLink}" class="button" style="margin: 20px 0;">Reset Password</a>
        </div>
        
        <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">If the button doesn't work, copy and paste this link:</p>
            <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 11px; word-break: break-all; color: #4b5563;">
                ${resetLink}
            </div>
        </div>
    </div>
    
    <div class="section" style="background: #f9fafb;">
        <span class="section-title">Security Reminder</span>
        <ul style="color: #6b7280; font-size: 13px; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 6px;">Use at least 8 characters with numbers and symbols</li>
            <li style="margin-bottom: 6px;">Don't use the same password as other sites</li>
            <li>If you didn't request this, you can safely ignore this email</li>
        </ul>
    </div>
  `;

  return wrapWithLayout('Password Reset Request', content);
};

export const sendPasswordResetEmail = async (userEmail, userName, resetToken) => {
  const resetLink = `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/reset-password/${resetToken}`;
  const subject = 'Reset Your Password - Hera Collection';
  const html = createPasswordResetEmailTemplate(userName, resetLink);
  
  return await sendEmail(userEmail, subject, html);
};

export const sendPasswordChangedEmail = async (userEmail, userName) => {
  const subject = 'Password Changed - Hera Collection';
  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 64px; margin-bottom: 24px;">✅</div>
      <p>Hello <strong>${userName || 'User'}</strong>,</p>
      <p>Your Hera Collection account password was changed successfully on ${new Date().toLocaleString()}.</p>
    </div>
    
    <div class="section">
        <span class="section-title">Security Information</span>
        <ul style="color: #6b7280; font-size: 14px; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 12px;">All your existing active sessions have been logged out</li>
            <li style="margin-bottom: 12px;">You'll need to log in again with your new password on all devices</li>
            <li>If you did not perform this action, please contact our security team immediately</li>
        </ul>
    </div>
    
    <p style="text-align: center; color: #6b7280; font-size: 13px; margin-top: 32px;">
        Thank you for helping us keep your account secure.
    </p>
  `;

  const html = wrapWithLayout('Password Changed Successfully', content);
  
  return await sendEmail(userEmail, subject, html);
};

const createContactEmailTemplate = (name, email, subject, message) => {
  const content = `
    <div style="background: #111827; color: white; padding: 24px; border-radius: 12px; margin-bottom: 32px; text-align: center;">
        📬 NEW INQUIRY RECEIVED
    </div>
    
    <div class="section">
        <span class="section-title">Sender Information</span>
        <div class="item-row">
            <div style="color: #6b7280;">Name</div>
            <div style="font-weight: 700;">${name}</div>
        </div>
        <div class="item-row">
            <div style="color: #6b7280;">Email</div>
            <div style="font-weight: 600;">${email}</div>
        </div>
    </div>
    
    <div class="section">
        <span class="section-title">Message Details</span>
        <div style="margin-bottom: 16px;">
            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Subject</div>
            <div style="font-weight: 700; color: #111827;">${subject}</div>
        </div>
        <div>
            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px;">Message Content</div>
            <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; line-height: 1.8; color: #374151;">
                ${message}
            </div>
        </div>
    </div>
    
    <div style="text-align: center;">
        <a href="mailto:${email}?subject=Re: ${subject}" class="button" style="background: #111827;">Reply Directly</a>
    </div>
  `;

  return wrapWithLayout('New Contact Inquiry', content);
};

export const sendContactEmail = async (contactData) => {
  const { name, email, subject, message } = contactData;
  const html = createContactEmailTemplate(name, email, subject, message);
  const adminEmail = process.env.ADMIN_EMAIL || config.email.user;
  
  return await sendEmail(adminEmail, `New Contact Inquiry: ${subject}`, html);
};