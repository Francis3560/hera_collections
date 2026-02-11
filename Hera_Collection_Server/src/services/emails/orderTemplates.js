import { wrapWithLayout } from './emailLayout.js';

const BRAND_PRIMARY = '#CD7F32';
const BRAND_DARK = '#0F172A';

export const createOrderConfirmationEmail = (order, customerName, orderItems) => {
  const content = `
    <p>Dear ${customerName},</p>
    <p>Your order has been successfully placed and is currently being processed. We appreciate your preference for Hera Collection.</p>
    
    <div style="background-color: ${BRAND_DARK}; color: white; padding: 32px; border-radius: 8px; text-align: center; margin: 32px 0; border-bottom: 4px solid ${BRAND_PRIMARY};">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.7; margin-bottom: 8px;">Order Reference</div>
        <div style="font-size: 28px; font-weight: 700; letter-spacing: -0.01em;">#${order.orderNumber}</div>
        <div style="margin-top: 16px;">
            <span class="status-badge badge-info">${order.status}</span>
        </div>
    </div>
    
    <div class="section">
        <span class="section-title">Order Summary</span>
        ${orderItems.map(item => `
        <div class="item-row">
            <div>
                <div style="font-weight: 600; color: ${BRAND_DARK};">${item.title}</div>
                ${item.variantName ? `<div style="font-size: 12px; color: #64748B; margin-top: 2px;">${item.variantName}: ${item.variantValue}</div>` : ''}
                <div style="font-size: 12px; color: #64748B; margin-top: 2px;">Quantity: ${item.quantity} × KES ${item.price.toLocaleString()}</div>
            </div>
            <div style="font-weight: 600; color: ${BRAND_DARK};">KES ${(item.quantity * item.price).toLocaleString()}</div>
        </div>
        `).join('')}
        
        <div class="item-row" style="margin-top: 16px; border-top: 1px solid #E2E8F0; padding-top: 16px;">
            <div style="font-weight: 600;">Subtotal</div>
            <div style="font-weight: 600;">KES ${order.subtotalAmount.toLocaleString()}</div>
        </div>
        <div class="item-row">
            <div style="color: #64748B;">Shipping</div>
            <div style="color: #64748B;">${order.shippingCost > 0 ? `KES ${order.shippingCost.toLocaleString()}` : 'Complimentary'}</div>
        </div>
        <div class="item-row total-row">
            <div>Total Amount</div>
            <div>KES ${order.totalAmount.toLocaleString()}</div>
        </div>
    </div>
    
    <div class="section">
        <span class="section-title">Shipping Details</span>
        <div style="font-weight: 600; margin-bottom: 8px; color: ${BRAND_DARK};">${order.customerFirstName} ${order.customerLastName}</div>
        <div style="color: #334155; font-size: 14px;">
            ${order.shippingAddress ? `${order.shippingAddress}<br>` : ''}
            ${order.shippingCity ? `${order.shippingCity}<br>` : ''}
            ${order.phone ? `Contact: ${order.phone}` : ''}
        </div>
    </div>

    <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order.id}" class="button">Access Order Details</a>
    </div>
  `;

  return wrapWithLayout('Order Confirmation', content);
};

export const createOrderProcessingEmail = (order, customerName) => {
  const content = `
    <p>Dear ${customerName},</p>
    <p>Our fulfillment team is currently preparing your order <strong>#${order.orderNumber}</strong>. We ensure each item meets our quality standards before dispatch.</p>
    
    <div class="section" style="text-align: center;">
        <span class="section-title">Fulfillment Status</span>
        <div style="font-size: 20px; font-weight: 700; color: ${BRAND_PRIMARY}; margin-bottom: 8px;">Order in Preparation</div>
        <p style="color: #64748B; font-size: 14px; margin: 0;">Estimated processing time: 1-2 business days. You will receive a notification once your items have been dispatched.</p>
    </div>
    
    <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order.id}" class="button">Track Progress</a>
    </div>
  `;

  return wrapWithLayout('Order Processing Notification', content);
};

