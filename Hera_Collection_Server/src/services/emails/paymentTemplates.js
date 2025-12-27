// services/emailTemplates/paymentTemplates.js

export const createPaymentSuccessEmail = (paymentIntent, order, customer) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Successful - VizX Global</title>
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
        .payment-details {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #4CAF50;
        }
        .order-info {
            background-color: #e8f5e8;
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
            <div class="logo">VizX Global</div>
            <h1>Payment Successful! 🎉</h1>
        </div>
        
        <div class="content">
            <div class="success-icon">✓</div>
            
            <p>Dear ${customer.name || 'Customer'},</p>
            
            <p>We're pleased to inform you that your payment has been successfully processed!</p>
            
            <div class="payment-details">
                <h3>Payment Details</h3>
                <p><strong>Amount Paid:</strong> KES ${paymentIntent.amount.toFixed(2)}</p>
                <p><strong>Payment Method:</strong> M-Pesa</p>
                <p><strong>Phone Number:</strong> ${paymentIntent.phone}</p>
                <p><strong>Transaction Date:</strong> ${new Date(paymentIntent.updatedAt).toLocaleString()}</p>
                <p><strong>Payment ID:</strong> ${paymentIntent.id}</p>
            </div>
            
            ${order ? `
            <div class="order-info">
                <h3>Order Information</h3>
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Order Status:</strong> ${order.status}</p>
                <p><strong>Order Total:</strong> KES ${order.totalAmount.toFixed(2)}</p>
            </div>
            
            <p>Your order is now being processed. You'll receive another email shortly with your order confirmation and tracking details.</p>
            ` : `
            <p>Your order is being processed and you'll receive an order confirmation email shortly.</p>
            `}
            
            <p>You can view your order status by logging into your account at any time.</p>
            
            <p>Thank you for your purchase!</p>
            <p><strong>The VizX Global Team</strong></p>
        </div>
        
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} VizX Global. All rights reserved.</p>
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
    <title>Payment Failed - VizX Global</title>
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
            background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
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
        .failure-icon {
            text-align: center;
            font-size: 60px;
            margin: 20px 0;
            color: #f44336;
        }
        .payment-details {
            background-color: #fff5f5;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #f44336;
        }
        .retry-info {
            background-color: #fff3e0;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 5px;
            font-weight: bold;
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
            <div class="logo">VizX Global</div>
            <h1>Payment Failed</h1>
        </div>
        
        <div class="content">
            <div class="failure-icon">✗</div>
            
            <p>Dear ${customer.name || 'Customer'},</p>
            
            <p>We were unable to process your payment. Here are the details:</p>
            
            <div class="payment-details">
                <h3>Payment Details</h3>
                <p><strong>Amount:</strong> KES ${paymentIntent.amount.toFixed(2)}</p>
                <p><strong>Payment Method:</strong> M-Pesa</p>
                <p><strong>Phone Number:</strong> ${paymentIntent.phone}</p>
                <p><strong>Attempt Date:</strong> ${new Date(paymentIntent.updatedAt).toLocaleString()}</p>
                <p><strong>Failure Reason:</strong> ${failureReason || 'Unknown error'}</p>
            </div>
            
            <div class="retry-info">
                <h3>How to Complete Your Order</h3>
                <p>To complete your purchase, please try one of the following:</p>
                <ol>
                    <li>Retry the payment by clicking the button below</li>
                    <li>Check that your M-Pesa PIN is correct</li>
                    <li>Ensure you have sufficient balance</li>
                    <li>Try using a different phone number</li>
                </ol>
                
                <div style="text-align: center;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout?retry=${paymentIntent.id}" class="button">
                        Retry Payment
                    </a>
                </div>
            </div>
            
            <p>If you continue to experience issues, please contact our customer support for assistance.</p>
            
            <p>Your items have been reserved in your cart for the next 24 hours.</p>
            
            <p>Thank you for choosing VizX Global!</p>
            <p><strong>The VizX Global Team</strong></p>
        </div>
        
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} VizX Global. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
        </div>
    </div>
</body>
</html>
  `;
};