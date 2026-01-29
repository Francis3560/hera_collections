import express from 'express';
import * as shippingController from '../controllers/shippingController.js';
import { protect, requireRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public route to fetch regions (used in checkout)
router.get('/', shippingController.getAllRegions);

// Admin-only routes for CRUD
router.get('/:id', protect, requireRoles('ADMIN'), shippingController.getRegionById);
router.post('/', protect, requireRoles('ADMIN'), shippingController.createRegion);
router.patch('/:id', protect, requireRoles('ADMIN'), shippingController.updateRegion);
router.delete('/:id', protect, requireRoles('ADMIN'), shippingController.deleteRegion);

export default router;
