// src/routes/notificationRoutes.js
import express from 'express';
import { 
  getMyNotifications, 
  markNotificationRead, 
  markAllRead, 
  deleteNotification 
} from '../controllers/notificationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All notification routes are protected
router.use(protect);

router.get('/', getMyNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markNotificationRead);
router.delete('/:id', deleteNotification);

export default router;
