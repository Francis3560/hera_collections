// routes/expenseCategoryRoutes.js
import express from 'express';
import { protect, protectAdmin } from '../middlewares/authMiddleware.js';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats,
} from '../controllers/expenseCategoryController.js';
import {
  validateCreateCategory,
  validateUpdateCategory,
  validateCategoryQuery,
} from '../validators/expenseCategoryValidators.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all categories (accessible to all authenticated users)
router.get('/', validateCategoryQuery, getAllCategories);

// Get category by ID
router.get('/:id', getCategoryById);

// Get category statistics (admin only)
router.get('/stats/categories', protectAdmin, getCategoryStats);

// Admin-only routes
router.use(protectAdmin);

// Create category
router.post('/', validateCreateCategory, createCategory);

// Update category
router.put('/:id', validateUpdateCategory, updateCategory);

// Delete category
router.delete('/:id', deleteCategory);

export default router;