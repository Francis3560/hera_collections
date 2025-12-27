// src/services/websocket.service.js
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

class WebSocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> Set of socketIds
  }

  /**
   * Initialize WebSocket service with HTTP server
   */
  initialize(server) {
    try {
      // Get allowed origins from environment or use defaults
      const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:8080'
      ];

      console.log('WebSocket allowed origins:', allowedOrigins);

      this.io = new Server(server, {
        cors: {
          origin: allowedOrigins,
          credentials: true
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000
      });

      this.setupMiddleware();
      this.setupEventHandlers();
      
      console.log('WebSocket server initialized successfully');
    } catch (error) {
      console.error('Error initializing WebSocket service:', error);
      throw error;
    }
  }

  /**
   * Setup authentication middleware
   */
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || 
                     socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          console.log('WebSocket connection attempt without token');
          return next(new Error('Authentication token required'));
        }

        // Get JWT secret from environment
        const jwtSecret = process.env.JWT_SECRET || 'your-fallback-secret-key-change-this';
        
        const decoded = jwt.verify(token, jwtSecret);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        
        next();
      } catch (error) {
        console.error('WebSocket authentication error:', error.message);
        
        // Provide more specific error messages
        let errorMessage = 'Authentication failed';
        if (error.name === 'TokenExpiredError') {
          errorMessage = 'Token expired';
        } else if (error.name === 'JsonWebTokenError') {
          errorMessage = 'Invalid token';
        }
        
        next(new Error(errorMessage));
      }
    });
  }

  /**
   * Setup WebSocket event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.userId} connected via WebSocket`);

      // Register user socket
      this.registerUserSocket(socket.userId, socket.id);

      // Join user-specific room
      socket.join(`user:${socket.userId}`);

      // Join admin room if user is admin
      if (socket.userRole === 'ADMIN') {
        socket.join('admin:room');
        console.log(`Admin ${socket.userId} joined admin room`);
      }

      // Handle heartbeat for connection monitoring
      socket.on('heartbeat', () => {
        socket.emit('heartbeat:ack', { timestamp: Date.now() });
      });

      // Handle notification read events
      socket.on('notification:read', (data) => {
        try {
          // Broadcast to other user sessions
          socket.to(`user:${socket.userId}`).emit('notification:read', data);
        } catch (error) {
          console.error('Error handling notification read:', error);
        }
      });

      // Handle order room joining
      socket.on('join:order', (orderId) => {
        socket.join(`order:${orderId}`);
        console.log(`User ${socket.userId} joined order room ${orderId}`);
      });

      // Handle chat room joining
      socket.on('join:chat', (chatId) => {
        socket.join(`chat:${chatId}`);
        console.log(`User ${socket.userId} joined chat room ${chatId}`);
      });

      // Handle user typing in chat
      socket.on('user:typing', (data) => {
        const { chatId, isTyping } = data;
        socket.to(`chat:${chatId}`).emit('user:typing', {
          userId: socket.userId,
          isTyping,
          timestamp: new Date().toISOString()
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected from WebSocket`);
        this.unregisterUserSocket(socket.userId, socket.id);
      });
    });
  }

  /**
   * Register a user's socket connection
   */
  registerUserSocket(userId, socketId) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(socketId);
  }

  /**
   * Unregister a user's socket connection
   */
  unregisterUserSocket(userId, socketId) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  /**
   * Send notification to specific user
   */
  async sendNotification(userId, notification) {
    if (!this.io) {
      console.warn('WebSocket service not initialized');
      return false;
    }

    try {
      this.io.to(`user:${userId}`).emit('notification:new', notification);
      console.log(`Notification sent to user ${userId}: ${notification.title}`);
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Send notification to all admins
   */
  async sendAdminNotification(notification) {
    if (!this.io) return false;

    try {
      this.io.to('admin:room').emit('notification:admin', {
        ...notification,
        isAdminNotification: true
      });
      console.log(`Admin notification sent: ${notification.title}`);
      return true;
    } catch (error) {
      console.error('Error sending admin notification:', error);
      return false;
    }
  }

  /**
   * Emit event to specific user
   */
  async emitToUser(userId, event, data) {
    if (!this.io) return false;
    
    try {
      this.io.to(`user:${userId}`).emit(event, data);
      return true;
    } catch (error) {
      console.error(`Error emitting to user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Emit event to all admins
   */
  async emitToAdmins(event, data) {
    if (!this.io) return false;
    
    try {
      this.io.to('admin:room').emit(event, data);
      return true;
    } catch (error) {
      console.error('Error emitting to admins:', error);
      return false;
    }
  }

  /**
   * Emit event to all connected users
   */
  async emitToAll(event, data) {
    if (!this.io) return false;
    
    try {
      this.io.emit(event, data);
      return true;
    } catch (error) {
      console.error('Error emitting to all:', error);
      return false;
    }
  }

  /**
   * Emit event to specific room
   */
  async emitToRoom(room, event, data) {
    if (!this.io) return false;
    
    try {
      this.io.to(room).emit(event, data);
      return true;
    } catch (error) {
      console.error(`Error emitting to room ${room}:`, error);
      return false;
    }
  }

  /**
   * Send order update to order room
   */
  async sendOrderUpdate(orderId, update) {
    return this.emitToRoom(`order:${orderId}`, 'order:update', update);
  }

  /**
   * Send chat message to chat room
   */
  async sendChatMessage(chatId, message) {
    return this.emitToRoom(`chat:${chatId}`, 'chat:message', message);
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId) {
    return this.userSockets.has(userId) && this.userSockets.get(userId).size > 0;
  }

  /**
   * Get number of connected users
   */
  getConnectedUsersCount() {
    return this.userSockets.size;
  }

  /**
   * Get total connection count
   */
  getTotalConnectionsCount() {
    let total = 0;
    for (const sockets of this.userSockets.values()) {
      total += sockets.size;
    }
    return total;
  }

  /**
   * Get user's connection count
   */
  getUserConnectionCount(userId) {
    return this.userSockets.get(userId)?.size || 0;
  }

  /**
   * Get list of connected user IDs
   */
  getConnectedUsers() {
    return Array.from(this.userSockets.keys());
  }

  /**
   * Broadcast message to all connected users
   */
  async broadcast(event, data) {
    return this.emitToAll(event, data);
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

// Export both the class and the singleton instance
export { WebSocketService, webSocketService };
export default webSocketService;