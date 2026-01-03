// src/api/notification.service.ts
import axiosClient from '../utils/axiosClient';

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  entityId?: string;
  entityType?: string;
  metadata?: string;
  createdAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
  unreadCount: number;
}

class NotificationService {
  async getMyNotifications(params = {}): Promise<NotificationResponse> {
    const response = await axiosClient.get('/notifications', { params });
    return response.data;
  }

  async markAsRead(notificationIds: number | number[]): Promise<any> {
    const response = await axiosClient.patch('/notifications/read', { notificationIds });
    return response.data;
  }

  async markAllAsRead(): Promise<any> {
    const response = await axiosClient.patch('/notifications/read/all');
    return response.data;
  }

  async deleteNotifications(notificationIds: number | number[]): Promise<any> {
    const response = await axiosClient.delete('/notifications', { data: { notificationIds } });
    return response.data;
  }

  async getUnreadCount(): Promise<number> {
    const response = await axiosClient.get('/notifications/unread/count');
    return response.data.count;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
