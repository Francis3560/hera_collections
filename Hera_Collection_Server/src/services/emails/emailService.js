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

const BRAND_PRIMARY = '#CD7F32';
const BRAND_DARK = '#0F172A';

const statusMap = {
  'PENDING': { text: 'Ordered', color: '#64748B' },
  'PAID': { text: 'Paid', color: '#10B981' },
  'PROCESSING': { text: 'Fulfilling', color: '#CD7F32' },
  'FULFILLED': { text: 'Ready', color: '#3B82F6' },
  'SHIPPED': { text: 'In Transit', color: '#8B5CF6' },
  'COMPLETED': { text: 'Delivered', color: '#166534' },
  'CANCELLED': { text: 'Cancelled', color: '#991B1B' }
};

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
    <p>Dear ${userName || 'Client'},</p>
    <p>Thank you for initiating your registration with Hera Collection. To finalize your account security, please utilize the authorization code provided below.</p>
    
    <div style="text-align: center; margin: 40px 0;">
        <div style="display: inline-block; background-color: #F8FAFC; border: 1px solid #E2E8F0; color: ${BRAND_DARK}; font-size: 32px; font-weight: 700; padding: 20px 40px; border-radius: 4px; letter-spacing: 10px; font-family: monospace;">
            ${verificationCode}
        </div>
        <p style="color: #64748B; font-size: 13px; margin-top: 16px;">This authorization code is valid for 24 hours.</p>
    </div>
    
    <div class="section">
        <span class="section-title">Completion Steps</span>
        <p style="font-size: 14px; color: #334155; margin: 0;">Please enter this code on the verification screen to activate your professional profile and access our collections.</p>
    </div>
    
    <p style="font-size: 12px; color: #94A3B8; text-align: center;">If you did not initiate this request, please contact our administrative team immediately.</p>
  `;

  return wrapWithLayout('Account Verification', content);
};

// Welcome email template (after verification)
const createWelcomeEmailTemplate = (userName) => {
  const content = `
    <div style="text-align: center;">
        <p>Dear <strong>${userName || 'Client'}</strong>,</p>
        <p>Welcome to Hera Collection. Your account has been successfully verified, and you now have full access to our premium collections and tailored services.</p>
    </div>
    
    <div class="section">
        <span class="section-title">Member Privileges</span>
        <div style="display: grid; gap: 20px;">
            <div style="border-left: 3px solid ${BRAND_PRIMARY}; padding-left: 16px;">
                <div style="font-weight: 700; color: ${BRAND_DARK}; text-transform: uppercase; font-size: 12px;">Exclusive Catalog Access</div>
                <div style="font-size: 14px; color: #64748B; margin-top: 4px;">Explore our latest acquisitions in premium bags and luxury accessories.</div>
            </div>
            <div style="border-left: 3px solid ${BRAND_PRIMARY}; padding-left: 16px;">
                <div style="font-weight: 700; color: ${BRAND_DARK}; text-transform: uppercase; font-size: 12px;">Order Management</div>
                <div style="font-size: 14px; color: #64748B; margin-top: 4px;">Track your acquisitions and view your transaction history in real-time.</div>
            </div>
        </div>
    </div>
    
    <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/collections" class="button">View Collections</a>
    </div>
    
    <p style="text-align: center; color: #64748B; font-size: 13px;">Our client service team is available should you require any assistance with your account.</p>
  `;

  return wrapWithLayout('Welcome to Hera Collection', content);
};

const sendEmail = async (to, subject, html, text = null) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Hera Collection" <admin@heracollections.com>`,
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
  const subject = 'Account Verification Required - Hera Collection';
  const html = createVerificationEmailTemplate(userName, verificationCode);
  
  return await sendEmail(userEmail, subject, html);
};

export const sendWelcomeEmail = async (userEmail, userName) => {
  const subject = 'Your Account is Active - Welcome to Hera Collection';
  const html = createWelcomeEmailTemplate(userName);
  
  return await sendEmail(userEmail, subject, html);
};

