import prisma from '../database.js';
import { WebSocketService } from '../services/websocket.service.js';
import { NotificationTypes, NotificationPriorities } from '../types/notification.types.js';

export class NotificationService {

  static async createNotification(data) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data || {},
          relatedEntity: data.relatedEntity,
          relatedEntityId: data.relatedEntityId,
          priority: data.priority || NotificationPriorities.MEDIUM,
          expiresAt: data.expiresAt
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true
            }
          }
        }
      });

      await this.emitRealTimeNotification(notification);

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }
  static async getUserNotifications(userId, filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        unreadOnly = false,
        priority,
        type,
        startDate,
        endDate
      } = filters;

      const skip = (page - 1) * limit;
      const where = { userId };

      if (unreadOnly) {
        where.isRead = false;
      }

      if (priority) {
        where.priority = priority;
      }

      if (type) {
        where.type = type;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ];

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                picture: true
              }
            }
          }
        }),
        prisma.notification.count({ where })
      ]);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasMore: total > page * limit
        }
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  static async markAsRead(userId, notificationIds) {
    try {
      const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
      
      const updated = await prisma.notification.updateMany({
        where: {
          id: { in: ids },
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      if (updated.count > 0) {
        await WebSocketService.emitToUser(userId, 'notifications:read', {
          notificationIds: ids,
          readAt: new Date()
        });
      }

      return updated;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }
  static async markAllAsRead(userId) {
    try {
      const updated = await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      if (updated.count > 0) {
        await WebSocketService.emitToUser(userId, 'notifications:all-read', {
          count: updated.count,
          readAt: new Date()
        });
      }

      return updated;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  static async deleteNotifications(userId, notificationIds) {
    try {
      const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
      
      const deleted = await prisma.notification.deleteMany({
        where: {
          id: { in: ids },
          userId
        }
      });

      if (deleted.count > 0) {
        await WebSocketService.emitToUser(userId, 'notifications:deleted', {
          notificationIds: ids
        });
      }

      return deleted;
    } catch (error) {
      console.error('Error deleting notifications:', error);
      throw error;
    }
  }
  static async getUnreadCount(userId) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          isRead: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      });

      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  static async cleanupExpiredNotifications() {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      });

      console.log(`Cleaned up ${result.count} expired notifications`);
      return result;
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw error;
    }
  }
  static async createPasswordChangedNotification(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    return this.createNotification({
      userId,
      type: NotificationTypes.PASSWORD_CHANGED,
      title: 'Password Changed',
      message: 'Your password was successfully changed.',
      priority: NotificationPriorities.HIGH,
      data: {
        changedAt: new Date(),
        ipAddress: null 
      }
    });
  }

  static async createPasswordResetNotification(userId) {
    return this.createNotification({
      userId,
      type: NotificationTypes.PASSWORD_RESET,
      title: 'Password Reset',
      message: 'Your password has been reset successfully.',
      priority: NotificationPriorities.HIGH
    });
  }

  static async createPaymentMethodAddedNotification(userId, paymentMethod) {
    return this.createNotification({
      userId,
      type: NotificationTypes.PAYMENT_METHOD_ADDED,
      title: 'Payment Method Added',
      message: `New ${paymentMethod} payment method was added to your account.`,
      priority: NotificationPriorities.MEDIUM,
      data: { paymentMethod, addedAt: new Date() }
    });
  }

  static async createShippingInfoUpdatedNotification(userId) {
    return this.createNotification({
      userId,
      type: NotificationTypes.SHIPPING_INFO_UPDATED,
      title: 'Shipping Information Updated',
      message: 'Your shipping information has been updated successfully.',
      priority: NotificationPriorities.LOW,
      data: { updatedAt: new Date() }
    });
  }

  static async createOrderSubmittedNotification(userId, orderId, orderNumber) {
    return this.createNotification({
      userId,
      type: NotificationTypes.ORDER_SUBMITTED,
      title: 'Order Submitted',
      message: `Your order #${orderNumber} has been submitted successfully.`,
      relatedEntity: 'ORDER',
      relatedEntityId: orderId,
      priority: NotificationPriorities.HIGH,
      data: { orderId, orderNumber, submittedAt: new Date() }
    });
  }

  static async createOrderShippedNotification(userId, orderId, trackingNumber) {
    return this.createNotification({
      userId,
      type: NotificationTypes.ORDER_SHIPPED,
      title: 'Order Shipped',
      message: `Your order has been shipped. Tracking number: ${trackingNumber}`,
      relatedEntity: 'ORDER',
      relatedEntityId: orderId,
      priority: NotificationPriorities.HIGH,
      data: { orderId, trackingNumber, shippedAt: new Date() }
    });
  }

  static async createPaymentSuccessfulNotification(userId, orderId, amount) {
    return this.createNotification({
      userId,
      type: NotificationTypes.PAYMENT_SUCCESS,
      title: 'Payment Successful',
      message: `Your payment of KES ${amount} was processed successfully.`,
      relatedEntity: 'ORDER',
      relatedEntityId: orderId,
      priority: NotificationPriorities.HIGH,
      data: { orderId, amount, paidAt: new Date() }
    });
  }

  static async createLowStockNotification(userId, productId, productName, currentStock) {
    return this.createNotification({
      userId,
      type: NotificationTypes.LOW_STOCK,
      title: 'Low Stock Alert',
      message: `${productName} is running low on stock (${currentStock} units remaining).`,
      relatedEntity: 'PRODUCT',
      relatedEntityId: productId,
      priority: NotificationPriorities.URGENT,
      data: { productId, productName, currentStock, alertAt: new Date() }
    });
  }


  static async emitRealTimeNotification(notification) {
    try {
      await WebSocketService.emitToUser(notification.userId, 'notification:new', notification);
    
      if (this.shouldNotifyAdmins(notification.type)) {
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true }
        });
        
        for (const admin of admins) {
          await WebSocketService.emitToUser(admin.id, 'notification:admin', {
            ...notification,
            isAdminNotification: true
          });
        }
      }
    } catch (error) {
      console.error('Error emitting real-time notification:', error);
    }
  }

  static shouldNotifyAdmins(type) {
    const adminNotificationTypes = [
      NotificationTypes.NEW_ORDER,
      NotificationTypes.NEW_USER_REGISTERED,
      NotificationTypes.SYSTEM_ALERT,
      NotificationTypes.LOW_STOCK,
      NotificationTypes.OUT_OF_STOCK
    ];
    
    return adminNotificationTypes.includes(type);
  }
}