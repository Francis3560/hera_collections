import Joi from 'joi';
import {
  getUserProfile,
  updateCurrentUser,
  deleteCurrentUser,
} from '../services/userService.js';
import { sendVerificationEmail } from '../services/emails/emailService.js';
import prisma from '../database.js';

const updateProfileValidator = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    full_name: Joi.string().min(2).max(100).optional(),
    phone: Joi.string()
      .pattern(/^(\+254|254)7\d{8}$/)
      .optional()
      .messages({ 'string.pattern.base': 'Phone must be +2547XXXXXXXX or 2547XXXXXXXX' }),
    phone_number: Joi.string()
      .pattern(/^(\+254|254)7\d{8}$/)
      .optional()
      .messages({ 'string.pattern.base': 'Phone must be +2547XXXXXXXX or 2547XXXXXXXX' }),
    email: Joi.string().email().optional(),
    bio: Joi.string().max(500).allow('', null).optional(),
    location: Joi.string().max(120).allow('', null).optional(),
    website: Joi.string().uri().allow('', null).optional(),
    dateOfBirth: Joi.date().max('now').optional(),
    emailNotifications: Joi.boolean().optional(),
    smsNotifications: Joi.boolean().optional(),
    marketingEmails: Joi.boolean().optional(),
    language: Joi.string().length(2).optional(),
    timezone: Joi.string().optional(),
  })
  .or('name', 'full_name', 'phone', 'phone_number', 'email', 'bio', 'location', 'website', 'dateOfBirth', 'emailNotifications', 'smsNotifications', 'marketingEmails', 'language', 'timezone');
  
  return schema.validate(data, { abortEarly: false });
};

const deleteAccountValidator = (data) => {
  const schema = Joi.object({
    password: Joi.string().when('provider', {
      is: 'EMAIL',
      then: Joi.string().required().messages({
        'any.required': 'Password is required to delete your account',
      }),
      otherwise: Joi.string().optional(),
    }),
    confirm: Joi.boolean().valid(true).required().messages({
      'any.only': 'You must confirm account deletion',
      'any.required': 'Confirmation is required',
    }),
  });
  
  return schema.validate(data, { abortEarly: false });
};

// Helper function to transform empty strings to null
const transformEmptyStringsToNull = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const transformed = { ...data };
  const fieldsToTransform = ['bio', 'location', 'website'];
  
  fieldsToTransform.forEach(field => {
    if (field in transformed && transformed[field] === '') {
      transformed[field] = null;
    }
  });
  
  return transformed;
};

export const getCurrentUserProfileController = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getUserProfile(userId);
    
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
    });
  }
};

export const updateCurrentUserProfileController = async (req, res) => {
  try {
    const { error, value } = updateProfileValidator(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map(d => d.message).join(', '),
      });
    }

    const userId = req.user.id;
    
    // Transform empty strings to null for bio, location, and website
    const transformedData = transformEmptyStringsToNull(value);
    
    const updatedUser = await updateCurrentUser(userId, transformedData);
    
    // If email was changed, send verification email
    if (value.email && updatedUser.verificationCode) {
      await sendVerificationEmail(
        updatedUser.email,
        updatedUser.name || 'User',
        updatedUser.verificationCode
      );
      
      return res.status(200).json({
        success: true,
        message: 'Profile updated. Please verify your new email address.',
        user: updatedUser,
        verificationRequired: true,
        verificationSent: true,
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.message.includes('already') || error.message.includes('exists')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
};

export const deleteCurrentUserAccountController = async (req, res) => {
  try {
    const { error, value } = deleteAccountValidator(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map(d => d.message).join(', '),
      });
    }

    const userId = req.user.id;
    
    // Get user to check provider
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { provider: true },
    });
    
    const result = await deleteCurrentUser(
      userId,
      user.provider === 'EMAIL' ? value.password : null
    );
    
    // Clear all cookies
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    });
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete account error:', error);
    
    if (error.message.includes('required') || 
        error.message.includes('Incorrect') || 
        error.message.includes('not found')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to delete account',
    });
  }
};

export const getUserActivityController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const activities = await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        oldValue: true,
        newValue: true,
        createdAt: true,
        metadata: true,
      },
    });
    
    const total = await prisma.activityLog.count({
      where: { userId },
    });
    
    return res.status(200).json({
      success: true,
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get activity error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity',
    });
  }
};

export const getUserStatsController = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [
      orderCount,
      productCount,
      reviewCount,
      wishlistCount,
      totalSpent,
      lastOrder,
    ] = await Promise.all([
      prisma.order.count({ where: { buyerId: userId } }),
      prisma.product.count({ where: { sellerId: userId } }),
      prisma.review.count({ where: { userId } }),
      prisma.wishlistItem.count({ where: { userId } }),
      prisma.order.aggregate({
        where: { 
          buyerId: userId,
          status: { in: ['PAID', 'FULFILLED'] }
        },
        _sum: { totalAmount: true },
      }),
      prisma.order.findFirst({
        where: { buyerId: userId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, totalAmount: true, orderNumber: true },
      }),
    ]);
    
    return res.status(200).json({
      success: true,
      stats: {
        orders: orderCount,
        products: productCount,
        reviews: reviewCount,
        wishlist: wishlistCount,
        totalSpent: totalSpent._sum.totalAmount || 0,
        lastOrder: lastOrder ? {
          date: lastOrder.createdAt,
          amount: lastOrder.totalAmount,
          orderNumber: lastOrder.orderNumber,
        } : null,
        joined: await prisma.user.findUnique({
          where: { id: userId },
          select: { createdAt: true },
        }).then(user => user?.createdAt),
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
    });
  }
};