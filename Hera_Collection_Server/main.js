// main.js - refreshed to pick up env changes
import 'dotenv/config';
import cluster from 'cluster';
import os from 'os';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { setupMaster, setupWorker } from '@socket.io/sticky';
import { createAdapter } from '@socket.io/redis-adapter';
import { config } from './src/configs/config.js';
import { apiLimiter } from './src/middlewares/rateLimiter.js';
import { redis } from './src/utils/redisClient.js';

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
import shippingRoutes from './src/routes/shippingRoutes.js';
import subCategoryRoutes from './src/routes/subCategoryRoutes.js';
import inquiryRoutes from './src/routes/inquiryRoutes.js';
import contactRoutes from './src/routes/contactRoutes.js';
import reviewRoutes from './src/routes/reviewRoutes.js';


// Import services and utilities
import { webSocketService } from './src/services/websocket.service.js';
import { initializeCronJobs } from './src/utils/cronJobs.js';
import prisma from './src/database.js';

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fail fast on missing critical configuration instead of silently falling back
// to weak defaults (e.g. a hardcoded JWT secret) at request time.
function validateEnv() {
  const missing = [];
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
  if (!process.env.REFRESH_TOKEN_SECRET) missing.push('REFRESH_TOKEN_SECRET');
  if (!process.env.DATABASE_URL) missing.push('DATABASE_URL');
  if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGIN) {
    missing.push('CORS_ORIGIN');
  }

  if (missing.length > 0) {
    console.error(`Missing required environment variable(s): ${missing.join(', ')}`);
    process.exit(1);
  }
}

validateEnv();

const port = process.env.PORT || 8080;
// Clustering is on by default (uses all CPU cores on this box) — set
// ENABLE_CLUSTER=false to run as a single process (e.g. under an orchestrator
// that already replicates pods/containers and manages restarts itself).
const CLUSTER_ENABLED = process.env.ENABLE_CLUSTER !== 'false';
const NUM_WORKERS = parseInt(process.env.CLUSTER_WORKERS, 10) || os.cpus().length;

if (CLUSTER_ENABLED && cluster.isPrimary) {
  // Primary process: only routes incoming connections to workers (sticky, by
  // IP hash) and forks/respawns them. It does not run Express itself.
  console.log(`Primary ${process.pid} starting ${NUM_WORKERS} worker(s)...`);

  const primaryServer = http.createServer();
  setupMaster(primaryServer, { loadBalancingMethod: 'least-connection' });
  cluster.setupPrimary({ serialization: 'advanced' });

  for (let i = 0; i < NUM_WORKERS; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.error(`Worker ${worker.process.pid} exited (code=${code}, signal=${signal}). Forking a replacement.`);
    cluster.fork();
  });

  primaryServer.listen(port, () => {
    console.log(`Primary listening on http://localhost:${port} (routing to workers)`);
  });

  // Cron jobs must run exactly once regardless of worker count.
  initializeCronJobs();

  let primaryShuttingDown = false;
  async function shutdownPrimary(signal) {
    if (primaryShuttingDown) return;
    primaryShuttingDown = true;
    console.log(`${signal} received on primary. Shutting down workers...`);
    for (const id in cluster.workers) {
      cluster.workers[id].process.kill(signal);
    }
    primaryServer.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  }
  process.on('SIGTERM', () => shutdownPrimary('SIGTERM'));
  process.on('SIGINT', () => shutdownPrimary('SIGINT'));
} else {
  runWorker();
}

