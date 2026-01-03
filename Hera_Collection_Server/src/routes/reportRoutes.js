import express from 'express';
import * as reportController from '../controllers/reportController.js';
import { protect, protectAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All report routes are protected and admin only
router.use(protect);
router.use(protectAdmin);

router.get('/sales-summary', reportController.getSalesSummary);
router.get('/expenses', reportController.getExpensesReport);
router.get('/inventory-value', reportController.getInventoryValue);
router.get('/profit-loss', reportController.getProfitLoss);

export default router;
