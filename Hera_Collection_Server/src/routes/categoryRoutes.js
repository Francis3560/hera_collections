// routes/categoryRoutes.js
import express from 'express';
import {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { protect, protectAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.get('/', getAllCategories);
router.get('/:id', getCategory);
router.use(protect, protectAdmin);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;