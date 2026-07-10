import express from 'express';
import * as discountController from '../controllers/discountController.js';
import { protect, protectAdmin } from '../middlewares/authMiddleware.js';
import { validateCreateDiscount, validateUpdateDiscount } from '../validators/discountValidators.js';

const router = express.Router();

// Public routes
router.get('/', discountController.getAllDiscounts);
router.get('/:id', discountController.getDiscountById);

// Protect all routes with authentication and admin role
router.use(protect);
router.use(protectAdmin);

router.post('/', validateCreateDiscount, discountController.createDiscount);
router.put('/:id', validateUpdateDiscount, discountController.updateDiscount);
router.delete('/:id', discountController.deleteDiscount);

export default router;
