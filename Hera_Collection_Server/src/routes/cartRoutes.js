import express from 'express';
import * as cartController from '../controllers/cartController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect); // Require login for all cart operations

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.patch('/item/:id', cartController.updateCartItem);
router.delete('/item/:id', cartController.removeCartItem);
router.delete('/', cartController.clearCart);
router.post('/checkout', cartController.checkout);

export default router;
