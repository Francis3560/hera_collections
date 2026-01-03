// src/utils/socket.ts
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;

  connect(token?: string) {
    if (this.socket && this.isConnected) return this.socket;

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    
    // Disconnect existing if any
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(API_BASE_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined
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

  // Generic event listeners
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

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
export default socketService;