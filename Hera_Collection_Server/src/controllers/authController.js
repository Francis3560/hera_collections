import { OAuth2Client } from 'google-auth-library';
import { config } from '../configs/config.js';
import {
  registerUser,
  authenticateUser,
  getAllUsers,
  getUserById,
  deleteUserById,
  updateUser,
  createUser,
} from '../services/userService.js';
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/tokenUtils.js';
import prisma from '../database.js';
import { signupValidator, loginValidator, googleTokenValidator } from '../validators/userValidators.js';
import { 
  sendVerificationEmail, 
  sendWelcomeEmail,  
  sendGoogleWelcomeEmail 
} from '../services/emails/emailService.js';
import { generateVerificationCode, saveVerificationCode } from '../services/emails/emailVerificationService.js';

const googleClient = config.google.clientId ? new OAuth2Client(config.google.clientId) : null;
const cookieName = config.cookies.refreshName;
const cookieOptions = config.cookies.options;

function setRefreshCookie(res, token) {
  res.cookie(cookieName, token, cookieOptions);
}

export const loginController = async (req, res) => {
  const { error, value } = loginValidator(req.body);
  if (error) return res.status(400).json({ message: error.details.map(d => d.message).join(', ') });

  try {
    const user = await authenticateUser(value.email, value.password);
    
    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        message: 'Please verify your email before logging in.',
        verificationRequired: true,
        userId: user.id,
        action: 'verify-email'
      });
    }
    
    // Only set ONLINE if verified
    await prisma.user.update({ 
      where: { id: user.id }, 
      data: { 
        status: 'ONLINE', 
        lastSeen: new Date() 
      } 
    });

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshCookie(res, refreshToken);

    res.status(200).json({ 
      accessToken, 
      role: user.role, 
      user,
      redirectTo: user.role === 'ADMIN' ? '/dashboard' : '/'
    });
  } catch {
    res.status(400).json({ message: 'Invalid email or password' });
  }
};

export const googleRegistrationController = async (req, res) => {
  const { error, value } = googleTokenValidator(req.body);
  if (error) return res.status(400).json({ message: 'No token provided' });
  if (!googleClient) return res.status(500).json({ message: 'Google OAuth client not configured' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: value.token,
      audience: config.google.clientId,
    });
    const payload = ticket.getPayload();
    const email = payload?.email;
    const name = payload?.name || null;


    if (!email) return res.status(400).json({ message: 'Invalid Google token payload' });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ message: 'User already exists. Please log in.' });

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: 'USER',
        status: 'OFFLINE', 
        isVerified: false, 
        googleId: payload.sub,
        picture: payload.picture,
        givenName: payload.given_name,
        familyName: payload.family_name,
        locale: payload.locale,
        emailVerifiedByGoogle: payload?.email_verified || false, 
        provider: 'GOOGLE',
      },
    });
    const verificationCode = generateVerificationCode();
    await saveVerificationCode(user.id, verificationCode);
    await sendVerificationEmail(user.email, user.name || 'User', verificationCode);

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshCookie(res, refreshToken);

    return res.status(201).json({ 
      accessToken, 
      role: user.role, 
      user: {
        ...user,
        isVerified: false 
      },
      message: 'Registration successful. Please check your email for verification code.',
      isVerified: false,
      verificationRequired: true,
      verificationSent: true
    });
  } catch (e) {
    console.error('Google registration failed:', e);
    return res.status(500).json({ message: 'Error during Google registration' });
  }
};

export const googleLoginController = async (req, res) => {
  const { error, value } = googleTokenValidator(req.body);
  if (error) return res.status(400).json({ message: 'No token provided' });
  if (!googleClient) return res.status(500).json({ message: 'Google OAuth client not configured' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: value.token,
      audience: config.google.clientId,
    });
    const payload = ticket.getPayload();
    const email = payload?.email;

    if (!email) return res.status(400).json({ message: 'Invalid Google token payload' });

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found. Please sign up first.',
        action: 'register'
      });
    }

    await prisma.user.update({ 
      where: { id: user.id }, 
      data: { 
        lastSeen: new Date(),
        status: user.isVerified ? 'ONLINE' : 'OFFLINE'
      } 
    });

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshCookie(res, refreshToken);

    return res.status(200).json({ 
      accessToken, 
      role: user.role, 
      user,
      verificationRequired: !user.isVerified, 
      redirectTo: user.isVerified ? 
        (user.role === 'ADMIN' ? '/dashboard' : '/') : 
        '/verify-email'
    });
  } catch (e) {
    console.error('Google login failed:', e);
    return res.status(500).json({ message: 'Error during Google login' });
  }
};

