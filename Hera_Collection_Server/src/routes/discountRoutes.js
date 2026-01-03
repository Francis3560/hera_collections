import express from 'express';
import * as discountController from '../controllers/discountController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Protect all routes with authentication and admin role
router.use(authenticateToken); 
router.use(authorizeRoles('ADMIN'));

router.post('/', discountController.createDiscount);
router.get('/', discountController.getAllDiscounts);
router.get('/:id', discountController.getDiscountById);
router.put('/:id', discountController.updateDiscount);
router.delete('/:id', discountController.deleteDiscount);

export default router;
