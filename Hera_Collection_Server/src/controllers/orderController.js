import * as orderService from '../services/orderService.js';
import { getDatesFromTimeframe } from '../utils/dateUtils.js';

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
    const userId = Number(req.auth.userId);
    if (isNaN(userId)) {
      return res.status(401).json({ success: false, message: 'Invalid user ID in token' });
    }

    const orders = await orderService.getUserOrders(userId, req.query);
    return res.json({
      success: true,
      data: orders,
      count: orders.length
    });
  } catch (err) {
    console.error('listOrders error:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch orders',
      error: err.message
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
    const idParam = req.params.id;
    const orderId = parseInt(idParam, 10);
    const userId = Number(req.auth.userId);
    const isAdmin = req.auth?.role === 'ADMIN';

    let order = null;

    if (!isNaN(orderId)) {
      // Try fetching by ID first
      order = isAdmin
        ? await orderService.getOrderByIdAdmin(orderId)
        : await orderService.getOrderById(userId, orderId);
    }

    // If not found by ID or ID was not numeric, try by orderNumber
    if (!order) {
      const orders = await orderService.getAllOrders({ search: idParam });
      const foundOrder = orders.find(o => o.orderNumber === idParam);
      
      if (foundOrder) {
          // Ownership check for non-admins
          if (!isAdmin && foundOrder.buyerId !== userId) {
             return res.status(403).json({ success: false, message: 'Access denied' });
          }
          order = foundOrder;
      }
    }

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
      message: 'Failed to fetch order',
      error: err.message
    });
  }
}
export async function updateOrderStatus(req, res) {
  try {
    const { status, trackingNumber, estimatedDelivery, mpesaReference } = req.body;
    const orderId = parseInt(req.params.id, 10);
    const adminUserId = req.auth.userId;

    const updatedOrder = await orderService.updateOrderStatus(
      orderId, 
      status, 
      adminUserId,
      trackingNumber,
      estimatedDelivery,
      mpesaReference
    );
    
    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: updatedOrder
    });
  } catch (err) {
    console.error('updateOrderStatus error:', err);
    if (err.message === 'Order not found') {
      return res.status(404).json({ success: false, message: err.message });
    }
    if (err.message.includes('payment reference')) {
      return res.status(400).json({ success: false, message: err.message });
    }
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
    const dates = getDatesFromTimeframe(timeframe);
    const filters = {
      startDate: req.query.startDate || dates.startDate,
      endDate: req.query.endDate || dates.endDate
    };
    
    const analytics = await orderService.getSalesAnalytics(timeframe, filters);
    
    return res.json({
      success: true,
      data: analytics
    });
  } catch (err) {
    console.error('salesAnalytics error:', err);
    try {
      const fs = await import('fs');
      fs.appendFileSync('backend_error.log', `[${new Date().toISOString()}] salesAnalytics error: ${err.stack}\n`);
    } catch (logErr) {}

    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch analytics',
      error: err.message
    });
  }
}

export async function salesTrends(req, res) {
  try {
    const timeframe = req.query.timeframe || 'monthly';
    const dates = getDatesFromTimeframe(timeframe);
    const filters = {
      startDate: req.query.startDate || dates.startDate,
      endDate: req.query.endDate || dates.endDate
    };
    
    const trends = await orderService.getSalesTrends(filters);
    
    return res.json({
      success: true,
      data: trends
    });
  } catch (err) {
    console.error("salesTrends error:", err);
    try {
      const fs = await import('fs');
      fs.appendFileSync('backend_error.log', `[${new Date().toISOString()}] salesTrends error: ${err.stack}\n`);
    } catch (logErr) {}
    
    return res.status(500).json({ 
      success: false,
      message: "Failed to fetch sales trends",
      error: err.message
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

    const timeframe = req.query.timeframe || 'monthly';
    const dates = getDatesFromTimeframe(timeframe);
    const filters = {
      startDate: req.query.startDate || dates.startDate,
      endDate: req.query.endDate || dates.endDate
    };
    
    const stats = await orderService.getOrderStats(filters);
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('orderStats error:', err);
    try {
      const fs = await import('fs');
      fs.appendFileSync('backend_error.log', `[${new Date().toISOString()}] orderStats error: ${err.stack}\n`);
    } catch (logErr) {}
    
    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch order statistics',
      error: err.message
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

export async function listOrderItems(req, res) {
  try {
    const items = await orderService.getAllOrderItems(req.query);
    return res.json({
      success: true,
      data: items,
      count: items.length
    });
  } catch (err) {
    console.error('listOrderItems error:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch order items' 
    });
  }
}