export const createOrderShippedEmail = (order, customerName, trackingNumber = null, estimatedDelivery = null) => {
  const content = `
    <p>Dear ${customerName},</p>
    <p>We are pleased to inform you that your order <strong>#${order.orderNumber}</strong> has been dispatched and is currently in transit.</p>
    
    <div class="section">
        <span class="section-title">Logistics Information</span>
        ${trackingNumber ? `
            <p style="margin-bottom: 8px; font-size: 14px;"><strong>Waybill / Tracking Number:</strong></p>
            <div style="background-color: #ffffff; padding: 16px; border: 1px solid #E2E8F0; display: inline-block; font-family: monospace; font-size: 18px; font-weight: 700; border-radius: 4px; margin-bottom: 16px; color: ${BRAND_DARK};">
                ${trackingNumber}
            </div>
            <br>
            <a href="${process.env.CARRIER_TRACKING_URL || '#'}/${trackingNumber}" class="button" style="margin: 0;">Track Shipment</a>
        ` : `
            <p style="margin: 0; font-weight: 600; color: ${BRAND_DARK};">Your package is currently in transit via our logistics partner.</p>
        `}
        
        ${estimatedDelivery ? `
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
                <strong style="font-size: 14px;">Estimated Arrival:</strong><br>
                <span style="font-size: 18px; color: ${BRAND_PRIMARY}; font-weight: 700;">${new Date(estimatedDelivery).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
        ` : ''}
    </div>
    
    <div class="section">
        <span class="section-title">Destination</span>
        <div style="font-weight: 600; color: ${BRAND_DARK};">${order.customerFirstName} ${order.customerLastName}</div>
        <div style="color: #334155; font-size: 14px;">
            ${order.shippingAddress}<br>
            ${order.shippingCity}
        </div>
    </div>
  `;

  return wrapWithLayout('Shipment Notification', content);
};

export const createAdminOrderNotification = (order, items, customerName) => {
  const content = `
    <div style="background-color: #FFFBEB; border: 1px solid #FEF3C7; color: #92400E; padding: 16px; border-radius: 4px; text-align: center; margin-bottom: 32px; font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;">
        New Order Fulfillment Required
    </div>
    
    <div class="section">
        <span class="section-title">Customer Information</span>
        <table style="width: 100%; font-size: 14px;">
            <tr>
                <td style="padding: 4px 0; color: #64748B;">Client Name:</td>
                <td style="padding: 4px 0; font-weight: 600;">${customerName}</td>
            </tr>
            <tr>
                <td style="padding: 4px 0; color: #64748B;">Total Value:</td>
                <td style="padding: 4px 0; font-weight: 700; color: ${BRAND_PRIMARY};">KES ${order.totalAmount.toLocaleString()}</td>
            </tr>
            <tr>
                <td style="padding: 4px 0; color: #64748B;">Payment Method:</td>
                <td style="padding: 4px 0; font-weight: 600;">${order.paymentMethod || 'M-Pesa'}</td>
            </tr>
            <tr>
                <td style="padding: 4px 0; color: #64748B;">Order Date:</td>
                <td style="padding: 4px 0; font-weight: 600;">${new Date(order.createdAt).toLocaleString()}</td>
            </tr>
        </table>
    </div>
    
    <span class="section-title">Inventory Dispatch List</span>
    <div style="background-color: #ffffff; border: 1px solid #E2E8F0; border-radius: 4px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
                <tr style="background-color: #F8FAFC; border-bottom: 1px solid #E2E8F0;">
                    <th style="padding: 12px 16px; text-align: left; font-weight: 700; color: #475569; text-transform: uppercase; font-size: 11px;">Product</th>
                    <th style="padding: 12px 16px; text-align: center; font-weight: 700; color: #475569; text-transform: uppercase; font-size: 11px;">Qty</th>
                    <th style="padding: 12px 16px; text-align: right; font-weight: 700; color: #475569; text-transform: uppercase; font-size: 11px;">Unit Price</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                <tr style="border-bottom: 1px solid #F1F5F9;">
                    <td style="padding: 12px 16px;">
                        <div style="font-weight: 600; color: ${BRAND_DARK};">${item.product.title}</div>
                        ${item.variant ? `<div style="font-size: 11px; color: #94A3B8; margin-top: 2px;">SKU: ${item.variant.sku}</div>` : ''}
                    </td>
                    <td style="padding: 12px 16px; text-align: center; font-weight: 600; color: ${BRAND_DARK};">${item.quantity}</td>
                    <td style="padding: 12px 16px; text-align: right; font-weight: 600; color: ${BRAND_DARK};">KES ${item.price.toLocaleString()}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    
    <div style="text-align: center; margin-top: 32px;">
        <a href="${process.env.ADMIN_URL || 'http://localhost:3000/admin'}/orders/${order.id}" class="button" style="background-color: ${BRAND_DARK};">Manage In Administration</a>
    </div>
  `;

  return wrapWithLayout('Internal Order Notification', content);
};

