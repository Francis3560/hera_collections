import { format, subDays, isValid } from 'date-fns';
import { User } from '../types/users';

// Define enums locally since they're not exported from types/users.ts
enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

enum UserStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  AWAY = 'AWAY',
  BUSY = 'BUSY'
}

enum AuthProvider {
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE'
}

// Define filter interface
export interface UserFilters {
  role?: Role | 'all';
  status?: UserStatus | 'all';
  verification?: 'verified' | 'unverified' | 'all';
  provider?: AuthProvider | 'all';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  isDeleted?: boolean;
}

export const getDisplayName = (user: User | undefined | null): string => {
  if (!user) {
    return 'Unknown User';
  }
  
  // First try the 'name' field - ensure it's a string
  if (user.name && typeof user.name === 'string' && user.name.trim()) {
    return user.name.trim();
  }
  
  // Then try combining givenName and familyName (from Google OAuth)
  if (user.givenName || user.familyName) {
    const givenName = user.givenName && typeof user.givenName === 'string' ? user.givenName : '';
    const familyName = user.familyName && typeof user.familyName === 'string' ? user.familyName : '';
    return `${givenName} ${familyName}`.trim();
  }
  
  // Fallback to email username
  if (user.email && typeof user.email === 'string') {
    return user.email.split('@')[0];
  }
  
  // Last resort: use ID
  return `User ${user.id?.toString().substring(0, 6) || 'Unknown'}`;
};

export const getInitials = (user: User | undefined | null): string => {
  // Check if user is defined
  if (!user) {
    return '??';
  }
  
  // First try to get initials from the name field
  if (user.name && typeof user.name === 'string' && user.name.trim()) {
    const name = user.name.trim();
    const nameParts = name.split(/\s+/).filter(part => part.length > 0);
    
    if (nameParts.length === 1) {
      return nameParts[0].substring(0, 2).toUpperCase();
    }
    
    const firstInitial = nameParts[0].charAt(0);
    const lastInitial = nameParts[nameParts.length - 1].charAt(0);
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }
  
  // Then try from givenName and familyName
  if ((user.givenName && typeof user.givenName === 'string') || 
      (user.familyName && typeof user.familyName === 'string')) {
    const firstInitial = (user.givenName && typeof user.givenName === 'string') ? user.givenName.charAt(0) : '';
    const lastInitial = (user.familyName && typeof user.familyName === 'string') ? user.familyName.charAt(0) : '';
    
    if (firstInitial && lastInitial) {
      return `${firstInitial}${lastInitial}`.toUpperCase();
    }
    if (firstInitial) {
      return firstInitial.toUpperCase();
    }
    if (lastInitial) {
      return lastInitial.toUpperCase();
    }
  }
  
  // Fallback to email initials
  if (user.email && typeof user.email === 'string') {
    const emailParts = user.email.split('@')[0];
    if (emailParts.length >= 2) {
      return emailParts.substring(0, 2).toUpperCase();
    }
    return emailParts.substring(0, 1).toUpperCase();
  }
  
  // Last resort
  return '??';
};

// Helper function to safely get initials from any input
export const getInitialsFromString = (input: string | undefined | null): string => {
  if (!input || typeof input !== 'string') {
    return '??';
  }
  
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return '??';
  }
  
  const nameParts = trimmed.split(/\s+/).filter(part => part.length > 0);
  
  if (nameParts.length === 1) {
    return nameParts[0].substring(0, Math.min(2, nameParts[0].length)).toUpperCase();
  }
  
  const firstInitial = nameParts[0].charAt(0);
  const lastInitial = nameParts[nameParts.length - 1].charAt(0);
  
  return `${firstInitial}${lastInitial}`.toUpperCase();
};

/**
 * Formats a date string
 */
export const formatDate = (
  dateString?: string | Date | null, 
  formatString: string = 'MMM dd, yyyy HH:mm'
): string => {
  if (!dateString) return 'Never';
  
  try {
    const date = new Date(dateString);
    if (!isValid(date)) return 'Invalid date';
    return format(date, formatString);
  } catch {
    return 'Invalid date';
  }
};

/**
 * Returns a relative time string (e.g., "2 hours ago")
 */
