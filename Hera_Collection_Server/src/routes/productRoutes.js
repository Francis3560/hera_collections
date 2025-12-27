import express from 'express';
import {
  getProductsController,
  getProductController,
  createProductController,
  updateProductController,
  deleteProductController,
  getProductsBySellerController,
  getProductsByCategoryController,
} from '../controllers/productController.js';
import { 
  protect, 
  requireRoles,
  protectAdmin 
} from '../middlewares/authMiddleware.js';
import { 
  checkProductExists, 
  checkProductOwnership 
} from '../middlewares/productMiddleware.js';

const router = express.Router();

router.get('/', getProductsController);
router.get('/:id', getProductController);
router.get('/seller/:sellerId', getProductsBySellerController);
router.get('/category/:categoryId', getProductsByCategoryController);

router.use(protect);

router.post('/', requireRoles('ADMIN', 'USER'), createProductController);

router.put('/:id', checkProductExists, checkProductOwnership, updateProductController);
router.delete('/:id', checkProductExists, checkProductOwnership, deleteProductController);

export default router;