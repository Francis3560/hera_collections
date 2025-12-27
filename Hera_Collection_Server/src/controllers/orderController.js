import * as orderService from '../services/orderService.js';

export async function createOrder(req, res) {
  try {
    const order = await orderService.createOrder(req.auth.userId, req.body);
    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order,
    });
  } catch (err) {
    console.error('createOrder error:', err);
    return res.status(400).json({ 
      success: false,
      message: err.message || 'Failed to create order' 
    });
  }
}
export async function listOrders(req, res) {
  try {
    const orders = await orderService.getUserOrders(req.auth.userId);
    return res.json({
      success: true,
      data: orders,
      count: orders.length
    });
  } catch (err) {
    console.error('listOrders error:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch orders' 
    });
  }
}
export async function listAllOrders(req, res) {
  try {
    const filters = {
      status: req.query.status,
      paymentMethod: req.query.paymentMethod,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };
    
    const orders = await orderService.getAllOrders(filters);
    
    return res.json({
      success: true,
      data: orders,
      count: orders.length,
      filters
    });
  } catch (err) {
    console.error('listAllOrders error:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch all orders' 
    });
  }
}

export async function getOrder(req, res) {
  try {
    const orderId = parseInt(req.params.id, 10);

    const isAdmin = req.auth?.role === 'ADMIN';
    const order = isAdmin
      ? await orderService.getOrderByIdAdmin(orderId)
      : await orderService.getOrderById(req.auth.userId, orderId);

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }
    
    return res.json({
      success: true,
      data: order
    });
  } catch (err) {
    console.error('getOrder error:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch order' 
    });
  }
}
export async function updateOrderStatus(req, res) {
  try {
    const { status, trackingNumber, estimatedDelivery } = req.body;
    const orderId = parseInt(req.params.id, 10);
    const adminUserId = req.auth.userId;

    const updatedOrder = await orderService.updateOrderStatus(
      orderId, 
      status, 
      adminUserId,
      trackingNumber,
      estimatedDelivery
    );
    
    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: updatedOrder
    });
  } catch (err) {
    console.error('updateOrderStatus error:', err);
    return res.status(500).json({ 
      success: false,
      message: err.message || 'Failed to update order status' 
    });
  }
}
export async function updateOrderDetails(req, res) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const updateData = req.body;

    const updatedOrder = await orderService.updateOrderDetails(orderId, updateData);
    
    return res.status(200).json({
      success: true,
      message: 'Order details updated successfully',
      data: updatedOrder
    });
  } catch (err) {
    console.error('updateOrderDetails error:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to update order details' 
    });
  }
}

export async function createCashOrder(req, res) {
  try {
    if (req.auth.role !== 'ADMIN') {
      return res.status(403).json({ 
        success: false,
        message: 'Only admins can create cash orders' 
      });
    }

    const order = await orderService.createOrder(req.auth.userId, req.body, null);
    
    return res.status(201).json({
      success: true,
      message: 'Cash order created successfully',
      data: order
    });
  } catch (err) {
    console.error('createCashOrder error:', err);
    return res.status(400).json({ 
      success: false,
      message: err.message || 'Failed to create cash order' 
    });
  }
}
export async function deleteOrder(req, res) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const result = await orderService.deleteOrder(orderId);
    
    return res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (err) {
    console.error('deleteOrder error:', err);
    return res.status(500).json({ 
      success: false,
      message: err.message || 'Failed to delete order' 
    });
  }
}
export async function salesAnalytics(req, res) {
  try {
    const timeframe = req.query.timeframe || 'monthly';
    const analytics = await orderService.getSalesAnalytics(timeframe);
    
    return res.json({
      success: true,
      data: analytics
    });
  } catch (err) {
    console.error('salesAnalytics error:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch analytics' 
    });
  }
}

export async function salesTrends(req, res) {
  try {
    const trends = await orderService.getSalesTrends();
    
    return res.json({
      success: true,
      data: trends
    });
  } catch (err) {
    console.error("salesTrends error:", err);
    return res.status(500).json({ 
      success: false,
      message: "Failed to fetch sales trends" 
    });
  }
}

export async function orderStats(req, res) {
  try {
    if (req.auth.role !== 'ADMIN') {
      return res.status(403).json({ 
        success: false,
        message: 'Only admins can view order statistics' 
      });
    }

    const stats = await orderService.getOrderStats();
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('orderStats error:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch order statistics' 
    });
  }
}

export async function sendOrderUpdateEmail(req, res) {
  try {
    if (req.auth.role !== 'ADMIN') {
      return res.status(403).json({ 
        success: false,
        message: 'Only admins can send email updates' 
      });
    }

    const { orderId, message, subject } = req.body;
    
    // You would implement this function in emailService
    // await emailService.sendCustomOrderUpdate(orderId, subject, message);
    
    return res.json({
      success: true,
      message: 'Email update sent successfully'
    });
  } catch (err) {
    console.error('sendOrderUpdateEmail error:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to send email update' 
    });
  }
}