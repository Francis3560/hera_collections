
const getStyles = () => `
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { text-align: center; padding: 40px 0; background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%); color: white; }
        .logo { font-size: 32px; font-weight: 800; margin-bottom: 10px; letter-spacing: -0.025em; }
        .content { padding: 40px; }
        .order-number { background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%); color: white; padding: 20px; border-radius: 12px; text-align: center; margin: 24px 0; font-size: 24px; font-weight: bold; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.2); }
        .status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: bold; margin-left: 12px; background-color: #6B7280; color: white; text-transform: uppercase; }
        .status-pending { background-color: #F59E0B; }
        .status-paid { background-color: #10B981; }
        .status-processing { background-color: #3B82F6; }
        .status-shipped { background-color: #8B5CF6; }
        .status-fulfilled { background-color: #10B981; }
        .status-cancelled { background-color: #EF4444; }
        .order-summary, .shipping-info, .order-info, .tracking-info, .delivery-estimate, .order-details, .customer-info, .retry-info { background-color: #f9fafb; padding: 24px; border-radius: 12px; margin: 24px 0; border: 1px solid #e5e7eb; }
        .item-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
        .item-row:last-child { border-bottom: none; }
        .total-row { font-weight: bold; font-size: 18px; padding-top: 16px; border-top: 2px solid #e5e7eb; color: #7C3AED; }
        .footer { text-align: center; padding: 30px; background-color: #f9fafb; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
        .button { display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 24px 0 16px 0; text-align: center; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.2); }
        .timeline { margin: 32px 0; }
        .timeline-step { display: flex; align-items: center; margin-bottom: 16px; }
        .timeline-icon { width: 36px; height: 36px; border-radius: 50%; background: #e5e7eb; display: flex; align-items: center; justify-content: center; margin-right: 16px; font-weight: bold; color: #6b7280; }
        .timeline-step.active .timeline-icon { background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%); color: white; box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.2); }
        .icon-large { font-size: 64px; margin-bottom: 16px; display: block; text-align: center; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .items-table th, .items-table td { text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; }
        .items-table th { background-color: #f3f4f6; font-weight: 600; }
    </style>
`;

export const createOrderConfirmationEmail = (order, customerName, orderItems) => {
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - Hera Collection</title>
    ${getStyles()}
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Hera Collection</div>
            <h1>Order Confirmed! 🎉</h1>
        </div>
        
        <div class="content">
            <p>Dear ${customerName},</p>
            <p>Your order has been successfully placed and is being processed. Thank you for choosing Hera Collection!</p>
            
            <div class="order-number">
                Order #${order.orderNumber}
                <br>
                <div style="margin-top: 10px;">
                    <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
                </div>
            </div>
            
            <div class="order-summary">
                <h3>Order Summary</h3>
                ${orderItems.map(item => `
                <div class="item-row">
                    <div>
                        <strong>${item.title}</strong>
                        ${item.variantName ? `<br><small style="color: #6b7280;">${item.variantName}: ${item.variantValue}</small>` : ''}
                        <br>
                        <small style="color: #6b7280;">Qty: ${item.quantity} × KES ${item.price.toLocaleString()}</small>
                    </div>
                    <div>KES ${(item.quantity * item.price).toLocaleString()}</div>
                </div>
                `).join('')}
                
                <div class="item-row">
                    <div>Subtotal</div>
                    <div>KES ${order.subtotalAmount.toLocaleString()}</div>
                </div>
                <div class="item-row">
                    <div>Shipping</div>
                    <div>Free</div>
                </div>
                <div class="item-row total-row">
                    <div>Total Amount</div>
                    <div>KES ${order.totalAmount.toLocaleString()}</div>
                </div>
            </div>
            
            <div class="shipping-info">
                <h3>Shipping Information</h3>
                <p><strong>Name:</strong> ${order.customerFirstName} ${order.customerLastName}</p>
                ${order.shippingAddress ? `<p><strong>Address:</strong> ${order.shippingAddress}</p>` : ''}
                ${order.shippingCity ? `<p><strong>City:</strong> ${order.shippingCity}</p>` : ''}
                ${order.phone ? `<p><strong>Phone:</strong> ${order.phone}</p>` : ''}
            </div>

            <div class="timeline">
                <h3>Order Status</h3>
                <div class="timeline-step active">
                    <div class="timeline-icon">✓</div>
                    <div>
                        <strong>Order Placed</strong>
                        <div style="font-size: 12px; color: #6b7280;">${orderDate}</div>
                    </div>
                </div>
                <div class="timeline-step ${['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'FULFILLED'].includes(order.status) ? 'active' : ''}">
                    <div class="timeline-icon">2</div>
                    <div><strong>Payment Confirmed</strong></div>
                </div>
                <div class="timeline-step ${['PROCESSING', 'SHIPPED', 'DELIVERED', 'FULFILLED'].includes(order.status) ? 'active' : ''}">
                    <div class="timeline-icon">3</div>
                    <div><strong>Processing</strong></div>
                </div>
                <div class="timeline-step ${['SHIPPED', 'DELIVERED', 'FULFILLED'].includes(order.status) ? 'active' : ''}">
                    <div class="timeline-icon">4</div>
                    <div><strong>Shipped</strong></div>
                </div>
            </div>

            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order.id}" class="button">View Order</a>
            </div>
        </div>
        
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Hera Collection. All rights reserved.</p>
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
    <title>Order Processing - Hera Collection</title>
    ${getStyles()}
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Hera Collection</div>
            <h1>Order Processing ⚙️</h1>
        </div>
        <div class="content">
            <div class="icon-large" style="color: #3B82F6;">⏳</div>
            <p>Dear ${customerName},</p>
            <p>We are currently processing your order <strong>#${order.orderNumber}</strong>. Our team is carefully preparing your items.</p>
            
            <div class="order-info">
                <h3>Estimated Timeline</h3>
                <p style="text-align: center; font-size: 18px; font-weight: bold; color: #7C3AED;">1-2 Business Days</p>
                <p style="text-align: center; color: #6b7280;">You will receive a notification as soon as your order ships.</p>
            </div>
            
            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order.id}" class="button">Track Status</a>
            </div>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Hera Collection. All rights reserved.</p>
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
    <title>Order Shipped - Hera Collection</title>
    ${getStyles()}