export { createTransporter, verifyTransporter, sendEmail };
export const sendOrderConfirmationEmail = async (order, customerName, orderItems) => {
  const subject = `Order Confirmation: ${order.orderNumber} - Hera Collection`;
  const html = createOrderConfirmationEmail(order, customerName, orderItems);
  
  const customerEmail = order.customerEmail;
  if (!customerEmail) {
    console.warn('No customer email for order confirmation');
    return null;
  }
  
  return await sendEmail(customerEmail, subject, html);
};

export const sendOrderProcessingEmail = async (order, customerName) => {
  const subject = `Fulfillment Update: Order ${order.orderNumber}`;
  const html = createOrderProcessingEmail(order, customerName);
  
  const customerEmail = order.customerEmail;
  if (!customerEmail) {
    console.warn('No customer email for order processing notification');
    return null;
  }
  
  return await sendEmail(customerEmail, subject, html);
};

export const sendOrderShippedEmail = async (order, customerName, trackingNumber = null, estimatedDelivery = null) => {
  const subject = `Dispatched: Order ${order.orderNumber} is in Transit`;
  const html = createOrderShippedEmail(order, customerName, trackingNumber, estimatedDelivery);
  
  const customerEmail = order.customerEmail;
  if (!customerEmail) {
    console.warn('No customer email for shipping notification');
    return null;
  }
  
  return await sendEmail(customerEmail, subject, html);
};

