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
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            padding: 20px 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px 10px 0 0;
            color: white;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .content {
            padding: 30px;
        }
        .verification-code {
            display: inline-block;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            font-size: 32px;
            font-weight: bold;
            padding: 15px 30px;
            border-radius: 8px;
            letter-spacing: 5px;
            margin: 20px 0;
            text-align: center;
        }
        .instructions {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #eee;
            margin-top: 30px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }
        .note {
            color: #666;
            font-size: 12px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Hera Collections</div>
            <h1>Verify Your Email</h1>
        </div>
        <div class="content">
            <p>Hello ${userName || 'User'},</p>
            <p>Thank you for signing up! To complete your registration and start using your account, please verify your email address.</p>
            
            <div style="text-align: center;">
                <div class="verification-code">${verificationCode}</div>
            </div>
            
            <p>Enter this 6-digit verification code on the verification page to activate your account.</p>
            
            <div class="instructions">
                <p><strong>How to verify:</strong></p>
                <ol>
                    <li>Copy the 6-digit code above</li>
                    <li>Return to the verification page</li>
                    <li>Enter the code in the verification field</li>
                    <li>Click "Verify Email"</li>
                </ol>
            </div>
            
            <p>If you didn't create an account with us, please ignore this email.</p>
            
            <p class="note">
                <strong>Note:</strong> This verification code will expire in 24 hours for security reasons.
            </p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Hera Collections. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
        </div>
    </div>
</body>
</html>
  `;
};

// Welcome email template (after verification)
const createWelcomeEmailTemplate = (userName) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Hera Collections</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            padding: 20px 0;
            background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
            border-radius: 10px 10px 0 0;
            color: white;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .content {
            padding: 30px;
        }
        .welcome-icon {
            font-size: 60px;
            text-align: center;
            color: #4CAF50;
            margin: 20px 0;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .feature {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
        }
        .feature-icon {
            font-size: 24px;
            margin-bottom: 10px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #eee;
            margin-top: 30px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Hera Collections</div>
            <h1>Welcome to Our Community!</h1>
        </div>
        <div class="content">
            <div class="welcome-icon">🎉</div>
            
            <p>Hello <strong>${userName || 'there'}</strong>,</p>
            
            <p>Congratulations! Your email has been successfully verified and your account is now fully activated.</p>
            
            <p>You now have access to all features of Hera Collections:</p>
            
            <div class="features">
                <div class="feature">
                    <div class="feature-icon">🛒</div>
                    <h3>Shop Products</h3>
                    <p>Browse and purchase from our wide selection</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">📱</div>
                    <h3>Manage Orders</h3>
                    <p>Track and manage your purchases</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">💬</div>
                    <h3>Connect</h3>
                    <p>Message sellers and get support</p>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">
                    Go to Dashboard
                </a>
            </div>
            
            <p>If you have any questions or need assistance, feel free to reply to this email or contact our support team.</p>
            
            <p>Happy shopping!</p>
            <p><strong>The Hera Collections Team</strong></p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Hera Collections. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
        </div>
    </div>
</body>
</html>
  `;
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
  const statusMap = {
    'PENDING': { color: '#ff9800', text: 'Pending' },
    'PAID': { color: '#4CAF50', text: 'Paid' },
    'PROCESSING': { color: '#2196F3', text: 'Processing' },
    'SHIPPED': { color: '#9C27B0', text: 'Shipped' },
    'DELIVERED': { color: '#607D8B', text: 'Delivered' },
    'CANCELLED': { color: '#f44336', text: 'Cancelled' },
    'FULFILLED': { color: '#4CAF50', text: 'Fulfilled' }
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Status Updated - Hera Collections</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .status-change { 
            background: #f5f5f5; 
            padding: 15px; 
            border-radius: 5px; 
            margin: 20px 0; 
            text-align: center;
        }
        .old-status { color: #666; text-decoration: line-through; }
        .new-status { 
            font-size: 20px; 
            font-weight: bold; 
            color: ${statusMap[newStatus]?.color || '#333'};
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Order Status Updated</h2>
        <p>Dear ${customerName},</p>
        
        <p>The status of your order <strong>${order.orderNumber}</strong> has been updated:</p>
        
        <div class="status-change">
            <span class="old-status">${statusMap[oldStatus]?.text || oldStatus}</span>
            &nbsp;→&nbsp;
            <span class="new-status">${statusMap[newStatus]?.text || newStatus}</span>
        </div>
        
        <p>Order Total: KES ${order.totalAmount.toFixed(2)}</p>
        
        <p>You can view your order details by logging into your account.</p>
        
        <p>Thank you for shopping with Hera Collections!</p>
    </div>
</body>
</html>
  `;

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
  
  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Low Stock Alert - ${product.title}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            padding: 20px 0;
            background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%);
            border-radius: 10px 10px 0 0;
            color: white;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .content {
            padding: 30px;
        }
        .alert-icon {
            text-align: center;
            font-size: 60px;
            margin: 20px 0;
            color: #ff9800;
        }
        .stock-info {
            background-color: #fff3e0;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #ff9800;
        }
        .stock-level {
            font-size: 24px;
            font-weight: bold;
            color: #ff5722;
            text-align: center;
            margin: 10px 0;
        }
        .action-buttons {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            border-radius: 5px;
            text-decoration: none;
            font-weight: bold;
            text-align: center;
            min-width: 150px;
        }
        .button-primary {
            background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
            color: white;
        }
        .button-secondary {
            background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
            color: white;
        }
        .product-details {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #eee;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Hera Collections</div>
            <h1>⚠️ Low Stock Alert</h1>
        </div>
        
        <div class="content">
            <div class="alert-icon">📦</div>
            
            <p>A product in your inventory is running low on stock and requires attention.</p>
            
            <div class="stock-info">
                <h3>Product: ${product.title}</h3>
                <p><strong>SKU:</strong> ${product.sku || 'N/A'}</p>
                <p><strong>Category:</strong> ${product.category?.name || 'Uncategorized'}</p>
                <p><strong>Alert Threshold:</strong> ${threshold} units</p>
                
                <div class="stock-level">
                    Current Stock: ${currentStock} units
                </div>
                
                <p style="text-align: center; color: #ff5722; font-weight: bold;">
                    ⚠️ ${currentStock} units remaining (Below threshold of ${threshold})
                </p>
            </div>
            
            <div class="product-details">
                <h4>Product Information</h4>
                <p><strong>Current Stock Level:</strong> ${currentStock} units</p>
                <p><strong>Alert Threshold:</strong> ${threshold} units</p>
                <p><strong>Remaining Buffer:</strong> ${currentStock} units</p>
                <p><strong>Status:</strong> ${currentStock <= 0 ? 'OUT OF STOCK' : 'LOW STOCK'}</p>
            </div>
            
            <h3>Recommended Actions:</h3>
            <ol>
                <li>Review sales trends for this product</li>
                <li>Consider placing a restock order</li>
                <li>Update product status if necessary</li>
                <li>Adjust pricing if stock is critically low</li>
            </ol>
            
            <div class="action-buttons">
                <a href="${process.env.ADMIN_URL || 'http://localhost:3000/admin'}/products/${product.id}" 
                   class="button button-primary">
                    View Product
                </a>
                <a href="${process.env.ADMIN_URL || 'http://localhost:3000/admin'}/stock/add/${product.id}" 
                   class="button button-secondary">
                    Add Stock
                </a>
            </div>
            
            <p>This is an automated alert. Please take appropriate action to avoid stockouts.</p>
            
            <p><strong>Inventory Management System</strong><br>
            Hera Collections</p>
        </div>
        
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Hera Collections. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
        </div>
    </div>
</body>
</html>
  `;

  const adminEmail = process.env.ADMIN_EMAIL || config.email.user;
  if (!adminEmail) {
    console.warn('No admin email configured for stock alerts');
    return null;
  }
  const inventoryEmail = process.env.INVENTORY_EMAIL || adminEmail;
  
  return await sendEmail([adminEmail, inventoryEmail], subject, html);
};


const createGoogleWelcomeEmailTemplate = (userName) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Hera Collections</title>
    <style>
        /* ... existing styles ... */
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Hera Collections</div>
            <h1>Welcome to Our Community!</h1>
        </div>
        <div class="content">
            <div class="welcome-icon">🎉</div>
            
            <p>Hello <strong>${userName || 'there'}</strong>,</p>
            
            <p>Thank you for joining Hera Collections with your Google account!</p>
            
            <div class="features">
                <!-- Same features as regular welcome email -->
            </div>
            
            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">
                    Go to Dashboard
                </a>
            </div>
            
            <p><strong>Note:</strong> Your Google email is already verified, so you have full access to all features.</p>
            
            <p>If you have any questions or need assistance, feel free to reply to this email.</p>
            
            <p>Happy shopping!</p>
            <p><strong>The Hera Collections Team</strong></p>
        </div>
    </div>
</body>
</html>
  `;
};

export const sendGoogleWelcomeEmail = async (userEmail, userName) => {
  const subject = 'Welcome to Hera Collection! (Google Signup)';
  const html = createGoogleWelcomeEmailTemplate(userName);
  
  return await sendEmail(userEmail, subject, html);
};
const createPasswordResetEmailTemplate = (userName, resetLink) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - Hera Collection</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            padding: 20px 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px 10px 0 0;
            color: white;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .content {
            padding: 30px;
        }
        .reset-icon {
            text-align: center;
            font-size: 60px;
            margin: 20px 0;
            color: #667eea;
        }
        .button {
            display: block;
            width: 200px;
            margin: 30px auto;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 14px 30px;
            border-radius: 5px;
            font-weight: bold;
            text-align: center;
        }
        .instructions {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #eee;
            margin-top: 30px;
        }
        .note {
            color: #666;
            font-size: 12px;
            margin-top: 20px;
            text-align: center;
        }
        .reset-link {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            word-break: break-all;
            font-family: monospace;
            font-size: 12px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Hera Collection</div>
            <h1>Password Reset Request</h1>
        </div>
        
        <div class="content">
            <div class="reset-icon">🔐</div>
            
            <p>Hello <strong>${userName || 'User'}</strong>,</p>
            
            <p>We received a request to reset the password for your Hera Collection account.</p>
            
            <div class="instructions">
                <p><strong>To reset your password:</strong></p>
                <ol>
                    <li>Click the button below</li>
                    <li>Create a new secure password</li>
                    <li>Confirm your new password</li>
                </ol>
            </div>
            
            <div style="text-align: center;">
                <a href="${resetLink}" class="button">
                    Reset Password
                </a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <div class="reset-link">
                ${resetLink}
            </div>
            
            <div class="instructions">
                <p><strong>Security Tips:</strong></p>
                <ul>
                    <li>This link will expire in 1 hour</li>
                    <li>Use a strong password with at least 8 characters</li>
                    <li>Include uppercase, lowercase, numbers, and symbols</li>
                    <li>Don't reuse passwords from other sites</li>
                </ul>
            </div>
            
            <p>If you didn't request this password reset, please ignore this email or contact support if you're concerned.</p>
            
            <p class="note">
                <strong>Note:</strong> For security reasons, all your existing sessions will be logged out after password reset.
            </p>
        </div>
        
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Hera Collection. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
        </div>
    </div>
</body>
</html>
  `;
};

export const sendPasswordResetEmail = async (userEmail, userName, resetToken) => {
  const resetLink = `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/reset-password/${resetToken}`;
  const subject = 'Reset Your Password - Hera Collection';
  const html = createPasswordResetEmailTemplate(userName, resetLink);
  
  return await sendEmail(userEmail, subject, html);
};

export const sendPasswordChangedEmail = async (userEmail, userName) => {
  const subject = 'Password Changed - Hera Collection';
  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Changed - Hera Collection</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            padding: 20px 0;
            background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
            border-radius: 10px 10px 0 0;
            color: white;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .content {
            padding: 30px;
        }
        .success-icon {
            text-align: center;
            font-size: 60px;
            margin: 20px 0;
            color: #4CAF50;
        }
        .security-info {
            background-color: #e8f5e9;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #4CAF50;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #eee;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Hera Collection</div>
            <h1>Password Changed Successfully</h1>
        </div>
        
        <div class="content">
            <div class="success-icon">✅</div>
            
            <p>Hello <strong>${userName || 'User'}</strong>,</p>
            
            <p>Your Hera Collection account password was changed successfully on ${new Date().toLocaleString()}.</p>
            
            <div class="security-info">
                <p><strong>Security Information:</strong></p>
                <ul>
                    <li>All your existing sessions have been logged out</li>
                    <li>You'll need to log in again with your new password</li>
                    <li>If you didn't make this change, please contact support immediately</li>
                </ul>
            </div>
            
            <p>If you made this change, no further action is required.</p>
            
            <p>If you did NOT request this password change, please:</p>
            <ol>
                <li>Contact our support team immediately</li>
                <li>Check your account for any suspicious activity</li>
                <li>Consider enabling two-factor authentication</li>
            </ol>
            
            <p>Thank you for helping us keep your account secure!</p>
            
            <p><strong>The Hera Collection Security Team</strong></p>
        </div>
        
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Hera Collection. All rights reserved.</p>
            <p>This is an automated security email.</p>
        </div>
    </div>
</body>
</html>
  `;
  
  return await sendEmail(userEmail, subject, html);
};