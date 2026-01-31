// src/api/inquiry.service.ts
import axiosClient from '../utils/axiosClient';

export interface InquiryMessage {
  id: number;
  sessionId: string;
  senderId?: number;
  isFromAdmin: boolean;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface InquirySession {
  id: string;
  userId?: number;
  guestId?: string;
  guestName?: string;
  guestEmail?: string;
  status: 'OPEN' | 'CLOSED';
  messages: InquiryMessage[];
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
    picture?: string;
  };
}

class InquiryService {
  /**
   * Initialize a session for user or guest
   */
  async getOrCreateSession(data: { guestId?: string; guestName?: string; guestEmail?: string }): Promise<InquirySession> {
    const response = await axiosClient.post('/inquiries/session', data);
    return response.data;
  }

  /**
   * User/Guest sends a message
   */
  async sendMessage(sessionId: string, content: string): Promise<InquiryMessage> {
    const response = await axiosClient.post('/inquiries/message', { sessionId, content });
    return response.data;
  }

  /**
   * Admin: Get all active inquiry sessions
   */
  async getActiveInquiries(): Promise<InquirySession[]> {
    const response = await axiosClient.get('/inquiries/active');
    return response.data;
  }

  /**
   * Admin: Send a reply to an inquiry
   */
  async adminReply(sessionId: string, content: string): Promise<InquiryMessage> {
    const response = await axiosClient.post('/inquiries/reply', { sessionId, content });
    return response.data;
  }

  /**
   * Admin/User: Get full message history for a session
   */
  async getMessages(sessionId: string): Promise<InquirySession> {
    const response = await axiosClient.get(`/inquiries/${sessionId}/messages`);
    return response.data;
  }

  /**
   * Admin: Close a session
   */
  async closeSession(sessionId: string): Promise<any> {
    const response = await axiosClient.delete(`/inquiries/${sessionId}`);
    return response.data;
  }
}

export const inquiryService = new InquiryService();
export default inquiryService;
