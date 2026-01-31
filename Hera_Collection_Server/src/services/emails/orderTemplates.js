import { wrapWithLayout } from './emailLayout.js';

const BRAND_PRIMARY = '#7C3AED';

export const createOrderConfirmationEmail = (order, customerName, orderItems) => {
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const content = `
    <p>Dear ${customerName},</p>
    <p>Your order has been successfully placed and is being processed. Thank you for choosing Hera Collection!</p>
    
    <div style="background: linear-gradient(135deg, ${BRAND_PRIMARY} 0%, #A855F7 100%); color: white; padding: 32px; border-radius: 20px; text-align: center; margin: 32px 0;">
        <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.9; margin-bottom: 8px;">Order Number</div>
        <div style="font-size: 32px; font-weight: 800; letter-spacing: -0.025em;">#${order.orderNumber}</div>
        <div style="margin-top: 16px;">
            <span class="status-badge badge-info">${order.status}</span>
        </div>
    </div>
    
    <div class="section">
        <span class="section-title">Order Summary</span>
        ${orderItems.map(item => `
        <div class="item-row">
            <div>
                <div style="font-weight: 600;">${item.title}</div>
                ${item.variantName ? `<div style="font-size: 12px; color: #6b7280; margin-top: 2px;">${item.variantName}: ${item.variantValue}</div>` : ''}
                <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">Qty: ${item.quantity} × KES ${item.price.toLocaleString()}</div>
            </div>
            <div style="font-weight: 600;">KES ${(item.quantity * item.price).toLocaleString()}</div>
        </div>
        `).join('')}
        
        <div class="item-row" style="margin-top: 16px; border-top: 2px solid #e5e7eb; padding-top: 16px;">
            <div style="font-weight: 600;">Subtotal</div>
            <div style="font-weight: 600;">KES ${order.subtotalAmount.toLocaleString()}</div>
        </div>
        <div class="item-row">
            <div style="color: #6b7280;">Shipping</div>
            <div style="color: #6b7280;">FREE</div>
        </div>
        <div class="item-row total-row">
            <div>Grand Total</div>
            <div>KES ${order.totalAmount.toLocaleString()}</div>
        </div>
    </div>
    
    <div class="section">
        <span class="section-title">Shipping Information</span>
        <div style="font-weight: 600; margin-bottom: 8px;">${order.customerFirstName} ${order.customerLastName}</div>
        <div style="color: #4b5563;">
            ${order.shippingAddress ? `${order.shippingAddress}<br>` : ''}
            ${order.shippingCity ? `${order.shippingCity}<br>` : ''}
            ${order.phone ? `Phone: ${order.phone}` : ''}
        </div>
    </div>

    <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order.id}" class="button">View Order Details</a>
    </div>
  `;

  return wrapWithLayout('Order Confirmed', content);
};

export const createOrderProcessingEmail = (order, customerName) => {
  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 64px; margin-bottom: 24px;">⚙️</div>
      <p>Dear ${customerName},</p>
      <p>We are currently processing your order <strong>#${order.orderNumber}</strong>. Our team is carefully preparing your items for shipment.</p>
    </div>
    
    <div class="section" style="text-align: center;">
        <span class="section-title">Estimated Timeline</span>
        <div style="font-size: 24px; font-weight: 800; color: ${BRAND_PRIMARY}; margin-bottom: 8px;">1-2 Business Days</div>
        <p style="color: #6b7280; font-size: 14px; margin: 0;">You will receive another notification as soon as your order ships.</p>
    </div>
    
    <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order.id}" class="button">Track Order Status</a>
    </div>
  `;

  return wrapWithLayout('Your Order is Being Processed', content);
};

export const createOrderShippedEmail = (order, customerName, trackingNumber = null, estimatedDelivery = null) => {
  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 64px; margin-bottom: 24px;">🚚</div>
      <p>Dear ${customerName},</p>
      <p>Great news! Your order <strong>#${order.orderNumber}</strong> is on its way to you.</p>
    </div>
    
    <div class="section">
        <span class="section-title">Delivery Details</span>
        ${trackingNumber ? `
            <p style="margin-bottom: 8px;"><strong>Tracking Number:</strong></p>
            <div style="background: white; padding: 16px; border: 1px dashed #d1d5db; display: inline-block; font-family: 'Courier New', monospace; font-size: 20px; font-weight: 700; border-radius: 12px; margin-bottom: 16px;">${trackingNumber}</div>
            <br>
            <a href="${process.env.CARRIER_TRACKING_URL || '#'}/${trackingNumber}" class="button" style="margin: 0;">Track Package Now</a>
        ` : `
            <p style="margin: 0; font-weight: 600;">Your package is in transit via our courier partner.</p>
        `}
        
        ${estimatedDelivery ? `
            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <strong>Estimated Delivery:</strong><br>
                <span style="font-size: 18px; color: ${BRAND_PRIMARY}; font-weight: 700;">${new Date(estimatedDelivery).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
        ` : ''}
    </div>
    
    <div class="section">
        <span class="section-title">Shipping To</span>
        <div style="font-weight: 600;">${order.customerFirstName} ${order.customerLastName}</div>
        <div style="color: #4b5563;">
            ${order.shippingAddress}<br>
            ${order.shippingCity}
        </div>
    </div>
  `;

  return wrapWithLayout('Your Order Has Shipped!', content);
};

export const createAdminOrderNotification = (order, items, customerName) => {
  const content = `
    <div style="background: #FFFBEB; border: 1px solid #FEF3C7; color: #92400E; padding: 16px; border-radius: 12px; text-align: center; margin-bottom: 32px; font-weight: 700;">
        📦 NEW ORDER TO FULFILL
    </div>
    
    <div class="section">
        <span class="section-title">Customer Details</span>
        <div style="display: grid; gap: 8px;">
            <div><strong>Name:</strong> ${customerName}</div>
            <div><strong>Total Amount:</strong> KES ${order.totalAmount.toLocaleString()}</div>
            <div><strong>Payment Method:</strong> ${order.paymentMethod || 'M-Pesa'}</div>
            <div><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</div>
        </div>
    </div>
    
    <span class="section-title">Order Items</span>
    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                    <th style="padding: 16px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280;">Product</th>
                    <th style="padding: 16px; text-align: center; font-size: 12px; text-transform: uppercase; color: #6b7280;">Qty</th>
                    <th style="padding: 16px; text-align: right; font-size: 12px; text-transform: uppercase; color: #6b7280;">Price</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                <tr style="border-bottom: 1px solid #f3f4f6;">
                    <td style="padding: 16px;">
                        <div style="font-weight: 600;">${item.product.title}</div>
                        ${item.variant ? `<div style="font-size: 11px; color: #9ca3af; margin-top: 4px;">SKU: ${item.variant.sku}</div>` : ''}
                    </td>
                    <td style="padding: 16px; text-align: center; font-weight: 600;">${item.quantity}</td>
                    <td style="padding: 16px; text-align: right; font-weight: 600;">KES ${item.price.toLocaleString()}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    
    <div style="text-align: center; margin-top: 32px;">
        <a href="${process.env.ADMIN_URL || 'http://localhost:3000/admin'}/orders/${order.id}" class="button" style="background: #111827;">Open Admin Panel</a>
    </div>
  `;

  return wrapWithLayout('New Order Received', content);
};
