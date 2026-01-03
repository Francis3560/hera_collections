// src/controllers/notificationController.js
import notificationService from '../services/notification.service.js';

/**
 * GET /notifications
 */
export const getMyNotifications = async (req, res) => {
  try {
    const { page, limit, unreadOnly } = req.query;
    const result = await notificationService.getUserNotifications(req.user.id, {
      page,
      limit,
      unreadOnly: unreadOnly === 'true'
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

/**
 * PATCH /notifications/:id/read
 */
export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.markAsRead(id, req.user.id);
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notification' });
  }
};

/**
 * PATCH /notifications/read-all
 */
export const markAllRead = async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notifications' });
  }
};

/**
 * DELETE /notifications/:id
 */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await notificationService.deleteNotification(id, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete notification' });
  }
};
