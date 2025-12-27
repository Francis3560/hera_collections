// routes/expenseRoutes.js
import express from 'express';
import { protect, protectAdmin } from '../middlewares/authMiddleware.js';
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseAnalytics,
  getExpenseStats,
  exportExpenses,
  bulkCreateExpenses,
} from '../controllers/expenseController.js';
import {
  validateCreateExpense,
  validateUpdateExpense,
  validateExpenseQuery,
  validateAnalyticsQuery,
  validateExportQuery,
} from '../validators/expenseValidators.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// User accessible routes
router.get('/', validateExpenseQuery, getAllExpenses);
router.get('/:id', getExpenseById);
router.post('/', validateCreateExpense, createExpense);

// User can only update/delete their own expenses (enforced in controller)
router.put('/:id', validateUpdateExpense, updateExpense);
router.delete('/:id', deleteExpense);

// Admin-only routes
router.use(protectAdmin);

// Analytics and statistics
router.get('/analytics/expenses', validateAnalyticsQuery, getExpenseAnalytics);
router.get('/stats/expenses', getExpenseStats);

// Export functionality
router.get('/export/expenses', validateExportQuery, exportExpenses);

// Bulk operations
router.post('/bulk', bulkCreateExpenses);

export default router;