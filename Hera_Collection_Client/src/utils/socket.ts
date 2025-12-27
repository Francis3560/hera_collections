// src/utils/socket.ts
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;

  connect() {
    if (this.socket) return this.socket;

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    
    this.socket = io(API_BASE_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to WebSocket server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from WebSocket server:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinAdminRoom() {
    if (this.socket) {
      this.socket.emit('admin_join', 'admin_dashboard');
    }
  }

  joinChat(sessionId: string) {
    if (this.socket) {
      this.socket.emit('join_chat', sessionId);
    }
  }

  leaveChat(sessionId: string) {
    if (this.socket) {
      this.socket.emit('leave_chat', sessionId);
    }
  }

  startTyping(sessionId: string, userType: 'visitor' | 'admin') {
    if (this.socket) {
      this.socket.emit('typing_start', { sessionId, userType });
    }
  }

  stopTyping(sessionId: string, userType: 'visitor' | 'admin') {
    if (this.socket) {
      this.socket.emit('typing_stop', { sessionId, userType });
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  get connected() {
    return this.isConnected;
  }
}

export const socketService = new SocketService();