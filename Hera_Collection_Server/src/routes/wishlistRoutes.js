import express from 'express';
import {
  getWishlistController,
  addToWishlistController,
  removeFromWishlistController
} from '../controllers/wishlistController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getWishlistController);
router.post('/', addToWishlistController);
router.delete('/:id', removeFromWishlistController);

export default router;