function runWorker() {
  // Initialize Express app
  const app = express();

  // Trust proxy: OFF by default (safe for direct exposure). When deployed
  // behind a reverse proxy/load balancer/CDN, set TRUST_PROXY to the number of
  // hops to trust (e.g. "1" for a single nginx/ALB in front) so req.ip and the
  // rate limiters key on the real client IP from X-Forwarded-For instead of
  // the proxy's IP — and so that IS actually verified, since blindly trusting
  // it without a proxy in front lets a client spoof X-Forwarded-For to dodge
  // rate limits entirely.
  if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', true);
  } else if (process.env.TRUST_PROXY) {
    const hops = parseInt(process.env.TRUST_PROXY, 10);
    if (!Number.isNaN(hops)) app.set('trust proxy', hops);
  }

  // Create HTTP server for WebSocket support
  const server = http.createServer(app);

  // Configure CORS origins (dev-only fallback list; production requires CORS_ORIGIN, enforced in validateEnv)
  const allowedOrigins = (process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8080',
  ]).map(s => s.trim()).filter(Boolean);

  // Security headers. This server is primarily a JSON API (CSP doesn't affect
  // cross-origin fetches from the separately-deployed SPA frontend) but also has
  // a static dist/index.html fallback for production, so a moderate policy is
  // applied rather than leaving CSP off entirely. Loosen script-src/style-src
  // here if that fallback SPA turns out to need it.
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow /uploads to be loaded by the frontend origin
  }));

  // Response compression
  app.use(compression());

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
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // General rate limiting on all API routes
  app.use('/api', apiLimiter);

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

  // Cron jobs only run in this process when clustering is off (single process
  // total). When clustering is on, the primary runs them instead — see above.
  if (!CLUSTER_ENABLED) {
    initializeCronJobs();
  }

  // Periodic memory usage log — cheap operational visibility (e.g. in Docker
  // logs) without needing a metrics stack. Not a leak detector on its own, but
  // a sustained upward trend across these log lines is the first sign of one.
  const memoryLogInterval = setInterval(() => {
    const mem = process.memoryUsage();
    const mb = (bytes) => Math.round(bytes / 1024 / 1024);
    console.log(
      `[memory] worker ${process.pid}: rss=${mb(mem.rss)}MB heapUsed=${mb(mem.heapUsed)}MB heapTotal=${mb(mem.heapTotal)}MB external=${mb(mem.external)}MB`
    );
  }, 15 * 60 * 1000);
  memoryLogInterval.unref();

  // Initialize Socket.io
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Redis adapter: fans out room broadcasts (admin:room, user:*, chat:*, etc.)
  // across every worker/instance, not just the one holding the target socket.
  const pubClient = redis.duplicate();
  const subClient = redis.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  if (CLUSTER_ENABLED) {
    // Routes connections forwarded from the primary's sticky router instead of
    // this worker binding to the port directly.
    setupWorker(io);
  }

  // Initialize WebSocket service
  webSocketService.initialize(io);

  // WebSocket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token ||
                   socket.handshake.headers.authorization?.split(' ')[1];

      const guestId = socket.handshake.auth.guestId;

      if (!token && guestId) {
        socket.guestId = guestId;
        socket.userRole = 'GUEST';
        return next();
      }

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, config.jwt.secret);

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
    if (socket.userId) {
      webSocketService.registerUserSocket(socket.userId, socket.id);
      socket.join(`user:${socket.userId}`);
    } else if (socket.guestId) {
      socket.join(`guest:${socket.guestId}`);
    }

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


    // Inquiry/Live Chat Events
    socket.on('inquiry:join', (sessionId) => {
      socket.join(`inquiry:${sessionId}`);
    });

    socket.on('inquiry:message', (data) => {
      // data: { sessionId, message }
      socket.to(`inquiry:${data.sessionId}`).emit('inquiry:message', data);
      // Also notify admins if it's from a user/guest
      if (!socket.userRole || socket.userRole !== 'ADMIN') {
        io.to('admin:room').emit('inquiry:new_message', data);
      }
    });

    socket.on('inquiry:close', (sessionId) => {
      io.to(`inquiry:${sessionId}`).emit('inquiry:closed', { sessionId });
    });

    socket.on('inquiry:typing', (data) => {
      const { sessionId, isTyping } = data;
      socket.to(`inquiry:${sessionId}`).emit('inquiry:typing', {
        sessionId,
        userId: socket.userId,
        guestId: socket.guestId,
        userRole: socket.userRole,
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

  // Health check endpoint (probes the DB so orchestration can detect a DB-down state)
  app.get('/api/health', async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      const redisStatus = redis.status === 'ready' ? 'up' : 'down';
      res.json({ ok: true, db: 'up', redis: redisStatus, worker: process.pid });
    } catch (error) {
      console.error('Health check DB probe failed:', error.message);
      res.status(503).json({ ok: false, db: 'down' });
    }
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
  app.use('/api/shipping-regions', shippingRoutes);
  app.use('/api/sub-categories', subCategoryRoutes);
  app.use('/api/inquiries', inquiryRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/reviews', reviewRoutes);


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

  if (!CLUSTER_ENABLED) {
    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } else {
    console.log(`Worker ${process.pid} ready (routed via sticky primary)`);
  }

  // Graceful shutdown: stop accepting new connections, let in-flight requests finish,
  // then close the DB connection and socket server cleanly.
  let shuttingDown = false;
  async function gracefulShutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received (worker ${process.pid}). Shutting down gracefully...`);

    const forceExitTimer = setTimeout(() => {
      console.error('Graceful shutdown timed out. Forcing exit.');
      process.exit(1);
    }, 10000);
    forceExitTimer.unref();

    try {
      io.close();
      await new Promise((resolve) => server.close(() => resolve())).catch(() => {});
      await prisma.$disconnect();
      await Promise.allSettled([pubClient.quit(), subClient.quit()]);
      clearTimeout(forceExitTimer);
      console.log('Shutdown complete.');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
  });
}
