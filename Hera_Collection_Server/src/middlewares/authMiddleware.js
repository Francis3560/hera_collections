import jwt from 'jsonwebtoken';
import { config } from '../configs/config.js';
import { updateUserLastSeen } from '../services/userService.js';
import { verifyAccessToken } from '../utils/tokenUtils.js';
import prisma from '../database.js';
import { getOrSet } from '../utils/cache.js';

const USER_ACCOUNT_CACHE_TTL_MS = 30 * 1000;

// Helper function to extract bearer token
function getBearerToken(req) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== 'bearer') return null;
  return token;
}

// Helper to validate user account status. The DB lookup is cached briefly since
// it otherwise runs on every single authenticated request; lock/delete changes
// take up to USER_ACCOUNT_CACHE_TTL_MS to be reflected for already-issued tokens.
async function validateUserAccount(userId) {
  const user = await getOrSet(`user-account:${userId}`, USER_ACCOUNT_CACHE_TTL_MS, () =>
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        status: true,
        lockedUntil: true,
        deletedAt: true,
      },
    })
  );

  if (!user) {
    throw new Error('User not found');
  }

  // Check if account is deleted (soft delete)
  if (user.deletedAt) {
    throw new Error('Account has been deleted');
  }

  // Check if account is locked. lockedUntil may be a Date instance (fresh from
  // Prisma) or an ISO string (round-tripped through the Redis cache as JSON) —
  // wrap in `new Date(...)` so the comparison/arithmetic works either way.
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const lockTime = Math.ceil((new Date(user.lockedUntil) - new Date()) / 1000 / 60);
    throw new Error(`Account is locked. Please try again in ${lockTime} minutes`);
  }

  return user;
}

// Main authentication middleware
export const protect = async (req, res, next) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Authorization token missing',
        code: 'TOKEN_MISSING'
      });
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      const msg = err.name === 'TokenExpiredError' 
        ? 'Token expired' 
        : 'Invalid token';
      return res.status(401).json({ 
        success: false,
        message: msg,
        code: err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID'
      });
    }
    
    if (!decoded || !decoded.id) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token payload',
        code: 'TOKEN_INVALID_PAYLOAD'
      });
    }
    
    if (!decoded.role) {
      return res.status(401).json({ 
        success: false,
        message: 'Token missing role information',
        code: 'TOKEN_MISSING_ROLE'
      });
    }

    // Validate user account status
    try {
      const user = await validateUserAccount(decoded.id);
      
      // Check if email verification is required for this route
      const requiresVerification = req.headers['x-requires-verification'] === 'true' || 
                                  req.originalUrl.includes('/verified');
      
      if (requiresVerification && !user.isVerified) {
        return res.status(403).json({ 
          success: false,
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email address to access this resource',
          action: 'verify-email',
          redirectTo: '/verify-email'
        });
      }
    } catch (error) {
      return res.status(403).json({ 
        success: false,
        message: error.message,
        code: error.message.includes('locked') ? 'ACCOUNT_LOCKED' : 
              error.message.includes('deleted') ? 'ACCOUNT_DELETED' : 'ACCOUNT_INVALID'
      });
    }
    
    // Set user information in request
    req.user = decoded;
    req.auth = { 
      userId: decoded.id, 
      role: decoded.role, 
      token,
      isVerified: decoded.isVerified || false 
    };
    
    // Update user last seen (non-blocking)
    updateUserLastSeen(decoded.id).catch((err) => {
      console.error('Failed to update last seen:', err);
    });

    // Check for auto-refresh header
    const shouldAutoRefresh = req.headers['x-auto-refresh'] === 'true';
    if (shouldAutoRefresh) {
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = decoded.exp - now;
      
      // Auto-refresh if token expires in less than 5 minutes
      if (expiresIn < 300 && expiresIn > 0) {
        const user = { 
          id: decoded.id, 
          email: decoded.email, 
          role: decoded.role,
          isVerified: decoded.isVerified || false
        };
        const newToken = jwt.sign(user, config.jwt.secret, { 
          expiresIn: config.jwt.expiresIn 
        });
        
        res.set('X-New-Access-Token', newToken);
        res.set('Access-Control-Expose-Headers', 'X-New-Access-Token');
        
        console.log(`Auto-refreshed token for user ${decoded.id}`);
      }
    }

    return next();
  } catch (error) {
    console.error('protect() error:', error);
    return res.status(401).json({ 
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

// Role-based authorization
export const requireRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authorization required',
      code: 'AUTH_REQUIRED'
    });
  }
  
  const { role } = req.user;
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied: insufficient role',
      code: 'INSUFFICIENT_ROLE',
      requiredRoles: allowedRoles,
      userRole: role
    });
  }
  
  return next();
};

// Admin protection middleware
export const protectAdmin = requireRoles('ADMIN');

// User-only protection (admin cannot access)
export const protectUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authorization required',
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (req.user.role === 'ADMIN') {
    return res.status(403).json({ 
      success: false,
      message: 'Admin cannot access user-specific routes',
      code: 'ADMIN_ACCESS_DENIED'
    });
  }
  
  return next();
};

// Email verification requirement
export const requireVerified = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { 
        isVerified: true, 
        status: true,
        email: true,
        name: true
      }
    });
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    if (!user.isVerified) {
      return res.status(403).json({ 
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address to access this resource',
        action: 'verify-email',
        redirectTo: '/verify-email',
        user: {
          email: user.email,
          name: user.name
        }
      });
    }
    
    // Update user status to ONLINE if not already
    if (user.status !== 'ONLINE') {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { status: 'ONLINE' }
      }).catch(console.error);
    }
    
    return next();
  } catch (error) {
    console.error('Error checking verification status:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error checking verification status',
      code: 'VERIFICATION_CHECK_ERROR'
    });
  }
};

// Combined middleware: authentication + verification
export const protectAndVerified = [protect, requireVerified];

// Role-based authorization with verification
export const requireVerifiedRoles = (...allowedRoles) => [
  protect,
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authorization required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const { role } = req.user;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied: insufficient role',
        code: 'INSUFFICIENT_ROLE',
        requiredRoles: allowedRoles,
        userRole: role
      });
    }
    
    return next();
  },
  requireVerified
];

// Admin protection with verification
export const protectAdminVerified = requireVerifiedRoles('ADMIN');

// User-only protection with verification
export const protectUserVerified = [
  protect,
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authorization required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    if (req.user.role === 'ADMIN') {
      return res.status(403).json({ 
        success: false,
        message: 'Admin cannot access user-specific routes',
        code: 'ADMIN_ACCESS_DENIED'
      });
    }
    
    return next();
  },
  requireVerified
];

export default {
  protect,
  requireRoles,
  protectAdmin,
  protectUser,
  requireVerified,
  protectAndVerified,
  requireVerifiedRoles,
  protectAdminVerified,
  protectUserVerified,
  getBearerToken
};