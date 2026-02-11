import { wrapWithLayout } from './emailLayout.js';

const BRAND_PRIMARY = '#CD7F32';
const BRAND_DARK = '#0F172A';

export const createPaymentSuccessEmail = (paymentIntent, order, customer) => {
  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <p>Dear ${customer.name || 'Client'},</p>
      <p>We are pleased to confirm that your payment has been successfully processed. Your transaction is now finalized.</p>
    </div>
    
    <div class="section">
        <span class="section-title">Logistics & Transaction Details</span>
        <div class="item-row">
            <div style="color: #64748B;">Amount Confirmed</div>
            <div style="font-weight: 700; color: ${BRAND_DARK};">KES ${paymentIntent.amount.toLocaleString()}</div>
        </div>
        <div class="item-row">
            <div style="color: #64748B;">Payment Method</div>
            <div style="font-weight: 600; color: ${BRAND_DARK};">M-Pesa</div>
        </div>
        <div class="item-row">
            <div style="color: #64748B;">Mobile Number</div>
            <div style="font-weight: 600; color: ${BRAND_DARK};">${paymentIntent.phone}</div>
        </div>
        <div class="item-row">
            <div style="color: #64748B;">Processing Date</div>
            <div style="font-weight: 600; color: ${BRAND_DARK};">${new Date(paymentIntent.updatedAt).toLocaleString()}</div>
        </div>
        <div class="item-row" style="border-bottom: none;">
            <div style="color: #64748B;">Transaction Reference</div>
            <div style="font-family: monospace; font-size: 12px; color: ${BRAND_DARK};">${paymentIntent.id}</div>
        </div>
    </div>
    
    ${order ? `
    <div class="section" style="border-left: 4px solid ${BRAND_PRIMARY};">
        <span class="section-title">Associated Order</span>
        <div class="item-row">
            <div style="color: #64748B;">Order Number</div>
            <div style="font-weight: 700; color: ${BRAND_DARK};">#${order.orderNumber}</div>
        </div>
        <div class="item-row">
            <div style="color: #64748B;">Current Status</div>
            <div class="status-badge badge-success">${order.status}</div>
        </div>
    </div>
    <p style="text-align: center; color: #64748B; font-size: 14px;">Your order is now moving to the fulfillment stage. You will receive further updates as we prepare your items.</p>
    ` : `
    <p style="text-align: center; color: #64748B; font-size: 14px;">Your formal order confirmation will follow this receipt shortly.</p>
    `}
    
    <div style="text-align: center; margin-top: 32px;">
        <p style="font-weight: 700; color: ${BRAND_PRIMARY}; text-transform: uppercase; font-size: 12px; letter-spacing: 0.1em;">Thank you for your business with Hera Collection.</p>
    </div>
  `;

  return wrapWithLayout('Payment Confirmation', content);
};

export const createPaymentFailedEmail = (paymentIntent, customer, failureReason) => {
  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <p>Dear ${customer.name || 'Client'},</p>
      <p>We encountered an issue while processing your recent payment. Your selected items remain reserved in your cart for a limited time.</p>
    </div>
    
    <div class="section">
        <span class="section-title">Transaction Failure Report</span>
        <div class="item-row">
            <div style="color: #64748B;">Proposed Amount</div>
            <div style="font-weight: 700; color: ${BRAND_DARK};">KES ${paymentIntent.amount.toLocaleString()}</div>
        </div>
        <div class="item-row">
            <div style="color: #64748B;">Decline Reason</div>
            <div style="color: #991B1B; font-weight: 600;">${failureReason || 'Transaction declined or timed out'}</div>
        </div>
        <div class="item-row">
            <div style="color: #64748B;">Mobile Number Used</div>
            <div style="font-weight: 600; color: ${BRAND_DARK};">${paymentIntent.phone}</div>
        </div>
    </div>
    
    <div class="section" style="background-color: #FEF2F2; border: 1px solid #FEE2E2;">
        <span class="section-title" style="color: #991B1B;">Recommended Actions</span>
        <ul style="color: #7F1D1D; padding-left: 20px; margin: 0; font-size: 14px;">
            <li style="margin-bottom: 8px;">Ensure sufficient funds are available in your M-Pesa account.</li>
            <li style="margin-bottom: 8px;">Verify that your mobile device is active and has network reception.</li>
            <li style="margin-bottom: 8px;">Confirm that the M-Pesa PIN was entered correctly within the prompt timeframe.</li>
        </ul>
    </div>
    
    <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout?retry=${paymentIntent.id}" class="button">Resume Secured Checkout</a>
    </div>
    
    <p style="text-align: center; font-size: 12px; color: #64748B; margin-top: 24px;">Should you require assistance with your payment, please contact our administrative team.</p>
  `;

  return wrapWithLayout('Payment Unsuccessful', content);
};
