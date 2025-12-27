import prisma from '../../database.js';

export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const saveVerificationCode = async (userId, code) => {
  const expiresAtUnix = Date.now() + (10 * 60 * 1000); 
  
  return await prisma.user.update({
    where: { id: userId },
    data: {
      verificationCode: code,
      verificationCodeExpiresUnix: BigInt(expiresAtUnix),
      isVerified: false,
    },
  });
};

export const verifyUserCode = async (userId, code) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      verificationCode: true,
      verificationCodeExpiresUnix: true,
      isVerified: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.isVerified) {
    throw new Error('User is already verified');
  }

  if (!user.verificationCode || !user.verificationCodeExpiresUnix) {
    throw new Error('No verification code found');
  }
  const expiresAtUnix = Number(user.verificationCodeExpiresUnix);
  const currentTime = Date.now();
  
  if (currentTime > expiresAtUnix) {
    const minutesExpired = (currentTime - expiresAtUnix) / (1000 * 60);
    throw new Error(`Verification code has expired ${minutesExpired.toFixed(0)} minutes ago`);
  }

  if (user.verificationCode !== code) {
    throw new Error('Invalid verification code');
  }
  return await prisma.user.update({
    where: { id: userId },
    data: {
      isVerified: true,
      verificationCode: null,
      verificationCodeExpiresUnix: null, 
    },
  });
};
export const resendVerificationCode = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      email: true,
      isVerified: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }
  
  if (user.isVerified) {
    throw new Error('User is already verified');
  }

  const newCode = generateVerificationCode();
  await saveVerificationCode(userId, newCode);

  return {
    code: newCode,
    email: user.email,
  };
};

export const checkUserVerification = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isVerified: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user.isVerified;
};

export const cleanupExpiredVerificationCodes = async () => {
  const currentTime = Date.now();
  
  // Find users with expired verification codes
  const usersWithExpiredCodes = await prisma.user.findMany({
    where: {
      isVerified: false,
      verificationCodeExpiresUnix: {
        not: null,
      },
    },
    select: {
      id: true,
      verificationCodeExpiresUnix: true,
    },
  });
  
  const expiredUserIds = usersWithExpiredCodes
    .filter(user => {
      const expiry = Number(user.verificationCodeExpiresUnix);
      return currentTime > expiry;
    })
    .map(user => user.id);
  
  if (expiredUserIds.length > 0) {
    await prisma.user.updateMany({
      where: {
        id: { in: expiredUserIds },
      },
      data: {
        verificationCode: null,
        verificationCodeExpiresUnix: null, // Only clear this field
      },
    });
    
    console.log(`Cleaned up ${expiredUserIds.length} expired verification codes`);
  }
  
  return expiredUserIds.length;
};

export const migrateExpiryToUnix = async () => {
  const usersToMigrate = await prisma.user.findMany({
    where: {
      verificationCodeExpires: { not: null },
      OR: [
        { verificationCodeExpiresUnix: null },
        { verificationCodeExpiresUnix: { equals: "0" } },
      ],
    },
    select: {
      id: true,
      verificationCodeExpires: true,
    },
  });
  
  const updates = usersToMigrate.map(user => {
    if (!user.verificationCodeExpires) return null;
    
    const expiryDate = new Date(user.verificationCodeExpires);
    const expiryUnix = expiryDate.getTime();
    
    return prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCodeExpiresUnix: expiryUnix.toString(),
      },
    });
  }).filter(update => update !== null);
  
  await Promise.all(updates);
  console.log(`Migrated ${updates.length} users to Unix timestamp expiry`);
};