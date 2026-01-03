import { NotificationService } from '../services/notification.service.js';
import {
  notificationFilterValidator,
  markAsReadValidator,
  deleteNotificationValidator
} from '../validators/notification.validator.js';
export const getNotificationsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { error, value } = notificationFilterValidator.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map(d => d.message).join(', ')
      });
    }

    const result = await NotificationService.getUserNotifications(userId, value);
    
    res.status(200).json({
      success: true,
      notifications: result.notifications,
      pagination: result.pagination,
      unreadCount: result.unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};
export const getUnreadCountController = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await NotificationService.getUnreadCount(userId);
    
    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
};
export const markAsReadController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { error, value } = markAsReadValidator.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map(d => d.message).join(', ')
      });
    }

    const result = await NotificationService.markAsRead(userId, value.notificationIds);
    
    res.status(200).json({
      success: true,
      message: `Marked ${result.count} notification(s) as read`
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read'
    });
  }
};

export const markAllAsReadController = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await NotificationService.markAllAsRead(userId);
    
    res.status(200).json({
      success: true,
      message: `Marked all ${result.count} notification(s) as read`
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
};

export const deleteNotificationsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { error, value } = deleteNotificationValidator.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map(d => d.message).join(', ')
      });
    }

    const result = await NotificationService.deleteNotifications(userId, value.notificationIds);
    
    res.status(200).json({
      success: true,
      message: `Deleted ${result.count} notification(s)`
    });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notifications'
    });
  }
};

export const createNotificationController = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can create notifications'
      });
    }
    const { error, value } = createNotificationValidator.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map(d => d.message).join(', ')
      });
    }

    const notification = await NotificationService.createNotification(value);
    
    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
};
export const getNotificationStatsController = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view notification statistics'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        totalNotifications: 1500,
        unreadCount: 42,
        byType: {
          ORDER_SUBMITTED: 300,
          PAYMENT_SUCCESS: 250,
          STOCK_LOW: 50
        },
        today: {
          created: 15,
          read: 20
        }
      }
    });
  } catch (error) {
    console.error('Error getting notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification statistics'
    });
  }
};
export const cleanupExpiredNotificationsController = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can cleanup notifications'
      });
    }

    const result = await NotificationService.cleanupExpiredNotifications();
    
    res.status(200).json({
      success: true,
      message: `Cleaned up ${result.count} expired notifications`
    });
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup notifications'
    });
  }
};