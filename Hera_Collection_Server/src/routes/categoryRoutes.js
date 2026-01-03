// routes/categoryRoutes.js
import express from 'express';
import {
  getAllCategories,
  getCategory,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  upload,
} from '../controllers/categoryController.js';
import { protect, protectAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.get('/', getAllCategories);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:id', getCategory);
router.use(protect, protectAdmin);
router.post('/', upload.single('coverPhoto'), createCategory);
router.put('/:id', upload.single('coverPhoto'), updateCategory);
router.delete('/:id', deleteCategory);

export default router;