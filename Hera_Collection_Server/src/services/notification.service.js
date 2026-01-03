// src/services/notification.service.js
import prisma from '../database.js'; // Use shared prisma instance
import webSocketService from './websocket.service.js';

class NotificationService {
  /**
   * Create a notification and send it via WebSocket
   */
  static async createNotification(data) {
    try {
      const { 
        userId, 
        type, 
        title, 
        message, 
        link, 
        entityId, 
        entityType, 
        metadata,
        priority = 'MEDIUM'
      } = data;

      // 1. Save to Database
      const notification = await prisma.notification.create({
        data: {
          userId: Number(userId),
          type,
          title,
          message,
          link,
          entityId: entityId?.toString(),
          entityType,
          metadata: metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null,
          isRead: false
        }
      });

      // 2. Send via Real-time WebSocket
      await webSocketService.sendNotification(userId, notification);

      // 3. If it's an important system/admin notification, broadcast to admins too
      const isAdminType = [
        'ORDER_PLACED', 
        'STOCK_LOW', 
        'STOCK_OUT', 
        'PAYMENT_FAILED', 
        'SYSTEM_ALERT'
      ].includes(type);

      if (isAdminType) {
        await webSocketService.sendAdminNotification(notification);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(userId, filters = {}) {
    const { page = 1, limit = 20, unreadOnly = false, type } = filters;
    const skip = (page - 1) * limit;

    const where = { userId: Number(userId) };
    if (unreadOnly) where.isRead = false;
    if (type) where.type = type;

    try {
      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.notification.count({ where })
      ]);

      const unreadCount = await prisma.notification.count({
        where: { userId: Number(userId), isRead: false }
      });

      return {
        notifications,
        pagination: {
          total,
          page: Number(page),
          totalPages: Math.ceil(total / limit),
          limit: Number(limit)
        },
        unreadCount
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(userId) {
    return await prisma.notification.count({
      where: { userId: Number(userId), isRead: false }
    });
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(userId, notificationIds) {
    try {
      const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
      
      const result = await prisma.notification.updateMany({
        where: { 
          id: { in: ids.map(id => Number(id)) },
          userId: Number(userId) 
        },
        data: { isRead: true }
      });

      // Notify user sessions
      await webSocketService.emitToUser(userId, 'notifications:updated', { 
        ids, 
        isRead: true 
      });

      return result;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for user
   */
  static async markAllAsRead(userId) {
    try {
      const result = await prisma.notification.updateMany({
        where: { userId: Number(userId), isRead: false },
        data: { isRead: true }
      });

      // Notify user sessions
      await webSocketService.emitToUser(userId, 'notifications:marked_all_read', { userId });

      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notifications
   */
  static async deleteNotifications(userId, notificationIds) {
    try {
      const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
      
      const result = await prisma.notification.deleteMany({
        where: { 
          id: { in: ids.map(id => Number(id)) },
          userId: Number(userId) 
        }
      });

      return result;
    } catch (error) {
      console.error('Error deleting notifications:', error);
      throw error;
    }
  }

  /**
   * Cleanup expired or old read notifications
   */
  static async cleanupExpiredNotifications(days = 30) {
    const date = new Date();
    date.setDate(date.getDate() - days);

    try {
      const result = await prisma.notification.deleteMany({
        where: {
          OR: [
            { createdAt: { lt: date }, isRead: true },
            // Could add explicit expiry date logic if needed
          ]
        }
      });
      return result;
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      throw error;
    }
  }

  /**
   * Check for low stock items and notify the user
   * Designed to be called at login for admins
   */
  static async checkLowStockAndNotify(userId) {
    try {
      // 1. Find variants with stock < 5
      const lowStockVariants = await prisma.productVariant.findMany({
        where: {
          stock: { lt: 5 },
          isActive: true
        },
        include: {
          product: {
            select: { title: true }
          }
        }
      });

      if (lowStockVariants.length === 0) return;

      // 2. Create/Update notifications for each
      for (const variant of lowStockVariants) {
        const title = 'Low Stock Alert';
        const message = `Product "${variant.product.title}" (SKU: ${variant.sku || 'N/A'}) is running low on stock. Current: ${variant.stock}`;
        
        // We check if an unread notification for this specific variant already exists
        const existing = await prisma.notification.findFirst({
          where: {
            userId: Number(userId),
            type: 'STOCK_LOW',
            entityId: variant.id.toString(),
            isRead: false
          }
        });

        if (existing) {
          // Update the timestamp to bring it to the top for the new "session"
          await prisma.notification.update({
            where: { id: existing.id },
            data: { 
              createdAt: new Date(),
              message // Update message in case stock changed
            }
          });
          
          // Still emit via websocket to alert the current session
          await webSocketService.sendNotification(userId, { ...existing, createdAt: new Date(), message });
        } else {
          // Create new one
          await this.createNotification({
            userId,
            type: 'STOCK_LOW',
            title,
            message,
            link: `/admin/inventory/movements`, // Or a specific link if available
            entityId: variant.id,
            entityType: 'PRODUCT_VARIANT',
            priority: 'HIGH'
          });
        }
      }
    } catch (error) {
      console.error('Error in checkLowStockAndNotify:', error);
    }
  }
}

export { NotificationService };
export default NotificationService;