</head>
<body>
    <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #8B5CF6 0%, #a78bfa 100%);">
            <div class="logo">Hera Collection</div>
            <h1>Your Order Has Shipped! 🚚</h1>
        </div>
        <div class="content">
            <div class="icon-large" style="color: #8B5CF6;">📦</div>
            <p>Dear ${customerName},</p>
            <p>Great news! Your order <strong>#${order.orderNumber}</strong> is on its way.</p>
            
            <div class="tracking-info">
                <h3>Delivery Details</h3>
                ${trackingNumber ? `
                    <p><strong>Tracking Number:</strong></p>
                    <div style="background: #ffffff; padding: 12px; border: 1px dashed #d1d5db; display: inline-block; font-family: monospace; font-size: 18px; border-radius: 8px;">${trackingNumber}</div>
                    <br><br>
                    <a href="${process.env.CARRIER_TRACKING_URL || '#'}/${trackingNumber}" class="button">Track Package</a>
                ` : '<p>Your package is in transit.</p>'}
                
                ${estimatedDelivery ? `
                    <p style="margin-top: 20px;"><strong>Estimated Delivery:</strong><br>${new Date(estimatedDelivery).toLocaleDateString()}</p>
                ` : ''}
            </div>
            
            <div class="shipping-info">
                <h3>Shipping To</h3>
                <p>${order.customerFirstName} ${order.customerLastName}</p>
                <p>${order.shippingAddress}</p>
                <p>${order.shippingCity}</p>
            </div>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Hera Collection. All rights reserved.</p>
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
    <title>New Order - Hera Collection Admin</title>
    ${getStyles()}
</head>
<body>
    <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%);">
            <div class="logo">Hera Collection</div>
            <h1>New Order Received 🔔</h1>
        </div>
        <div class="content">
            <div class="alert-badge">Order #${order.orderNumber}</div>
            
            <div class="order-details">
                <p><strong>Customer:</strong> ${customerName}</p>
                <p><strong>Total:</strong> KES ${order.totalAmount.toLocaleString()}</p>
                <p><strong>Payment:</strong> ${order.paymentMethod || 'M-Pesa'}</p>
                <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            </div>
            
            <h3>Items</h3>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                    <tr>
                        <td>
                            ${item.product.title}
                            ${item.variant ? `<br><small style="color: #6b7280;">${item.variant.sku}</small>` : ''}
                        </td>
                        <td>${item.quantity}</td>
                        <td>KES ${item.price.toLocaleString()}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div style="text-align: center;">
                <a href="${process.env.ADMIN_URL || 'http://localhost:3000/admin'}/orders/${order.id}" class="button" style="background: #1f2937;">View in Admin Panel</a>
            </div>
        </div>
        <div class="footer">
            <p>Hera Collection Admin Notification System</p>
        </div>
    </div>
</body>
</html>
  `;
};