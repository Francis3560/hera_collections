import prisma from '../database.js';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

const normalizeRole = (role) => {
  if (!role) return 'USER'; 
  
  const normalized = role.toUpperCase();
  return normalized === 'ADMIN' || normalized === Role.ADMIN ? Role.ADMIN : Role.USER;
};

const toDateOrUndefined = (val) => {
  if (val == null) return undefined;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? undefined : d;
};
const buildCreatePayload = async (data) => {
  const name = data.name ?? data.full_name;
  const phone = data.phone ?? data.phone_number;
  let passwordHash = null;
  if (data.password) {
    passwordHash = await bcrypt.hash(data.password, 10);
  } else if (data.passwordHash) {
    passwordHash = data.passwordHash;
  }

  const payload = {
    email: data.email,
    name,
    phone,
    role: normalizeRole(data.role),
    status: data.status ? data.status.toUpperCase() : 'OFFLINE', 
    passwordHash,
    provider: 'EMAIL',
  };
  if (!['ONLINE', 'OFFLINE', 'AWAY', 'BUSY'].includes(payload.status)) {
    payload.status = 'OFFLINE';
  }

  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
  return payload;
};

const buildUpdatePayload = async (data) => {
  const out = {};

  if (data.email !== undefined) out.email = data.email;

  const name = data.name ?? data.full_name;
  if (name !== undefined) out.name = name;

  const phone = data.phone ?? data.phone_number;
  if (phone !== undefined) out.phone = phone;

  if (data.role !== undefined) out.role = normalizeRole(data.role);
  
  if (data.status !== undefined) {
    out.status = typeof data.status === 'string' ? data.status.toUpperCase() : data.status;
    
    if (!['ONLINE', 'OFFLINE', 'AWAY', 'BUSY'].includes(out.status)) {
      console.warn(`Invalid status value: ${data.status}, defaulting to OFFLINE`);
      out.status = 'OFFLINE';
    }
  }

  const lastSeen = data.lastSeen ?? data.last_seen;
  const lastSeenDate = toDateOrUndefined(lastSeen);
  if (lastSeen !== undefined && lastSeenDate !== undefined) out.lastSeen = lastSeenDate;

  if (data.password) {
    out.passwordHash = await bcrypt.hash(data.password, 10);
  } else if (data.passwordHash) {
    out.passwordHash = data.passwordHash;
  }

  return out;
};

export const authenticateUser = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) throw new Error('Invalid credentials');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error('Invalid credentials');
  return user;
};

export const registerUser = async ({ email, password, name, full_name, phone, phone_number, role, status }) => {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Error('User with this email already exists');

  const payload = await buildCreatePayload({
    email,
    password,
    name,
    full_name,
    phone,
    phone_number,
    role,
    status: status ? status.toUpperCase() : 'OFFLINE', 
  });

  console.log('Creating user with payload:', payload); 

  return prisma.user.create({ data: payload });
};

export const createUser = async ({ email, password, name, full_name, phone, phone_number, role, status, passwordHash }) => {
  const payload = await buildCreatePayload({
    email,
    password,
    passwordHash,
    name,
    full_name,
    phone,
    phone_number,
    role,
    status,
  });

  return prisma.user.create({ data: payload });
};

export const updateUser = async (id, data) => {
  const userId = Number(id);
  const payload = await buildUpdatePayload(data);

  try {
    return await prisma.user.update({ where: { id: userId }, data: payload });
  } catch (e) {
    if (e.code === 'P2002') throw new Error('Email already exists');
    throw e;
  }
};


export const deleteUserById = (id) =>
  prisma.user.delete({ where: { id: Number(id) } });

// service/userService.js
export const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      provider: true,
      // Include other fields you need
      googleId: true,
      picture: true,
      isVerified: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      // Make sure to include verificationCodeExpiresUnix
      verificationCodeExpiresUnix: true,
    }
  });
  
  // Convert BigInt to string for JSON serialization
  return users.map(user => ({
    ...user,
    // Convert BigInt field to string
    verificationCodeExpiresUnix: user.verificationCodeExpiresUnix 
      ? user.verificationCodeExpiresUnix.toString() 
      : null,
    // Also convert dates to ISO strings
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    // Handle other date fields if needed
    lastSeen: user.lastSeen ? user.lastSeen.toISOString() : null,
    lastPasswordChange: user.lastPasswordChange ? user.lastPasswordChange.toISOString() : null,
  }));
};

export const getUserById = (id) =>
  prisma.user.findUnique({ where: { id: Number(id) } });

export const updateUserLastSeen = async (userId) =>
  prisma.user.update({
    where: { id: Number(userId) },
    data: { lastSeen: new Date() },
  });
export const updateCurrentUser = async (userId, data) => {
  const allowedFields = [
    'name', 'full_name', 'phone', 'phone_number', 
    'bio', 'location', 'website', 'dateOfBirth',
    'emailNotifications', 'smsNotifications', 'marketingEmails',
    'language', 'timezone'
  ];
  const updateData = {};
  Object.keys(data).forEach(key => {
    if (allowedFields.includes(key)) {
      updateData[key] = data[key];
    }
  });
  
  if (updateData.full_name) {
    updateData.name = updateData.full_name;
    delete updateData.full_name;
  }
  
  if (updateData.phone_number) {
    updateData.phone = updateData.phone_number;
    delete updateData.phone_number;
  }
  
  if (updateData.dateOfBirth) {
    const dob = new Date(updateData.dateOfBirth);
    if (!isNaN(dob.getTime())) {
      updateData.dateOfBirth = dob;
    } else {
      delete updateData.dateOfBirth;
    }
  }
  
  if (data.email && data.email !== undefined) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    
    if (existingUser && existingUser.id !== userId) {
      throw new Error('Email already in use');
    }
    
    updateData.email = data.email;
    updateData.isVerified = false;
    
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAtUnix = Date.now() + (10 * 60 * 1000);
    
    updateData.verificationCode = verificationCode;
    updateData.verificationCodeExpiresUnix = BigInt(expiresAtUnix);
  }
  
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
    
    const { passwordHash, verificationCode, verificationCodeExpiresUnix, ...safeUser } = updatedUser;
    
    return safeUser;
  } catch (e) {
    if (e.code === 'P2002') {
      throw new Error('Email already exists');
    }
    throw e;
  }
};

export const deleteCurrentUser = async (userId, password = null) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, provider: true },
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  if (user.provider === 'EMAIL' && user.passwordHash) {
    if (!password) {
      throw new Error('Password is required to delete account');
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Incorrect password');
    }
  }
  
  const deletedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      deletedAt: new Date(),
      email: `deleted_${userId}_${Date.now()}@deleted.com`, 
      status: 'OFFLINE',
    },
  });
  
  await prisma.session.deleteMany({
    where: { userId },
  });
  
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
  
  return {
    success: true,
    message: 'Account deleted successfully',
    deletedAt: deletedUser.deletedAt,
  };
};

export const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      isVerified: true,
      provider: true,
      picture: true,
      givenName: true,
      familyName: true,
      locale: true,
      emailVerifiedByGoogle: true,
      bio: true,
      location: true,
      website: true,
      dateOfBirth: true,
      emailNotifications: true,
      smsNotifications: true,
      marketingEmails: true,
      language: true,
      timezone: true,
      createdAt: true,
      updatedAt: true,
      lastSeen: true,
      _count: {
        select: {
          orders: true,
          products: true,
          reviews: true,
          wishlistItems: true,
        },
      },
    },
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return user;
};