export const sendAdminOrderNotification = async (order, items, customerName) => {
  const subject = `Internal Alert: New Order Reference ${order.orderNumber}`;
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
    <p>This is a notification regarding a status update for your order <strong>#${order.orderNumber}</strong>.</p>
    
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 32px; text-align: center; margin: 32px 0;">
        <div style="font-size: 12px; color: #64748B; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">Current Order Status</div>
        <div style="display: inline-block;">
             <span style="font-size: 20px; font-weight: 700; color: ${statusMap[newStatus]?.color || BRAND_DARK}; text-transform: uppercase;">
                ${statusMap[newStatus]?.text || newStatus}
            </span>
        </div>
    </div>
    
    <div class="section">
        <span class="section-title">Acquisition Summary</span>
        <div class="item-row">
            <div style="color: #64748B;">Total Value</div>
            <div style="font-weight: 700; color: ${BRAND_DARK};">KES ${order.totalAmount.toLocaleString()}</div>
        </div>
        <div class="item-row">
            <div style="color: #64748B;">Logistics Status</div>
            <div style="font-weight: 600; color: ${BRAND_DARK};">${newStatus === 'SHIPPED' ? 'In Transit to Destination' : 'Processing at Warehouse'}</div>
        </div>
    </div>
    
    <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order.id}" class="button">Access Full Details</a>
    </div>
  `;

  const html = wrapWithLayout('Logistics Status Update', content);

  const subject = `Status Update: ${order.orderNumber} is now ${statusMap[newStatus]?.text || newStatus}`;
  
  const customerEmail = order.customerEmail;
  if (!customerEmail) {
    console.warn('No customer email for status update');
    return null;
  }
  
  return await sendEmail(customerEmail, subject, html);
};

export const sendPaymentSuccessEmail = async (paymentIntent, order, customer) => {
  const subject = `Payment Confirmed: Transaction ID ${paymentIntent.id}`;
  const html = createPaymentSuccessEmail(paymentIntent, order, customer);
  
  const customerEmail = customer?.email;
  if (!customerEmail) {
    console.warn('No customer email for payment success notification');
    return null;
  }
  
  return await sendEmail(customerEmail, subject, html);
};

export const sendPaymentFailedEmail = async (paymentIntent, customer, failureReason) => {
  const subject = `Alert: Payment Unsuccessful - Hera Collection`;
  const html = createPaymentFailedEmail(paymentIntent, customer, failureReason);
  
  const customerEmail = customer?.email;
  if (!customerEmail) {
    console.warn('No customer email for payment failure notification');
    return null;
  }
  
  return await sendEmail(customerEmail, subject, html);
};

export const sendLowStockAlertEmail = async (product, currentStock, threshold) => {
  const subject = `Operational Alert: Low Stock Threshold Reached - ${product.title}`;
  
  const content = `
    <div style="background-color: #FEF2F2; border: 1px solid #FEE2E2; color: #991B1B; padding: 16px; border-radius: 4px; text-align: center; margin-bottom: 32px; font-weight: 700; font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase;">
        Administrative Warning: Inventory Threshold
    </div>
    
    <p>The following item has reached its defined minimum stock level and requires immediate restocking attention.</p>
    
    <div class="section">
        <span class="section-title">Inventory Information</span>
        <div class="item-row">
            <div style="color: #64748B;">Item Description</div>
            <div style="font-weight: 700; color: ${BRAND_DARK};">${product.title}</div>
        </div>
        <div class="item-row">
            <div style="color: #64748B;">Available Units</div>
            <div style="font-weight: 800; color: #991B1B; font-size: 20px;">${currentStock}</div>
        </div>
        <div class="item-row">
            <div style="color: #64748B;">Critical Threshold</div>
            <div style="font-weight: 600; color: ${BRAND_DARK};">${threshold}</div>
        </div>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.ADMIN_URL || 'http://localhost:3000/admin'}/products/${product.id}" class="button" style="background-color: ${BRAND_DARK}; margin-right: 12px;">Review Item</a>
        <a href="${process.env.ADMIN_URL || 'http://localhost:3000/admin'}/inventory" class="button">Inventory Management</a>
    </div>
    
    <p style="font-size: 11px; color: #94A3B8; text-align: center;">This is an automated operational alert from the Hera Collection administrative system.</p>
  `;

  const html = wrapWithLayout('Inventory Warning', content);

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
        <p>Dear <strong>${userName || 'Client'}</strong>,</p>
        <p>Thank you for integrating your Google account with Hera Collection. Your profile is now active and ready for immediate use.</p>
    </div>
    
    <div class="section">
        <span class="section-title">Instant Access Enabled</span>
        <p style="font-size: 14px; color: #334155;">Discover our collection of premium bags and accessories. Your Google integration provides secured access to all membership features and streamlined acquisition processes.</p>
    </div>
    
    <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">Access Member Dashboard</a>
    </div>
    
    <p style="text-align: center; color: #64748B; font-size: 13px;">Should you have any inquiries regarding your account, our client service team is available for assistance.</p>
  `;

  return wrapWithLayout('Account Activation', content);
};

export const sendGoogleWelcomeEmail = async (userEmail, userName) => {
  const subject = 'Welcome to Hera Collection - Account Activated';
  const html = createGoogleWelcomeEmailTemplate(userName);
  
  return await sendEmail(userEmail, subject, html);
};

