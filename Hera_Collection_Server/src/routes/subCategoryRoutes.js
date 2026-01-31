import express from 'express';
import {
  getAllSubCategories,
  getSubCategoryBySlug,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  upload
} from '../controllers/subCategoryController.js';
import { protect, protectAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getAllSubCategories);
router.get('/slug/:slug', getSubCategoryBySlug);

// Admin only routes
router.use(protect, protectAdmin);
router.post('/', upload.single('coverPhoto'), createSubCategory);
router.put('/:id', upload.single('coverPhoto'), updateSubCategory);
router.delete('/:id', deleteSubCategory);

export default router;
