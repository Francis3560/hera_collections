
import * as stockService from '../services/stockService.js';
import * as stockTakeService from '../services/stockTakeService.js';
import * as stockAlertService from '../services/stockAlertService.js';

export const addStock = async (req, res) => {
  try {
    const { variantId } = req.params;
    const result = await stockService.addStock(variantId, req.body, req.auth.userId);

    return res.status(200).json({
      success: true,
      message: 'Stock added successfully',
      data: result,
    });
  } catch (error) {
    console.error('Failed to add stock:', error);
    
    if (error.message === 'Product variant not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('Quantity must be')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to add stock',
    });
  }
};

export const adjustStock = async (req, res) => {
  try {
    const { variantId } = req.params;
    const result = await stockService.adjustStock(variantId, req.body, req.auth.userId);

    return res.status(200).json({
      success: true,
      message: 'Stock adjusted successfully',
      data: result,
    });
  } catch (error) {
    console.error('Failed to adjust stock:', error);
    
    if (error.message === 'Product variant not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('Quantity must be') || 
        error.message.includes('Insufficient stock')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to adjust stock',
    });
  }
};

export const recordDamage = async (req, res) => {
  try {
    const { variantId } = req.params;
    const result = await stockService.recordDamageMovement(variantId, req.body, req.auth.userId);

    return res.status(200).json({
      success: true,
      message: 'Damage recorded successfully',
      data: result,
    });
  } catch (error) {
    console.error('Failed to record damage:', error);
    
    if (error.message === 'Product variant not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('Quantity must be') || 
        error.message.includes('cannot exceed')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to record damage',
    });
  }
};

export const getProductStockMovements = async (req, res) => {
  try {
    const { variantId } = req.params;
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      movementType: req.query.movementType,
      page: req.query.page,
      limit: req.query.limit,
    };

    const result = await stockService.getProductStockMovements(variantId, filters);

    return res.status(200).json({
      success: true,
      data: result.movements,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Failed to fetch stock movements:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch stock movements',
    });
  }
};

export const getLowStockProducts = async (req, res) => {
  try {
    const threshold = req.query.threshold ? parseInt(req.query.threshold) : 10;
    const products = await stockService.getLowStockProducts(threshold);

    return res.status(200).json({
      success: true,
      data: products,
      count: products.length,
      threshold,
    });
  } catch (error) {
    console.error('Failed to fetch low stock products:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock products',
    });
  }
};

export const getStockValueAnalytics = async (req, res) => {
  try {
    const analytics = await stockService.getStockValueAnalytics();

    return res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Failed to fetch stock analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch stock analytics',
    });
  }
};

export const bulkStockUpdate = async (req, res) => {
  try {
    const result = await stockService.bulkStockUpdate(req.body.updates, req.auth.userId);

    return res.status(200).json({
      success: true,
      message: `Stock update completed: ${result.success} successful, ${result.failed} failed`,
      data: result,
    });
  } catch (error) {
    console.error('Failed to bulk update stock:', error);
    
    if (error.message.includes('Updates array is required')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to bulk update stock',
    });
  }
};

// Stock Take Controllers
export const createStockTake = async (req, res) => {
  try {
    const stockTake = await stockTakeService.createStockTake(req.body, req.auth.userId);

    return res.status(201).json({
      success: true,
      message: 'Stock take created successfully',
      data: stockTake,
    });
  } catch (error) {
    console.error('Failed to create stock take:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create stock take',
    });
  }
};

export const startStockTake = async (req, res) => {
  try {
    const { stockTakeId } = req.params;
    const stockTake = await stockTakeService.startStockTake(stockTakeId, req.auth.userId);

    return res.status(200).json({
      success: true,
      message: 'Stock take started successfully',
      data: stockTake,
    });
  } catch (error) {
    console.error('Failed to start stock take:', error);
    
    if (error.message === 'Stock take not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('already')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to start stock take',
    });
  }
};

export const addStockTakeItems = async (req, res) => {
  try {
    const { stockTakeId } = req.params;
    const result = await stockTakeService.addStockTakeItems(stockTakeId, req.body.items, req.auth.userId);

    return res.status(200).json({
      success: true,
      message: `Items added: ${result.success} successful, ${result.failed} failed`,
      data: result,
    });
  } catch (error) {
    console.error('Failed to add stock take items:', error);
    
    if (error.message === 'Stock take not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('must be IN_PROGRESS')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to add stock take items',
    });
  }
};

