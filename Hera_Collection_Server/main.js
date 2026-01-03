// main.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

// Import routes
import productRoutes from './src/routes/productRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import verificationRoutes from './src/routes/verificationRoutes.js';
import categoryRoutes from './src/routes/categoryRoutes.js';
import expenseRoutes from './src/routes/expenseRoutes.js';
import expenseCategoryRoutes from './src/routes/expenseCategoryRoutes.js';
import stockRoutes from './src/routes/stockRoutes.js';
import passwordResetRoutes from './src/routes/passwordResetRoutes.js';
import notificationRoutes from './src/routes/notification.routes.js';
import cartRoutes from './src/routes/cartRoutes.js';
import wishlistRoutes from './src/routes/wishlistRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';
import discountRoutes from './src/routes/discountRoutes.js';

// Import services and utilities
import { webSocketService } from './src/services/websocket.service.js';
import { initializeCronJobs } from './src/utils/cronJobs.js';
import prisma from './src/database.js';

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Create HTTP server for WebSocket support
const server = http.createServer(app);

// Configure CORS origins
const allowedOrigins = (process.env.CORS_ORIGIN?.split(',') || [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
  'https://fe57a8df039c.ngrok-free.app',
]).map(s => s.trim()).filter(Boolean);

// CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Express middleware
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom Morgan format to match your logs exactly
morgan.token('custom-time', (req, res) => {
  const time = parseFloat(res.get('X-Response-Time')) || 0;
  return `${time.toFixed(3)} ms`;
});

morgan.token('custom-size', (req, res) => {
  const size = res.get('Content-Length') || '0';
  return size;
});

const morganFormat = ':method :url :status :custom-time - :custom-size';
app.use(morgan(morganFormat));

// Initialize cron jobs FIRST (to show logs before server start)
initializeCronJobs();

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Initialize WebSocket service
webSocketService.initialize(io);

// WebSocket authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || 
                 socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(token, jwtSecret);
    
    if (!decoded || !decoded.id || !decoded.role) {
      return next(new Error('Invalid token payload'));
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        status: true,
        lockedUntil: true,
        deletedAt: true,
      },
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    if (user.deletedAt) {
      return next(new Error('Account has been deleted'));
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return next(new Error('Account is locked'));
    }

    socket.userId = user.id;
    socket.userEmail = user.email;
    socket.userRole = user.role;
    socket.isVerified = user.isVerified;

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        status: 'ONLINE',
        lastSeen: new Date()
      }
    }).catch(err => console.error('Failed to update user status:', err));

    next();
  } catch (error) {
    let errorMessage = 'Authentication failed';
    if (error.name === 'TokenExpiredError') {
      errorMessage = 'Token expired';
    } else if (error.name === 'JsonWebTokenError') {
      errorMessage = 'Invalid token';
    }
    
    next(new Error(errorMessage));
  }
});

// WebSocket connection handler
io.on('connection', (socket) => {
  webSocketService.registerUserSocket(socket.userId, socket.id);
  socket.join(`user:${socket.userId}`);
  
  if (socket.userRole === 'ADMIN') {
    socket.join('admin:room');
  }
  
  socket.on('heartbeat', () => {
    socket.emit('heartbeat:ack', { 
      timestamp: Date.now(),
      userId: socket.userId
    });
  });
  
  socket.on('notification:read', (data) => {
    try {
      socket.to(`user:${socket.userId}`).emit('notification:read', data);
    } catch (error) {
      console.error('Error handling notification read:', error);
    }
  });
  
  socket.on('join:order', (orderId) => {
    socket.join(`order:${orderId}`);
  });
  
  socket.on('leave:order', (orderId) => {
    socket.leave(`order:${orderId}`);
  });
  
  socket.on('join:chat', (chatId) => {
    socket.join(`chat:${chatId}`);
  });
  
  socket.on('user:typing', (data) => {
    const { chatId, isTyping } = data;
    socket.to(`chat:${chatId}`).emit('user:typing', {
      userId: socket.userId,
      isTyping,
      timestamp: new Date().toISOString()
    });
  });
  
  socket.on('disconnect', () => {
    webSocketService.unregisterUserSocket(socket.userId, socket.id);
    
    setTimeout(async () => {
      const isStillConnected = webSocketService.isUserConnected(socket.userId);
      
      if (!isStillConnected) {
        await prisma.user.update({
          where: { id: socket.userId },
          data: { status: 'OFFLINE' }
        }).catch(err => {});
        
        if (socket.userRole === 'ADMIN') {
          io.to('admin:room').emit('admin:offline', {
            userId: socket.userId,
            email: socket.userEmail,
            timestamp: new Date().toISOString()
          });
        }
      }
    }, 5000);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/expense-categories', expenseCategoryRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/discounts', discountRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Global error handler (minimal logging)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    message,
  });
});

// Start server
const port = process.env.PORT || 8080;

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Export for testing
export { app, server, io };