export const getRelativeTime = (dateString?: string | Date | null): string => {
  if (!dateString) return 'Never';
  
  const date = new Date(dateString);
  if (!isValid(date)) return 'Invalid date';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);
  
  if (diffYear > 0) return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`;
  if (diffMonth > 0) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffSec > 30) return `${diffSec} seconds ago`;
  
  return 'Just now';
};

/**
 * Calculates user statistics - OLD VERSION (keeping for backward compatibility)
 * This matches the original function signature you had
 */
export const calculateStats = (users: User[]): {
  total: number;
  active: number;
  verified: number;
  admins: number;
  recent: number;
} => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
  
  return {
    total: users.length,
    active: users.filter(u => u.status === UserStatus.ONLINE).length,
    verified: users.filter(u => u.isVerified).length,
    admins: users.filter(u => u.role === Role.ADMIN).length,
    recent: users.filter(u => new Date(u.createdAt) > thirtyDaysAgo).length
  };
};

/**
 * Calculates user statistics - NEW VERSION with more stats
 */
export const calculateUserStats = (users: User[]): {
  total: number;
  online: number;
  verified: number;
  admins: number;
  recent: number;
  withGoogle: number;
  withEmail: number;
} => {
  const thirtyDaysAgo = subDays(new Date(), 30);
  
  return {
    total: users.length,
    online: users.filter(u => u.status === UserStatus.ONLINE).length,
    verified: users.filter(u => u.isVerified).length,
    admins: users.filter(u => u.role === Role.ADMIN).length,
    recent: users.filter(u => new Date(u.createdAt) > thirtyDaysAgo).length,
    withGoogle: users.filter(u => u.provider === AuthProvider.GOOGLE).length,
    withEmail: users.filter(u => u.provider === AuthProvider.EMAIL).length,
  };
};

/**
 * Applies filters to users - OLD VERSION (keeping for backward compatibility)
 * This matches the original function signature you had
 */
export const applyFilters = (users: User[], filters: any): User[] => {
  let filtered = [...users];
  
  if (filters.role !== 'all') {
    filtered = filtered.filter(user => user.role === filters.role);
  }
  
  if (filters.status !== 'all') {
    filtered = filtered.filter(user => 
      filters.status === 'active' ? user.status === UserStatus.ONLINE : user.status !== UserStatus.ONLINE
    );
  }
  
  if (filters.verification !== 'all') {
    filtered = filtered.filter(user => 
      filters.verification === 'verified' ? user.isVerified : !user.isVerified
    );
  }
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(user => 
      user.email?.toLowerCase().includes(searchLower) ||
      user.name?.toLowerCase().includes(searchLower) ||
      user.givenName?.toLowerCase().includes(searchLower) ||
      user.familyName?.toLowerCase().includes(searchLower) ||
      (user.phone && user.phone.includes(searchLower))
    );
  }
  
  return filtered;
};

/**
 * Applies filters to users - NEW VERSION with typed filters
 */
export const applyUserFilters = (users: User[], filters: UserFilters): User[] => {
  let filtered = [...users];
  
  // Role filter
  if (filters.role && filters.role !== 'all') {
    filtered = filtered.filter(user => user.role === filters.role);
  }
  
  // Status filter
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(user => user.status === filters.status);
  }
  
  // Verification filter
  if (filters.verification && filters.verification !== 'all') {
    filtered = filtered.filter(user => 
      filters.verification === 'verified' ? user.isVerified : !user.isVerified
    );
  }
  
  // Provider filter
  if (filters.provider && filters.provider !== 'all') {
    filtered = filtered.filter(user => user.provider === filters.provider);
  }
  
  // Deleted filter
  if (typeof filters.isDeleted === 'boolean') {
    filtered = filtered.filter(user => 
      filters.isDeleted === true ? user.deletedAt : !user.deletedAt
    );
  }
  
  // Date range filter
  if (filters.dateFrom) {
    const dateFrom = new Date(filters.dateFrom);
    filtered = filtered.filter(user => new Date(user.createdAt) >= dateFrom);
  }
  
  if (filters.dateTo) {
    const dateTo = new Date(filters.dateTo);
    filtered = filtered.filter(user => new Date(user.createdAt) <= dateTo);
  }
  
  // Search filter
  if (filters.search && filters.search.trim()) {
    const searchLower = filters.search.toLowerCase().trim();
    
    filtered = filtered.filter(user => {
      const searchFields = [
        user.name,
        user.email,
        user.givenName,
        user.familyName,
        user.phone,
        user.bio,
        user.location,
        user.id?.toString()
      ].filter(field => field && typeof field === 'string');
      
      return searchFields.some(field => 
        field.toLowerCase().includes(searchLower)
      );
    });
  }
  
  return filtered;
};

/**
 * Sorts users by field
 */
export const sortUsers = (
  users: User[], 
  field: keyof User = 'createdAt', 
  direction: 'asc' | 'desc' = 'desc'
): User[] => {
  return [...users].sort((a, b) => {
    let aValue = a[field];
    let bValue = b[field];
    
    // Handle undefined/null values
    if (aValue === null || aValue === undefined) return direction === 'asc' ? -1 : 1;
    if (bValue === null || bValue === undefined) return direction === 'asc' ? 1 : -1;
    
    // Handle dates
    if (field === 'createdAt' || field === 'updatedAt' || field === 'lastSeen' || field === 'deletedAt') {
      aValue = new Date(aValue as string).getTime();
      bValue = new Date(bValue as string).getTime();
    }
    
    // Handle numbers
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    // Handle strings
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return direction === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return 0;
  });
};

/**
 * Gets user status color for UI
 */
export const getUserStatusColor = (status: UserStatus): string => {
  switch (status) {
    case UserStatus.ONLINE: return 'bg-green-500';
    case UserStatus.OFFLINE: return 'bg-gray-500';
    case UserStatus.AWAY: return 'bg-amber-500';
    case UserStatus.BUSY: return 'bg-rose-500';
    default: return 'bg-gray-500';
  }
};

/**
 * Gets role display name
 */
export const getRoleDisplayName = (role: Role): string => {
  switch (role) {
    case Role.ADMIN: return 'Administrator';
    case Role.USER: return 'User';
    default: return role;
  }
};

/**
 * Gets provider display name
 */
export const getProviderDisplayName = (provider: AuthProvider): string => {
  switch (provider) {
    case AuthProvider.EMAIL: return 'Email';
    case AuthProvider.GOOGLE: return 'Google';
    default: return provider;
  }
};

/**
 * Formats user phone number for display
 */
export const formatPhoneNumber = (phone?: string | null): string => {
  if (!phone) return '';
  
  // Remove non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format Kenyan phone numbers
  if (cleaned.startsWith('254') && cleaned.length === 12) {
    return `+${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)} ${cleaned.substring(9)}`;
  }
  
  // Format other international numbers
  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }
  
  return phone;
};

/**
 * Checks if user is currently active (seen recently)
 */
export const isUserCurrentlyActive = (user: User, thresholdMinutes: number = 15): boolean => {
  if (user.status === UserStatus.ONLINE) return true;
  
  if (user.lastSeen) {
    const lastSeen = new Date(user.lastSeen);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
    
    return diffMinutes < thresholdMinutes;
  }
  
  return false;
};

/**
 * Generates avatar color based on user ID or name
 */
export const getAvatarColor = (userId: string | number | undefined, name?: string): string => {
  let idString = '';
  
  if (typeof userId === 'string') {
    idString = userId;
  } else if (typeof userId === 'number') {
    idString = userId.toString();
  } else if (userId === undefined || userId === null) {
    if (name) {
      idString = name;
    } else {
      return 'bg-gray-500';
    }
  }
  
  let hash = 0;
  for (let i = 0; i < idString.length; i++) {
    hash = idString.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    'bg-blue-500',
    'bg-blue-400',
    'bg-blue-600',
    'bg-green-500',
    'bg-green-400',
    'bg-green-600',
    'bg-purple-500',
    'bg-purple-400',
    'bg-purple-600',
    'bg-amber-500',
    'bg-amber-400',
    'bg-amber-600',
    'bg-rose-500',
    'bg-rose-400',
    'bg-rose-600',
    'bg-cyan-500',
    'bg-cyan-400',
    'bg-cyan-600',
  ];
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

/**
 * Gets text color based on background color
 */
export const getTextColor = (bgColor: string): string => {
  // For dark backgrounds, use white text
  if (bgColor.includes('600') || bgColor.includes('700') || bgColor.includes('800') || bgColor.includes('900')) {
    return 'text-white';
  }
  // For medium backgrounds, check if they need white text
  if (bgColor.includes('500') || bgColor.includes('400')) {
    return 'text-white';
  }
  // For light backgrounds, use dark text
  return 'text-gray-900';
};