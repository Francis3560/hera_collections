import express from 'express';
import { protect, protectAdmin, requireRoles, requireVerified } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import {
  getNotificationsController,
  getUnreadCountController,
  markAsReadController,
  markAllAsReadController,
  deleteNotificationsController,
  createNotificationController,
  getNotificationStatsController,
  cleanupExpiredNotificationsController
} from '../controllers/notification.controller.js';
import {
  notificationFilterValidator,
  markAsReadValidator,
  deleteNotificationValidator,
  createNotificationValidator
} from '../validators/notification.validator.js';

const router = express.Router();
router.use(protect);

router.get(
  '/',
  requireVerified,
  validateRequest(notificationFilterValidator, 'query'),
  getNotificationsController
);
router.get(
  '/unread/count',
  requireVerified,
  getUnreadCountController
);
router.patch(
  '/read',
  requireVerified,
  validateRequest(markAsReadValidator),
  markAsReadController
);
router.patch(
  '/read/all',
  requireVerified,
  markAllAsReadController
);
router.delete(
  '/',
  requireVerified,
  validateRequest(deleteNotificationValidator),
  deleteNotificationsController
);
router.post(
  '/admin',
  protectAdmin,
  validateRequest(createNotificationValidator),
  createNotificationController
);

router.get(
  '/admin/stats',
  protectAdmin,
  getNotificationStatsController
);

router.post(
  '/admin/cleanup',
  protectAdmin,
  cleanupExpiredNotificationsController
);

export default router;