export const completeStockTake = async (req, res) => {
  try {
    const { stockTakeId } = req.params;
    const stockTake = await stockTakeService.completeStockTake(
      stockTakeId, 
      req.auth.userId, 
      req.body.autoAdjust
    );

    return res.status(200).json({
      success: true,
      message: 'Stock take completed successfully',
      data: stockTake,
    });
  } catch (error) {
    console.error('Failed to complete stock take:', error);
    
    if (error.message === 'Stock take not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('must be IN_PROGRESS')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to complete stock take',
    });
  }
};

export const getStockTakeById = async (req, res) => {
  try {
    const { stockTakeId } = req.params;
    const stockTake = await stockTakeService.getStockTakeById(stockTakeId);

    return res.status(200).json({
      success: true,
      data: stockTake,
    });
  } catch (error) {
    console.error('Failed to fetch stock take:', error);
    
    if (error.message === 'Stock take not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch stock take',
    });
  }
};

export const getAllStockTakes = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: req.query.page,
      limit: req.query.limit,
    };

    const result = await stockTakeService.getAllStockTakes(filters);

    return res.status(200).json({
      success: true,
      data: result.stockTakes,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Failed to fetch stock takes:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch stock takes',
    });
  }
};

export const cancelStockTake = async (req, res) => {
  try {
    const { stockTakeId } = req.params;
    const stockTake = await stockTakeService.cancelStockTake(stockTakeId, req.auth.userId, req.body.reason);

    return res.status(200).json({
      success: true,
      message: 'Stock take cancelled successfully',
      data: stockTake,
    });
  } catch (error) {
    console.error('Failed to cancel stock take:', error);
    
    if (error.message === 'Stock take not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('Cannot cancel') || 
        error.message.includes('already cancelled')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to cancel stock take',
    });
  }
};

export const getStockTakeReport = async (req, res) => {
  try {
    const { stockTakeId } = req.params;
    const report = await stockTakeService.getStockTakeReport(stockTakeId);

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Failed to fetch stock take report:', error);
    
    if (error.message === 'Stock take not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch stock take report',
    });
  }
};

// Stock Alert Controllers
export const setStockAlert = async (req, res) => {
  try {
    const { variantId } = req.params;
    const result = await stockAlertService.setStockAlert(variantId, req.body.threshold, req.auth.userId);

    return res.status(200).json({
      success: true,
      message: 'Stock alert set successfully',
      data: result,
    });
  } catch (error) {
    console.error('Failed to set stock alert:', error);
    
    if (error.message === 'Product variant not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('Threshold must be')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to set stock alert',
    });
  }
};

export const disableStockAlert = async (req, res) => {
  try {
    const { variantId } = req.params;
    const alert = await stockAlertService.disableStockAlert(variantId);

    return res.status(200).json({
      success: true,
      message: 'Stock alert disabled successfully',
      data: alert,
    });
  } catch (error) {
    console.error('Failed to disable stock alert:', error);
    
    if (error.message === 'Stock alert not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to disable stock alert',
    });
  }
};

export const resolveStockAlert = async (req, res) => {
  try {
    const { variantId } = req.params;
    const result = await stockAlertService.resolveStockAlert(variantId, req.auth.userId);

    return res.status(200).json({
      success: true,
      message: result.isResolved ? 'Stock alert resolved' : 'Stock still below threshold',
      data: result,
    });
  } catch (error) {
    console.error('Failed to resolve stock alert:', error);
    
    if (error.message === 'Stock alert not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('Stock alert is not active')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to resolve stock alert',
    });
  }
};

export const getActiveStockAlerts = async (req, res) => {
  try {
    const alerts = await stockAlertService.getActiveStockAlerts();

    return res.status(200).json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  } catch (error) {
    console.error('Failed to fetch active stock alerts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch active stock alerts',
    });
  }
};

export const getStockAlertHistory = async (req, res) => {
  try {
    const filters = {
      productId: req.query.productId,
      variantId: req.query.variantId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      resolved: req.query.resolved,
      page: req.query.page,
      limit: req.query.limit,
    };

    const result = await stockAlertService.getStockAlertHistory(filters);

    return res.status(200).json({
      success: true,
      data: result.alerts,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Failed to fetch stock alert history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch stock alert history',
    });
  }
};

export const getStockAlertStats = async (req, res) => {
  try {
    const stats = await stockAlertService.getStockAlertStats();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Failed to fetch stock alert stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch stock alert statistics',
    });
  }
};