// src/context/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService, Notification } from '../api/notification.service';
import { socketService } from '../utils/socket';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (ids: number | number[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotifications: (ids: number | number[]) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await notificationService.getMyNotifications({ limit: 50 });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const markAsRead = async (ids: number | number[]) => {
    try {
      await notificationService.markAsRead(ids);
      const idArray = Array.isArray(ids) ? ids : [ids];
      
      setNotifications(prev => 
        prev.map(n => idArray.includes(n.id) ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - idArray.length));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotifications = async (ids: number | number[]) => {
    try {
      await notificationService.deleteNotifications(ids);
      const idArray = Array.isArray(ids) ? ids : [ids];
      setNotifications(prev => prev.filter(n => !idArray.includes(n.id)));
      
      // Recollect unread count if we deleted unread ones
      const wasUnreadDeleted = idArray.some(id => 
        notifications.find(n => n.id === id && !n.isRead)
      );
      if (wasUnreadDeleted) {
        setUnreadCount(prev => Math.max(0, prev - 1)); // This is approximate, better to recount
      }
    } catch (error) {
      console.error('Failed to delete notifications:', error);
    }
  };

  // WebSocket Setup
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Connect to socket with token
      const token = localStorage.getItem('hera_accessToken');
      const socket = socketService.connect(token || undefined);

      if (socket) {
        // Listen for new notifications
        socketService.on('notification:new', (notification: Notification) => {
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Display toast
          toast(notification.title, {
            description: notification.message,
            action: {
              label: 'View',
              onClick: () => {
                if (notification.link) {
                   // Handle navigation
                   window.location.href = notification.link;
                }
              }
            }
          });
        });

        // Listen for stock updates
        socketService.on('stock:update', (data: { variantId: number, productId: number, newStock: number }) => {
          console.log('Real-time stock update received:', data);
          // Invalidate product-related queries to refresh UI
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['product', data.productId] });
          queryClient.invalidateQueries({ queryKey: ['variants', data.productId] });
          queryClient.invalidateQueries({ queryKey: ['stock'] });
        });

        // Listen for updates (e.g. marked as read in another tab)
        socketService.on('notifications:updated', (data: { ids: number[], isRead: boolean }) => {
          if (data.isRead) {
            setNotifications(prev => 
              prev.map(n => data.ids.includes(n.id) ? { ...n, isRead: true } : n)
            );
            // Refresh unread count to be accurate
            notificationService.getUnreadCount().then(setUnreadCount);
          }
        });

        socketService.on('notifications:marked_all_read', () => {
          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
          setUnreadCount(0);
        });

        // Admin notifications
        if (user.role === 'ADMIN') {
          socketService.on('notification:admin', (notification: Notification) => {
             // Handle admin specific toast if different
             toast.info(`Admin: ${notification.title}`, {
                description: notification.message
             });
          });
        }
      }

      fetchNotifications();

      return () => {
        socketService.off('notification:new');
        socketService.off('stock:update');
        socketService.off('notifications:updated');
        socketService.off('notifications:marked_all_read');
        socketService.off('notification:admin');
        socketService.disconnect();
      };
    }
  }, [isAuthenticated, user, fetchNotifications, queryClient]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
