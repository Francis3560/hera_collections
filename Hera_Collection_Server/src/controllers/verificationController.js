import { sendVerificationEmail, sendWelcomeEmail } from '../services/emails/emailService.js';
import { 
  generateVerificationCode, 
  saveVerificationCode, 
  verifyUserCode,
  resendVerificationCode,
  checkUserVerification
} from '../services/emails/emailVerificationService.js';
import { getUserById } from '../services/userService.js';
import prisma from '../database.js';

export const verifyEmailPublicController = async (req, res) => {
  try {
    const { userId, code, email } = req.body;
    
    if ((!userId || !code) && (!email || !code)) {
      return res.status(400).json({ 
        success: false,
        message: 'Either userId+code or email+code are required' 
      });
    }
    
    let verifiedUser;
    
    if (userId && code) {
      verifiedUser = await verifyUserCode(parseInt(userId), code);
    } else if (email && code) {
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: 'User not found with this email' 
        });
      }
      verifiedUser = await verifyUserCode(user.id, code);
    }
    
  
    await sendWelcomeEmail(verifiedUser.email, verifiedUser.name || 'User');
    
    res.status(200).json({ 
      success: true,
      message: 'Email verified successfully! You can now log in.',
      user: {
        id: verifiedUser.id,
        email: verifiedUser.email,
        name: verifiedUser.name,
        isVerified: verifiedUser.isVerified,
        role: verifiedUser.role
      },
      redirectTo: '/login' 
    });
  } catch (error) {
    console.error('Public verification error:', error);
    
    if (error.message.includes('already verified')) {
      return res.status(200).json({ 
        success: true,
        message: 'Email is already verified',
        isAlreadyVerified: true,
        redirectTo: '/login'
      });
    }
    
    if (error.message.includes('expired')) {
      return res.status(400).json({ 
        success: false,
        message: 'Verification code has expired. Please request a new one.',
        isExpired: true
      });
    }
    
    if (error.message.includes('Invalid') || error.message.includes('not found')) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid verification code or email.'
      });
    }
    
    res.status(400).json({ 
      success: false,
      message: error.message || 'Email verification failed'
    });
  }
};
export const resendVerificationPublicController = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found with this email' 
      });
    }
    if (user.isVerified) {
      return res.status(400).json({ 
        success: false,
        message: 'User is already verified' 
      });
    }
    
    const { code: verificationCode, email: userEmail } = await resendVerificationCode(user.id);
    
    await sendVerificationEmail(userEmail, user.name || 'User', verificationCode);
    
    res.status(200).json({ 
      success: true,
      message: 'New verification code sent successfully',
      email: userEmail,
      expiresIn: '30 minutes'
    });
  } catch (error) {
    console.error('Public resend verification error:', error);
    
    if (error.message.includes('Wait')) {
      return res.status(429).json({ 
        success: false,
        message: error.message,
        retryAfter: 60
      });
    }
    
    res.status(400).json({ 
      success: false,
      message: error.message || 'Failed to resend verification email'
    });
  }
};
export const sendVerificationController = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    if (user.isVerified) {
      return res.status(400).json({ 
        success: false,
        message: 'User is already verified' 
      });
    }
    
    const verificationCode = generateVerificationCode();
    await saveVerificationCode(userId, verificationCode);
    
    await sendVerificationEmail(user.email, user.name || 'User', verificationCode);
    
    res.status(200).json({ 
      success: true,
      message: 'Verification email sent successfully',
      expiresIn: '30 minutes'
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send verification email' 
    });
  }
};
export const verifyEmailController = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;
    
    if (!code || code.length !== 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid verification code. Please enter a 6-digit code.' 
      });
    }
    
    const verifiedUser = await verifyUserCode(userId, code);
    await sendWelcomeEmail(verifiedUser.email, verifiedUser.name || 'User');
    
    await prisma.user.update({
      where: { id: userId },
      data: { 
        status: 'ONLINE',
        lastSeen: new Date()
      }
    });
    
    const redirectTo = verifiedUser.role === 'ADMIN' ? '/dashboard' : '/';
    
    res.status(200).json({ 
      success: true,
      message: 'Email verified successfully!',
      user: {
        id: verifiedUser.id,
        email: verifiedUser.email,
        name: verifiedUser.name,
        role: verifiedUser.role,
        isVerified: verifiedUser.isVerified
      },
      redirectTo: '/login'
    });
  } catch (error) {
    console.error('Protected verification error:', error);
    
    if (error.message.includes('already verified')) {
      return res.status(200).json({ 
        success: true,
        message: 'Email is already verified',
        isAlreadyVerified: true,
        redirectTo: '/login'
      });
    }
    
    if (error.message.includes('expired')) {
      return res.status(400).json({ 
        success: false,
        message: 'Verification code has expired. Please request a new one.',
        isExpired: true
      });
    }
    
    if (error.message.includes('Invalid')) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid verification code. Please try again.'
      });
    }
    
    res.status(400).json({ 
      success: false,
      message: error.message || 'Email verification failed'
    });
  }
};
export const resendVerificationController = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { code, email } = await resendVerificationCode(userId);
    
    await sendVerificationEmail(email, 'User', code);
    
    res.status(200).json({ 
      success: true,
      message: 'New verification code sent successfully',
      expiresIn: '30 minutes'
    });
  } catch (error) {
    console.error('Protected resend verification error:', error);
    
    if (error.message.includes('Wait')) {
      return res.status(429).json({ 
        success: false,
        message: error.message,
        retryAfter: 60
      });
    }
    
    res.status(400).json({ 
      success: false,
      message: error.message || 'Failed to resend verification email'
    });
  }
};
export const checkVerificationController = async (req, res) => {
  try {
    const userId = req.user.id;
    const isVerified = await checkUserVerification(userId);
    
    res.status(200).json({ 
      success: true,
      isVerified 
    });
  } catch (error) {
    console.error('Check verification error:', error);
    res.status(400).json({ 
      success: false,
      message: error.message || 'Failed to check verification status'
    });
  }
};
export const postVerificationController = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    if (!user.isVerified) {
      return res.status(400).json({ 
        success: false,
        message: 'User not verified' 
      });
    }
    
    await prisma.user.update({
      where: { id: userId },
      data: { 
        status: 'ONLINE',
        lastSeen: new Date()
      }
    });
    
    await sendWelcomeEmail(user.email, user.name || 'User');
    
    const redirectTo = user.role === 'ADMIN' ? '/dashboard' : '/';
    
    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Welcome to Hera Collection.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified
      },
      redirectTo
    });
  } catch (error) {
    console.error('Post-verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error after verification' 
    });
  }
};
export const verifyEmailUnifiedController = async (req, res) => {
  try {
    const { code, email, userId } = req.body;
    
    if (!code || code.length !== 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid verification code. Please enter a 6-digit code.' 
      });
    }
    const isLoggedIn = req.user && req.user.id;
    let targetUserId;
    
    if (isLoggedIn) {
      targetUserId = req.user.id;
    } else if (userId) {
      targetUserId = parseInt(userId);
    } else if (email) {
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: 'User not found with this email' 
        });
      }
      
      targetUserId = user.id;
    } else {
      return res.status(400).json({ 
        success: false,
        message: 'Email or userId is required for non-logged-in users' 
      });
    }
    const verifiedUser = await verifyUserCode(targetUserId, code);

    await sendWelcomeEmail(verifiedUser.email, verifiedUser.name || 'User');

    if (isLoggedIn) {
      await prisma.user.update({
        where: { id: targetUserId },
        data: { 
          status: 'ONLINE',
          lastSeen: new Date()
        }
      });
    }
 
    res.status(200).json({ 
      success: true,
      message: 'Email verified successfully! You can now log in.',
      user: {
        id: verifiedUser.id,
        email: verifiedUser.email,
        name: verifiedUser.name,
        role: verifiedUser.role,
        isVerified: verifiedUser.isVerified
      },
      redirectTo: '/login',
      requiresLogin: !isLoggedIn
    });
  } catch (error) {
    console.error('Unified verification error:', error);
    
    if (error.message.includes('already verified')) {
      return res.status(200).json({ 
        success: true,
        message: 'Email is already verified',
        isAlreadyVerified: true,
        redirectTo: '/login'
      });
    }
    
    if (error.message.includes('expired')) {
      return res.status(400).json({ 
        success: false,
        message: 'Verification code has expired. Please request a new one.',
        isExpired: true
      });
    }
    
    if (error.message.includes('Invalid')) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid verification code. Please try again.'
      });
    }
    
    res.status(400).json({ 
      success: false,
      message: error.message || 'Email verification failed'
    });
  }
};