// services/emailTemplates/paymentTemplates.js

export const createPaymentSuccessEmail = (paymentIntent, order, customer) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Successful - Hera Collections</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: hsl(222.2 84% 4.9%);
            margin: 0;
            padding: 0;
            background-color: hsl(210 40% 96%);
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: hsl(0 0% 100%);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .header {
            text-align: center;
            padding: 40px 0;
            background: linear-gradient(135deg, hsl(269 90% 58%) 0%, hsl(270 90% 65%) 100%);
            color: white;
        }
        .logo {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 10px;
            letter-spacing: -0.025em;
        }
        .content {
            padding: 40px;
        }
        .success-icon {
            text-align: center;
            font-size: 64px;
            margin-bottom: 24px;
            color: hsl(142 76% 36%);
        }
        h1 {
            font-size: 24px;
            font-weight: 700;
            margin: 0;
        }
        p {
            margin-bottom: 16px;
            color: hsl(215.4 16.3% 46.9%);
        }
        .payment-details {
            background-color: hsl(210 40% 98%);
            padding: 24px;
            border-radius: 12px;
            margin: 24px 0;
            border: 1px solid hsl(214.3 31.8% 91.4%);
        }
        .payment-details h3, .order-info h3 {
            margin-top: 0;
            color: hsl(222.2 84% 4.9%);
            font-size: 18px;
            margin-bottom: 16px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid hsl(214.3 31.8% 91.4%);
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: 600;
            color: hsl(215.4 16.3% 46.9%);
        }
        .detail-value {
            color: hsl(222.2 84% 4.9%);
            font-weight: 500;
        }
        .order-info {
            background-color: hsl(269 90% 58% / 0.05);
            padding: 24px;
            border-radius: 12px;
            margin: 24px 0;
            border: 1px solid hsl(269 90% 58% / 0.2);
        }
        .footer {
            text-align: center;
            padding: 30px;
            background-color: hsl(210 40% 98%);
            color: hsl(215.4 16.3% 46.9%);
            font-size: 14px;
            border-top: 1px solid hsl(214.3 31.8% 91.4%);
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, hsl(269 90% 58%) 0%, hsl(270 90% 65%) 100%);
            color: white;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-weight: 600;
            margin-top: 16px;
            text-align: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.3);
        }
        .button:hover {
            background: linear-gradient(135deg, hsl(269 90% 48%) 0%, hsl(270 90% 55%) 100%);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(124, 58, 237, 0.3);
        }
        .gradient-text {
            background: linear-gradient(90deg, hsl(269 90% 58%), hsl(270 90% 65%), hsl(269 90% 58%));
            background-size: 200% auto;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: gradient-shift 3s ease-in-out infinite;
        }
        @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }
        .transition-smooth {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo gradient-text">Hera Collections</div>
            <h1>Payment Successful! 🎉</h1>
        </div>
        
        <div class="content">
            <div class="success-icon">✓</div>
            
            <p>Dear ${customer.name || 'Customer'},</p>
            
            <p>We're pleased to inform you that your payment has been successfully processed! Your transaction has been secured and confirmed.</p>
            
            <div class="payment-details">
                <h3>Payment Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Amount Paid</span>
                    <span class="detail-value">KES ${paymentIntent.amount.toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Payment Method</span>
                    <span class="detail-value">M-Pesa</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Phone Number</span>
                    <span class="detail-value">${paymentIntent.phone}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date</span>
                    <span class="detail-value">${new Date(paymentIntent.updatedAt).toLocaleString()}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Transaction ID</span>
                    <span class="detail-value">${paymentIntent.id}</span>
                </div>
            </div>
            
            ${order ? `
            <div class="order-info">
                <h3>Order Information</h3>
                <div class="detail-row">
                    <span class="detail-label">Order Number</span>
                    <span class="detail-value">#${order.orderNumber}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status</span>
                    <span class="detail-value" style="color: hsl(142 76% 36%); font-weight: bold;">${order.status}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Total</span>
                    <span class="detail-value">KES ${order.totalAmount.toFixed(2)}</span>
                </div>
            </div>
            
            <p>Your order is now being processed by our team. You'll receive another notification shortly with your tracking details.</p>
            ` : `
            <p>Your order is being processed and you'll receive an order confirmation email shortly.</p>
            `}
            
            <div style="text-align: center; margin-top: 32px;">
                <p>Thank you for choosing luxury.</p>
                <p style="font-weight: 700; color: hsl(269 90% 58%);">The Hera Collections Team</p>
            </div>
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

export const createPaymentFailedEmail = (paymentIntent, customer, failureReason) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Failed - Hera Collections</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: hsl(222.2 84% 4.9%);
            margin: 0;
            padding: 0;
            background-color: hsl(210 40% 96%);
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: hsl(0 0% 100%);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .header {
            text-align: center;
            padding: 40px 0;
            background: linear-gradient(135deg, hsl(0 84.2% 60.2%) 0%, hsl(0 72.2% 50.6%) 100%);
            color: white;
        }
        .logo {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 10px;
            letter-spacing: -0.025em;
        }
        .content {
            padding: 40px;
        }
        .failure-icon {
            text-align: center;
            font-size: 64px;
            margin-bottom: 24px;
            color: hsl(0 84.2% 60.2%);
        }
        .payment-details {
            background-color: hsl(0 84.2% 60.2% / 0.05);
            padding: 24px;
            border-radius: 12px;
            margin: 24px 0;
            border: 1px solid hsl(0 84.2% 60.2% / 0.2);
        }
        .payment-details h3, .retry-info h3 {
            margin-top: 0;
            color: hsl(0 72.2% 50.6%);
            font-size: 18px;
            margin-bottom: 16px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid hsl(0 84.2% 60.2% / 0.1);
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: 600;
            color: hsl(0 72.2% 50.6%);
        }
        .detail-value {
            color: hsl(222.2 84% 4.9%);
            font-weight: 500;
        }
        .retry-info {
            background-color: hsl(38 92% 50% / 0.05);
            padding: 24px;
            border-radius: 12px;
            margin: 24px 0;
            border: 1px solid hsl(38 92% 50% / 0.2);
        }
        .retry-info h3 {
            color: hsl(38 92% 50%);
        }
        ol {
            margin: 0;
            padding-left: 20px;
            color: hsl(215.4 16.3% 46.9%);
        }
        li {
            margin-bottom: 8px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, hsl(269 90% 58%) 0%, hsl(270 90% 65%) 100%);
            color: white;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-weight: 600;
            margin: 24px 0 0 0;
            box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.3);
            text-align: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .button:hover {
            background: linear-gradient(135deg, hsl(269 90% 48%) 0%, hsl(270 90% 55%) 100%);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(124, 58, 237, 0.3);
        }
        .footer {
            text-align: center;
            padding: 30px;
            background-color: hsl(210 40% 98%);
            color: hsl(215.4 16.3% 46.9%);
            font-size: 14px;
            border-top: 1px solid hsl(214.3 31.8% 91.4%);
        }
        .gradient-text {
            background: linear-gradient(90deg, hsl(269 90% 58%), hsl(270 90% 65%), hsl(269 90% 58%));
            background-size: 200% auto;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: gradient-shift 3s ease-in-out infinite;
        }
        @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }
        .transition-smooth {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo gradient-text">Hera Collections</div>
            <h1>Payment Failed</h1>
        </div>
        
        <div class="content">
            <div class="failure-icon">✗</div>
            
            <p>Dear ${customer.name || 'Customer'},</p>
            
            <p>We were unable to process your payment for your order. Please find the details below:</p>
            
            <div class="payment-details">
                <h3>Transaction Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Amount</span>
                    <span class="detail-value">KES ${paymentIntent.amount.toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Method</span>
                    <span class="detail-value">M-Pesa</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Phone</span>
                    <span class="detail-value">${paymentIntent.phone}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date</span>
                    <span class="detail-value">${new Date(paymentIntent.updatedAt).toLocaleString()}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Reason</span>
                    <span class="detail-value">${failureReason || 'Unknown error'}</span>
                </div>
            </div>
            
            <div class="retry-info">
                <h3>Complete Your Order</h3>
                <p style="margin-bottom: 12px; color: hsl(215.4 16.3% 46.9%);">To secure your items, please try the following:</p>
                <ol>
                    <li>Verify your M-Pesa PIN is correct</li>
                    <li>Ensure you have sufficient balance</li>
                    <li>Check your internet connection</li>
                    <li>Or retry using the link below</li>
                </ol>
                
                <div style="text-align: center;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout?retry=${paymentIntent.id}" class="button">
                        Retry Payment
                    </a>
                </div>
            </div>
            
            <p style="margin-top: 24px;">Your items have been temporarily reserved in your cart. If you continue to experience issues, please contact our support team.</p>
            
            <div style="text-align: center; margin-top: 32px;">
                <p style="font-weight: 700; color: hsl(0 84.2% 60.2%);">The Hera Collections Team</p>
            </div>
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