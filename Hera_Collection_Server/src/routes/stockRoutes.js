import express from 'express';
import { protect, protectAdmin } from '../middlewares/authMiddleware.js';
import {
  addStock,
  adjustStock,
  recordDamage,
  getProductStockMovements,
  getLowStockProducts,
  getStockValueAnalytics,
  bulkStockUpdate,
  
  createStockTake,
  startStockTake,
  addStockTakeItems,
  completeStockTake,
  getStockTakeById,
  getAllStockTakes,
  cancelStockTake,
  getStockTakeReport,
  
  setStockAlert,
  disableStockAlert,
  resolveStockAlert,
  getActiveStockAlerts,
  getStockAlertHistory,
  getStockAlertStats,
} from '../controllers/stockController.js';
import {
  validateAddStock,
  validateAdjustStock,
  validateBulkStockUpdate,
  validateStockMovementsQuery,
  validateLowStockQuery,
 
  validateCreateStockTake,
  validateAddStockTakeItems,
  validateCompleteStockTake,
  validateStockTakeQuery,
  
  validateStockAlert,
  validateStockAlertQuery,
} from '../validators/stockValidators.js';

const router = express.Router();

router.use(protect);

router.get('/low-stock', validateLowStockQuery, getLowStockProducts);

router.get('/movements/:productId', validateStockMovementsQuery, getProductStockMovements);

router.get('/analytics/value', protectAdmin, getStockValueAnalytics);

router.use(protectAdmin);

router.post('/:productId/add', validateAddStock, addStock);

router.post('/:productId/adjust', validateAdjustStock, adjustStock);

router.post('/:productId/damage', validateAdjustStock, recordDamage);

router.post('/bulk-update', validateBulkStockUpdate, bulkStockUpdate);

router.post('/stock-takes', validateCreateStockTake, createStockTake);

router.get('/stock-takes', validateStockTakeQuery, getAllStockTakes);

router.get('/stock-takes/:stockTakeId', getStockTakeById);

router.get('/stock-takes/:stockTakeId/report', getStockTakeReport);

router.post('/stock-takes/:stockTakeId/start', startStockTake);

router.post('/stock-takes/:stockTakeId/items', validateAddStockTakeItems, addStockTakeItems);

router.post('/stock-takes/:stockTakeId/complete', validateCompleteStockTake, completeStockTake);

router.post('/stock-takes/:stockTakeId/cancel', cancelStockTake);

router.post('/alerts/:productId', validateStockAlert, setStockAlert);

router.delete('/alerts/:productId', disableStockAlert);

router.post('/alerts/:productId/resolve', resolveStockAlert);

router.get('/alerts/active', getActiveStockAlerts);

router.get('/alerts/history', validateStockAlertQuery, getStockAlertHistory);

router.get('/alerts/stats', getStockAlertStats);

export default router;