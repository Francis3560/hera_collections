export const createOrderConfirmationEmail = (order, customerName, orderItems) => {
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - VizX Global</title>
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
        .order-number {
            background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
            color: white;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
            margin: 20px 0;
            font-size: 24px;
            font-weight: bold;
        }
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            margin-left: 10px;
        }
        .status-pending { background: #ff9800; color: white; }
        .status-paid { background: #4CAF50; color: white; }
        .status-processing { background: #2196F3; color: white; }
        .status-shipped { background: #9C27B0; color: white; }
        .status-fulfilled { background: #607D8B; color: white; }
        .status-cancelled { background: #f44336; color: white; }
        
        .order-summary {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .item-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .item-row:last-child {
            border-bottom: none;
        }
        .total-row {
            font-weight: bold;
            font-size: 18px;
            padding-top: 15px;
            border-top: 2px solid #ddd;
        }
        .shipping-info {
            background-color: #e8f5e8;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #4CAF50;
        }
        .timeline {
            margin: 30px 0;
        }
        .timeline-step {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        .timeline-icon {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: #e0e0e0;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            font-weight: bold;
        }
        .timeline-step.active .timeline-icon {
            background: #4CAF50;
            color: white;
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
            <h1>Order Confirmed!</h1>
            <p>Thank you for your purchase</p>
        </div>
        
        <div class="content">
            <p>Dear ${customerName},</p>
            
            <p>Your order has been successfully placed and is being processed. Here are your order details:</p>
            
            <div class="order-number">
                Order: ${order.orderNumber}
                <span class="status-badge status-${order.status.toLowerCase()}">
                    ${order.status}
                </span>
            </div>
            
            <div class="order-summary">
                <h3>Order Summary</h3>
                
                ${orderItems.map(item => `
                <div class="item-row">
                    <div>
                        <strong>${item.title}</strong>
                        ${item.variantName ? `<br><small>${item.variantName}: ${item.variantValue}</small>` : ''}
                        <br>
                        <small>Quantity: ${item.quantity} × KES ${item.price.toFixed(2)}</small>
                    </div>
                    <div>KES ${(item.quantity * item.price).toFixed(2)}</div>
                </div>
                `).join('')}
                
                <div class="item-row">
                    <div>Subtotal</div>
                    <div>KES ${order.subtotalAmount.toFixed(2)}</div>
                </div>
                
                <div class="item-row">
                    <div>Shipping</div>
                    <div>KES 0.00</div>
                </div>
                
                <div class="item-row total-row">
                    <div>Total Amount</div>
                    <div>KES ${order.totalAmount.toFixed(2)}</div>
                </div>
            </div>
            
            <div class="shipping-info">
                <h3>Shipping Information</h3>
                <p><strong>Name:</strong> ${order.customerFirstName} ${order.customerLastName}</p>
                ${order.customerEmail ? `<p><strong>Email:</strong> ${order.customerEmail}</p>` : ''}
                ${order.phone ? `<p><strong>Phone:</strong> ${order.phone}</p>` : ''}
                ${order.shippingAddress ? `<p><strong>Address:</strong> ${order.shippingAddress}</p>` : ''}
                ${order.shippingCity ? `<p><strong>City:</strong> ${order.shippingCity}</p>` : ''}
                ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
            </div>
            
            <div class="timeline">
                <h3>Order Timeline</h3>
                <div class="timeline-step ${order.status === 'PAID' || order.status === 'FULFILLED' ? 'active' : ''}">
                    <div class="timeline-icon">✓</div>
                    <div>
                        <strong>Order Placed</strong>
                        <p>${orderDate}</p>
                    </div>
                </div>
                <div class="timeline-step ${order.status === 'PAID' || order.status === 'FULFILLED' ? 'active' : ''}">
                    <div class="timeline-icon">2</div>
                    <div>
                        <strong>Payment Confirmed</strong>
                        <p>Your payment has been received</p>
                    </div>
                </div>
                <div class="timeline-step ${order.status === 'FULFILLED' ? 'active' : ''}">
                    <div class="timeline-icon">3</div>
                    <div>
                        <strong>Processing Order</strong>
                        <p>Your items are being prepared</p>
                    </div>
                </div>
                <div class="timeline-step">
                    <div class="timeline-icon">4</div>
                    <div>
                        <strong>Shipped</strong>
                        <p>Items dispatched for delivery</p>
                    </div>
                </div>
                <div class="timeline-step">
                    <div class="timeline-icon">5</div>
                    <div>
                        <strong>Delivered</strong>
                        <p>Order delivered successfully</p>
                    </div>
                </div>
            </div>
            
            <p>We'll send you updates as your order progresses. You can also track your order status by logging into your account.</p>
            
            <p>If you have any questions about your order, please reply to this email or contact our customer support.</p>
            
            <p>Thank you for shopping with us!</p>
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

export const createOrderProcessingEmail = (order, customerName) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Order is Being Processed - VizX Global</title>
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
            background: linear-gradient(135deg, #2196F3 0%, #21CBF3 100%);
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
        .processing-icon {
            text-align: center;
            font-size: 60px;
            margin: 20px 0;
            color: #2196F3;
        }
        .order-info {
            background-color: #f0f8ff;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #2196F3;
        }
        .estimated-time {
            background-color: #e8f5e8;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
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
            <h1>Your Order is Being Processed</h1>
        </div>
        
        <div class="content">
            <div class="processing-icon">⏳</div>
            
            <p>Dear ${customerName},</p>
            
            <p>Great news! Your order <strong>${order.orderNumber}</strong> has been confirmed and is now being processed.</p>
            
            <div class="order-info">
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                <p><strong>Total Amount:</strong> KES ${order.totalAmount.toFixed(2)}</p>
            </div>
            
            <div class="estimated-time">
                <h3>Estimated Processing Time</h3>
                <p><strong>1-2 Business Days</strong></p>
                <p>We're preparing your items with care and will notify you once they're ready for shipping.</p>
            </div>
            
            <h3>What Happens Next?</h3>
            <ol>
                <li>Our team verifies your order details</li>
                <li>Items are carefully picked and packed</li>
                <li>Quality check is performed</li>
                <li>Order is prepared for shipping</li>
            </ol>
            
            <p>You'll receive another email notification when your order ships with tracking information.</p>
            
            <p>If you need to make any changes to your order or have questions, please contact our customer support team immediately.</p>
            
            <p>Thank you for your patience!</p>
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

export const createOrderShippedEmail = (order, customerName, trackingNumber = null, estimatedDelivery = null) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Order Has Shipped! - VizX Global</title>
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
            background: linear-gradient(135deg, #9C27B0 0%, #E91E63 100%);
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
        .shipped-icon {
            text-align: center;
            font-size: 60px;
            margin: 20px 0;
            color: #9C27B0;
        }
        .tracking-info {
            background-color: #f3e5f5;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #9C27B0;
            text-align: center;
        }
        .tracking-number {
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 2px;
            color: #9C27B0;
            margin: 10px 0;
        }
        .delivery-estimate {
            background-color: #e8f5e8;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .shipping-address {
            background-color: #f0f8ff;
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
            <h1>Your Order Has Shipped! 🚚</h1>
        </div>
        
        <div class="content">
            <div class="shipped-icon">📦</div>
            
            <p>Dear ${customerName},</p>
            
            <p>Great news! Your order <strong>${order.orderNumber}</strong> has been shipped and is on its way to you!</p>
            
            <div class="tracking-info">
                <h3>Tracking Information</h3>
                ${trackingNumber ? `
                <p>You can track your shipment using the following tracking number:</p>
                <div class="tracking-number">${trackingNumber}</div>
                ` : `
                <p>Your order is in transit. Tracking information will be available soon.</p>
                `}
            </div>
            
            ${estimatedDelivery ? `
            <div class="delivery-estimate">
                <h3>Estimated Delivery</h3>
                <p><strong>${new Date(estimatedDelivery).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</strong></p>
                <p>Please ensure someone is available to receive the package.</p>
            </div>
            ` : ''}
            
            <div class="shipping-address">
                <h3>Shipping To:</h3>
                <p>${order.customerFirstName} ${order.customerLastName}</p>
                ${order.shippingAddress ? `<p>${order.shippingAddress}</p>` : ''}
                ${order.shippingCity ? `<p>${order.shippingCity}</p>` : ''}
                ${order.shippingCountry ? `<p>${order.shippingCountry}</p>` : ''}
            </div>
            
            <h3>What to Expect:</h3>
            <ul>
                <li>The carrier will attempt delivery during business hours</li>
                <li>Please inspect your package upon delivery</li>
                <li>If there are any issues, contact us within 48 hours</li>
                <li>Keep the packaging until you're satisfied with the items</li>
            </ul>
            
            <p>You can track your order status at any time by logging into your account.</p>
            
            <p>We hope you love your purchase! If you have any questions, our customer support team is here to help.</p>
            
            <p>Happy shopping!</p>
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

export const createAdminOrderNotification = (order, items, customerName) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Order Received - Order ${order.orderNumber}</title>
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
            background: linear-gradient(135deg, #FF9800 0%, #FF5722 100%);
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
        .alert-badge {
            background: #ff9800;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            text-align: center;
            font-size: 18px;
            margin: 20px 0;
        }
        .order-details {
            background-color: #fff3e0;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #FF9800;
        }
        .customer-info {
            background-color: #f0f8ff;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .items-table th, .items-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .items-table th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
        .total-row {
            font-weight: bold;
            background-color: #f9f9f9;
        }
        .action-button {
            display: inline-block;
            background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
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
            <h1>New Order Received!</h1>
        </div>
        
        <div class="content">
            <div class="alert-badge">
                ⚡ New Order Requires Attention ⚡
            </div>
            
            <p>A new order has been placed and requires processing.</p>
            
            <div class="order-details">
                <h3>Order Details</h3>
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Order Time:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                <p><strong>Status:</strong> <span style="color: #FF9800; font-weight: bold;">${order.status}</span></p>
                <p><strong>Total Amount:</strong> <span style="font-size: 20px; font-weight: bold;">KES ${order.totalAmount.toFixed(2)}</span></p>
            </div>
            
            <div class="customer-info">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> ${customerName}</p>
                <p><strong>Email:</strong> ${order.customerEmail || 'N/A'}</p>
                <p><strong>Phone:</strong> ${order.phone || 'N/A'}</p>
                ${order.shippingAddress ? `<p><strong>Shipping Address:</strong> ${order.shippingAddress}</p>` : ''}
                ${order.notes ? `<p><strong>Customer Notes:</strong> ${order.notes}</p>` : ''}
            </div>
            
            <h3>Order Items</h3>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                    <tr>
                        <td>
                            <strong>${item.product?.title || 'Product'}</strong>
                            ${item.variantName ? `<br><small>${item.variantName}: ${item.variantValue}</small>` : ''}
                        </td>
                        <td>KES ${item.price.toFixed(2)}</td>
                        <td>${item.quantity}</td>
                        <td>KES ${(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr class="total-row">
                        <td colspan="3"><strong>Total Amount</strong></td>
                        <td><strong>KES ${order.totalAmount.toFixed(2)}</strong></td>
                    </tr>
                </tfoot>
            </table>
            
            <div style="text-align: center;">
                <a href="${process.env.ADMIN_URL || 'http://localhost:3000/admin'}/orders/${order.id}" class="action-button">
                    View & Process Order
                </a>
            </div>
            
            <p>Please process this order within 24 hours and update the order status accordingly.</p>
            
            <p><strong>Action Required:</strong></p>
            <ol>
                <li>Verify payment confirmation</li>
                <li>Prepare the items for shipping</li>
                <li>Update order status to "Processing"</li>
                <li>Notify customer when order ships</li>
            </ol>
            
            <p>This is an automated notification. The order details are also available in the admin dashboard.</p>
        </div>
        
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} VizX Global. All rights reserved.</p>
            <p>Admin Notification - Order Management System</p>
        </div>
    </div>
</body>
</html>
  `;
};