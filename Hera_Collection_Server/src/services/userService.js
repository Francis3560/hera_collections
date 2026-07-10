import prisma from '../database.js';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { config } from '../configs/config.js';

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
    passwordHash = await bcrypt.hash(data.password, config.security.bcryptRounds);
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
    isVerified: data.isVerified === true || data.isVerified === 'true',
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
    out.passwordHash = await bcrypt.hash(data.password, config.security.bcryptRounds);
  } else if (data.passwordHash) {
    out.passwordHash = data.passwordHash;
  }

  return out;
};

const LOGIN_LOCK_THRESHOLD = 5;
const LOGIN_LOCK_DURATION_MS = 15 * 60 * 1000;

export const authenticateUser = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) throw new Error('Invalid credentials');

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil - new Date()) / 60000);
    throw new Error(`Account is locked. Please try again in ${minutesLeft} minutes`);
  }

  const ok = await bcrypt.compare(password, user.passwordHash);

  if (!ok) {
    const attempts = user.loginAttempts + 1;
    const data = { loginAttempts: attempts };
    if (attempts >= LOGIN_LOCK_THRESHOLD) {
      data.loginAttempts = 0;
      data.lockedUntil = new Date(Date.now() + LOGIN_LOCK_DURATION_MS);
    }
    await prisma.user.update({ where: { id: user.id }, data }).catch(() => {});
    throw new Error('Invalid credentials');
  }

  if (user.loginAttempts > 0 || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null },
    }).catch(() => {});
  }

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

  try {
    return await prisma.user.create({ data: payload });
  } catch (e) {
    if (e.code === 'P2002') {
      const field = e.meta?.target?.[0] || 'email';
      throw new Error(`User with this ${field} already exists`);
    }
    throw e;
  }
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

  try {
    return await prisma.user.create({ data: payload });
  } catch (e) {
    if (e.code === 'P2002') {
      const field = e.meta?.target?.[0] || 'email';
      throw new Error(`User with this ${field} already exists`);
    }
    throw e;
  }
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
export const getAllUsers = async (params = {}) => {
  const { search, role, status, page = 1, limit = 200 } = params;
  const where = {};
  
  if (role) {
    if (role === 'ADMIN') where.role = 'ADMIN';
    else if (role === 'USER') where.role = 'USER';
  }
  
  if (status) {
      where.status = status;
  }
  
  if (search) {
      where.OR = [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } }
      ];
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (parseInt(page) - 1) * parseInt(limit),
    take: parseInt(limit),
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      provider: true,
      googleId: true,
      picture: true,
      isVerified: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      verificationCodeExpiresUnix: true,
      _count: {
          select: { orders: true }
      }
    }
  });
  
  return users.map(user => ({
    ...user,
    verificationCodeExpiresUnix: user.verificationCodeExpiresUnix 
      ? user.verificationCodeExpiresUnix.toString() 
      : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
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