export const refreshTokenController = async (req, res) => {
  const token = req.cookies?.[cookieName];
  
  if (!token) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  try {
    const decoded = verifyRefreshToken(token);
    const user = await getUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    const newAccess = generateToken(user);
    const newRefresh = generateRefreshToken(user);
    setRefreshCookie(res, newRefresh);

    return res.status(200).json({ accessToken: newAccess });
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Refresh token expired' });
    }
    if (e.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }
    return res.status(403).json({ message: 'Invalid refresh token' });
  }
};


export const getCurrentUserController = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ message: 'Error fetching current user' });
  }
};

// controller
export const getAllUsersController = async (_req, res) => {
  try {
    console.log('Fetching users from database...');
    const users = await getAllUsers();
    console.log(`Found ${users.length} users`);
    res.status(200).json(users);
  } catch (error) {
    console.error('Error in getAllUsersController:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ 
      message: 'Failed to retrieve users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getUserByIdController = async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (e) {
    res.status(400).json({ message: e.message || 'Error fetching user' });
  }
};

export const deleteUserController = async (req, res) => {
  try {
    await deleteUserById(req.params.id);
    res.status(200).json({ message: 'User deleted' });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Error deleting user' });
  }
};

export const updateUserController = async (req, res) => {
  try {
    const updated = await updateUser(req.params.id, req.body);
    res.status(200).json(updated);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const createUserController = async (req, res) => {
  try {
    const created = await createUser(req.body);
    res.status(201).json(created);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const userHeartbeatController = async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ 
      success: false,
      message: 'User ID is required' 
    });
  }
  
  try {
    await prisma.user.update({
      where: { id: Number(userId) },
      data: { 
        lastSeen: new Date(),
        status: 'ONLINE'
      }
    });
    
    res.status(200).json({ 
      success: true,
      message: 'Heartbeat received'
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating heartbeat'
    });
  }
};
export const registerController = async (req, res) => {
  const { error, value } = signupValidator(req.body);
  if (error) return res.status(400).json({ message: error.details.map(d => d.message).join(', ') });

  try {
    const user = await registerUser({
       email: value.email,
      password: value.password,
      name: value.name || value.full_name, 
      phone: value.phone || value.phone_number,
      role: value.role,
    });

    const verificationCode = generateVerificationCode();
    await saveVerificationCode(user.id, verificationCode);
    await sendVerificationEmail(user.email, user.name || 'User', verificationCode);

    await prisma.user.update({ 
      where: { id: user.id }, 
      data: { 
        status: 'OFFLINE', 
        lastSeen: new Date()
      } 
    });

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({ 
      accessToken, 
      role: user.role, 
      user: {
        ...user,
        isVerified: false 
      },
      message: 'Registration successful. Please check your email for verification code.',
      verificationRequired: true,
      verificationSent: true
    });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Registration failed' });
  }
};
export const postLoginRedirectController = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getUserById(userId);
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (!user.isVerified) {
      return res.status(403).json({ 
        message: 'Please verify your email first',
        redirectTo: '/verify-email'
      });
    }

    let redirectTo;
    if (user.role === 'ADMIN') {
      redirectTo = '/dashboard';
    } else {
      redirectTo = '/';
    }
    
    res.status(200).json({ 
      message: 'Login successful',
      redirectTo,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Post-login redirect error:', error);
    res.status(500).json({ message: 'Error determining redirect' });
  }
};
export const logoutController = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = req.user?.id;
    
    if (token && userId) {

      await prisma.session.deleteMany({
        where: {
          userId,
          accessToken: token,
        },
      });
      
  
      await prisma.refreshToken.updateMany({
        where: { 
          userId,
          revoked: false,
        },
        data: {
          revoked: true,
          revokedAt: new Date(),
        },
      });
    }
   
    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    });
    
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to logout',
    });
  }
};