const createPasswordResetEmailTemplate = (userName, resetLink) => {
  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <p>Dear <strong>${userName || 'Client'}</strong>,</p>
      <p>We received an administrative request to reset the password associated with your Hera Collection account.</p>
    </div>
    
    <div class="section">
        <span class="section-title">Security Authorization</span>
        <p style="font-size: 14px; color: #334155;">To establish a new secured password, please utilize the authorization link provided below. This link is valid for 60 minutes.</p>
        
        <div style="text-align: center;">
            <a href="${resetLink}" class="button" style="margin: 20px 0;">Reset Password</a>
        </div>
        
        <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #E2E8F0;">
            <p style="font-size: 11px; color: #94A3B8; margin-bottom: 8px;">If the button is not responsive, please utilize the direct URL below:</p>
            <div style="background-color: #F8FAFC; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 10px; word-break: break-all; color: #64748B; border: 1px solid #E2E8F0;">
                ${resetLink}
            </div>
        </div>
    </div>
    
    <div class="section" style="background-color: #F8FAFC;">
        <span class="section-title">Security Protocol</span>
        <ul style="color: #64748B; font-size: 13px; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 6px;">Ensure the new password contains at least 8 characters including alphanumeric symbols.</li>
            <li style="margin-bottom: 6px;">Avoid recycling previous passwords for enhanced security.</li>
            <li>If you did not authorize this request, please contact our security team immediately.</li>
        </ul>
    </div>
  `;

  return wrapWithLayout('Security Update: Password Reset', content);
};

export const sendPasswordResetEmail = async (userEmail, userName, resetToken) => {
  const resetLink = `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/reset-password/${resetToken}`;
  const subject = 'Security Verification: Password Reset Request';
  const html = createPasswordResetEmailTemplate(userName, resetLink);
  
  return await sendEmail(userEmail, subject, html);
};

export const sendPasswordChangedEmail = async (userEmail, userName) => {
  const subject = 'Security Notification: Password Updated';
  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <p>Dear <strong>${userName || 'Client'}</strong>,</p>
      <p>Your Hera Collection account password was successfully updated on ${new Date().toLocaleString()}.</p>
    </div>
    
    <div class="section">
        <span class="section-title">Compliance Information</span>
        <ul style="color: #64748B; font-size: 13px; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 12px;">As a security precaution, all existing active sessions have been terminated.</li>
            <li style="margin-bottom: 12px;">A new login is required on all authorized devices using the updated credentials.</li>
            <li>If you did not initiate this change, please restrict your account immediately and contact our security team.</li>
        </ul>
    </div>
    
    <p style="text-align: center; color: #64748B; font-size: 12px; margin-top: 32px;">
        Thank you for maintaining the security of your account.
    </p>
  `;

  const html = wrapWithLayout('Password Change Confirmation', content);
  
  return await sendEmail(userEmail, subject, html);
};

const createContactEmailTemplate = (name, email, subject, message) => {
  const content = `
    <div style="background-color: ${BRAND_DARK}; color: white; padding: 24px; border-radius: 4px; border-bottom: 4px solid ${BRAND_PRIMARY}; margin-bottom: 32px; text-align: center; font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: 0.1em;">
        Internal Notification: Client Inquiry
    </div>
    
    <div class="section">
        <span class="section-title">Client Information</span>
        <table style="width: 100%; font-size: 14px;">
            <tr>
                <td style="padding: 4px 0; color: #64748B;">Client Name:</td>
                <td style="padding: 4px 0; font-weight: 600;">${name}</td>
            </tr>
            <tr>
                <td style="padding: 4px 0; color: #64748B;">Official Email:</td>
                <td style="padding: 4px 0; font-weight: 600;">${email}</td>
            </tr>
        </table>
    </div>
    
    <div class="section">
        <span class="section-title">Inquiry Details</span>
        <div style="margin-bottom: 16px;">
            <div style="font-size: 11px; color: #64748B; text-transform: uppercase; margin-bottom: 4px; font-weight: 700;">Subject Reference</div>
            <div style="font-weight: 700; color: ${BRAND_DARK};">${subject}</div>
        </div>
        <div>
            <div style="font-size: 11px; color: #64748B; text-transform: uppercase; margin-bottom: 8px; font-weight: 700;">Message Statement</div>
            <div style="background-color: #ffffff; padding: 20px; border: 1px solid #E2E8F0; border-radius: 4px; line-height: 1.8; color: #334155; font-size: 14px;">
                ${message}
            </div>
        </div>
    </div>
    
    <div style="text-align: center;">
        <a href="mailto:${email}?subject=Re: ${subject}" class="button" style="background-color: ${BRAND_DARK};">Reply to Client</a>
    </div>
  `;

  return wrapWithLayout('Internal Inquiry Alert', content);
};

export const sendContactEmail = async (contactData) => {
  const { name, email, subject, message } = contactData;
  const html = createContactEmailTemplate(name, email, subject, message);
  const adminEmail = process.env.ADMIN_EMAIL || config.email.user;
  
  return await sendEmail(adminEmail, `Hera Inquiry: ${subject}`, html);
};
