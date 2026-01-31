
import { wrapWithLayout } from './emailLayout.js';

const BRAND_PRIMARY = '#7C3AED';

export const createPaymentSuccessEmail = (paymentIntent, order, customer) => {
  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 64px; margin-bottom: 24px; color: #15803d;">✓</div>
      <p>Dear ${customer.name || 'Customer'},</p>
      <p>Your payment has been successfully processed! Your transaction is secured and confirmed.</p>
    </div>
    
    <div class="section">
        <span class="section-title">Payment Details</span>
        <div class="item-row">
            <div style="color: #6b7280;">Amount Paid</div>
            <div style="font-weight: 700;">KES ${paymentIntent.amount.toLocaleString()}</div>
        </div>
        <div class="item-row">
            <div style="color: #6b7280;">Payment Method</div>
            <div style="font-weight: 600;">M-Pesa</div>
        </div>
        <div class="item-row">
            <div style="color: #6b7280;">Phone Number</div>
            <div style="font-weight: 600;">${paymentIntent.phone}</div>
        </div>
        <div class="item-row">
            <div style="color: #6b7280;">Date</div>
            <div style="font-weight: 600;">${new Date(paymentIntent.updatedAt).toLocaleString()}</div>
        </div>
        <div class="item-row" style="border-bottom: none;">
            <div style="color: #6b7280;">Transaction ID</div>
            <div style="font-family: monospace; font-size: 12px;">${paymentIntent.id}</div>
        </div>
    </div>
    
    ${order ? `
    <div class="section" style="border-left: 4px solid ${BRAND_PRIMARY}; background: #f5f3ff;">
        <span class="section-title">Order Information</span>
        <div class="item-row">
            <div style="color: #6b7280;">Order Number</div>
            <div style="font-weight: 700;">#${order.orderNumber}</div>
        </div>
        <div class="item-row">
            <div style="color: #6b7280;">Status</div>
            <div class="status-badge badge-success">${order.status}</div>
        </div>
    </div>
    <p style="text-align: center; color: #6b7280; font-style: italic;">Your order is now being processed. You'll receive another update shortly.</p>
    ` : `
    <p style="text-align: center; color: #6b7280; font-style: italic;">Your order confirmation will follow shortly.</p>
    `}
    
    <div style="text-align: center; margin-top: 32px;">
        <p style="font-weight: 700; color: ${BRAND_PRIMARY};">Thank you for choosing Hera Collections.</p>
    </div>
  `;

  return wrapWithLayout('Payment Successful', content);
};

export const createPaymentFailedEmail = (paymentIntent, customer, failureReason) => {
  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 64px; margin-bottom: 24px; color: #b91c1c;">✗</div>
      <p>Dear ${customer.name || 'Customer'},</p>
      <p>We were unable to process your payment. Don't worry, your items are still reserved in your cart.</p>
    </div>
    
    <div class="section">
        <span class="section-title">Failed Transaction Details</span>
        <div class="item-row">
            <div style="color: #6b7280;">Amount</div>
            <div style="font-weight: 700;">KES ${paymentIntent.amount.toLocaleString()}</div>
        </div>
        <div class="item-row">
            <div style="color: #6b7280;">Reason for Failure</div>
            <div style="color: #b91c1c; font-weight: 600;">${failureReason || 'Transaction declined or timed out'}</div>
        </div>
        <div class="item-row">
            <div style="color: #6b7280;">Phone Number</div>
            <div style="font-weight: 600;">${paymentIntent.phone}</div>
        </div>
    </div>
    
    <div class="section" style="background: #fffbeb; border: 1px solid #fef3c7;">
        <span class="section-title" style="color: #b45309;">How to fix this</span>
        <ul style="color: #92400e; padding-left: 20px; margin: 0;">
            <li style="margin-bottom: 8px;">Ensure you have sufficient balance in your M-Pesa account</li>
            <li style="margin-bottom: 8px;">Check that your phone is on and has network reception</li>
            <li style="margin-bottom: 8px;">Verify your M-Pesa PIN was entered correctly</li>
        </ul>
    </div>
    
    <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout?retry=${paymentIntent.id}" class="button">Retry Payment Now</a>
    </div>
    
    <p style="text-align: center; font-size: 13px; color: #6b7280; margin-top: 24px;">If you continue to face issues, please reply to this email or contact support.</p>
  `;

  return wrapWithLayout('Payment Failed', content);
};