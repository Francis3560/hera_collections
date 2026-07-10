import jwt from 'jsonwebtoken';
import { config } from '../configs/config.js';

export const generateToken = (user) => {
  const payload = { 
    id: user.id, 
    email: user.email, 
    role: user.role,
    isVerified: user.isVerified,
  };
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
};

export const generateRefreshToken = (user) => {
  const payload = { 
    id: user.id, 
    email: user.email, 
    role: user.role,
    type: 'refresh',
  };
  return jwt.sign(payload, config.refreshToken.secret, { expiresIn: config.refreshToken.expiresIn });
};

export const verifyAccessToken = (token) => jwt.verify(token, config.jwt.secret);

export const verifyRefreshToken = (token) => jwt.verify(token, config.refreshToken.secret);

export const autoRefreshToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return next();
  }
  
  try {
    const decoded = verifyAccessToken(token);
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = decoded.exp - now;

    if (expiresIn < 300 && expiresIn > 0) {
      const user = { id: decoded.id, email: decoded.email, role: decoded.role };
      const newToken = generateToken(user);
      
      res.set('X-New-Access-Token', newToken);
      res.set('Access-Control-Expose-Headers', 'X-New-Access-Token');
      
      console.log(`Auto-refreshed token for user ${decoded.id}`);
    }
    
    next();
  } catch (error) {
    next();
  }
};
