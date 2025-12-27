import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from '../database.js';

export const generateResetToken = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    throw new Error('User with this email does not exist');
  }
  
  if (!user.isVerified) {
    throw new Error('Please verify your email before resetting password');
  }
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetTokenHash,
      passwordResetExpires: resetExpires,
    },
  });
  
  return {
    token: resetToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
};

export const validateResetToken = async (token) => {
  const resetTokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: resetTokenHash,
      passwordResetExpires: {
        gt: new Date(),
      },
    },
  });
  
  if (!user) {
    throw new Error('Invalid or expired reset token');
  }
  
  return user;
};

export const resetPassword = async (token, newPassword) => {
  const user = await validateResetToken(token);
  
  if (!user) {
    throw new Error('Invalid or expired reset token');
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      lastPasswordChange: new Date(),
      loginAttempts: 0,
      lockedUntil: null,
    },
  });
  
  await prisma.session.deleteMany({
    where: { userId: user.id },
  });
  
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id },
  });
  
  return {
    success: true,
    message: 'Password reset successfully',
    user: {
      id: user.id,
      email: user.email,
    },
  };
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  if (!user.passwordHash) {
    throw new Error('Password not set for this account');
  }
  
  const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  
  if (!isPasswordValid) {
    throw new Error('Current password is incorrect');
  }
  
  const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
  
  if (isSamePassword) {
    throw new Error('New password must be different from current password');
  }
  
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      lastPasswordChange: new Date(),
      loginAttempts: 0,
      lockedUntil: null,
    },
  });

  await prisma.session.deleteMany({
    where: { userId: user.id },
  });
  
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id },
  });
  
  return {
    success: true,
    message: 'Password changed successfully',
  };
};

export const cleanupExpiredResetTokens = async () => {
  const result = await prisma.user.updateMany({
    where: {
      passwordResetExpires: {
        lt: new Date(),
      },
    },
    data: {
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });
  
  console.log(`Cleaned up ${result.count} expired password reset tokens`);
  return result.count;
};