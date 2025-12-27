import Joi from 'joi';
import {
  generateResetToken,
  validateResetToken,
  resetPassword,
  changePassword,
} from '../services/passwordResetService.js';
import { sendPasswordResetEmail, sendPasswordChangedEmail } from '../services/emails/emailService.js';
import prisma from '../database.js';

const requestResetValidator = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  });
  return schema.validate(data, { abortEarly: false });
};

const resetPasswordValidator = (data) => {
  const schema = Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Reset token is required',
    }),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required',
      }),
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Passwords do not match',
        'any.required': 'Please confirm your password',
      }),
  });
  return schema.validate(data, { abortEarly: false });
};

const changePasswordValidator = (data) => {
  const schema = Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Current password is required',
    }),
    newPassword: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'New password must be at least 8 characters long',
        'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'New password is required',
      }),
    confirmNewPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'Passwords do not match',
        'any.required': 'Please confirm your new password',
      }),
  });
  return schema.validate(data, { abortEarly: false });
};

export const requestPasswordResetController = async (req, res) => {
  try {
    const { error, value } = requestResetValidator(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map(d => d.message).join(', '),
      });
    }

    const { token, user } = await generateResetToken(value.email);

    await sendPasswordResetEmail(user.email, user.name || 'User', token);

    return res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email',
      expiresIn: '1 hour',
      // In production, you might want to only send this in development
      ...(process.env.NODE_ENV === 'development' && { token }),
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    if (error.message.includes('not exist') || error.message.includes('verify')) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a reset link has been sent',
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
    });
  }
};

export const validateResetTokenController = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required',
      });
    }

    const user = await validateResetToken(token);
    
    return res.status(200).json({
      success: true,
      message: 'Reset token is valid',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Validate reset token error:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to validate reset token',
    });
  }
};

export const resetPasswordController = async (req, res) => {
  try {
    const { error, value } = resetPasswordValidator(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map(d => d.message).join(', '),
      });
    }

    const result = await resetPassword(value.token, value.password);
    
    const user = await prisma.user.findUnique({
      where: { id: result.user.id },
      select: { email: true, name: true },
    });
    
    if (user) {
      await sendPasswordChangedEmail(user.email, user.name || 'User');
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Reset password error:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password',
    });
  }
};

export const changePasswordController = async (req, res) => {
  try {
    const { error, value } = changePasswordValidator(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map(d => d.message).join(', '),
      });
    }

    const userId = req.user.id;
    const result = await changePassword(userId, value.currentPassword, value.newPassword);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
    
    if (user) {
      await sendPasswordChangedEmail(user.email, user.name || 'User');
    }
    
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    });
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Change password error:', error);
    
    if (error.message.includes('not found') || 
        error.message.includes('incorrect') || 
        error.message.includes('different')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to change password',
    });
  }
};