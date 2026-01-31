import express from 'express';
import reviewController from '../controllers/reviewController.js';
import { protect, protectAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/product/:productId', reviewController.getProductReviews);

// Protected routes (User)
router.post('/', protect, reviewController.createReview);

// Admin routes
router.get('/', protect, protectAdmin, reviewController.getAllReviews);
router.patch('/:id', protect, protectAdmin, reviewController.updateReview);
router.delete('/:id', protect, protectAdmin, reviewController.deleteReview);
router.patch('/:id/approve', protect, protectAdmin, reviewController.approveReview);
router.patch('/:id/publish', protect, protectAdmin, reviewController.publishReview);

export default router;
