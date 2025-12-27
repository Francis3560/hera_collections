export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: 'ADMIN' | 'USER' | 'STAFF';
  isVerified: boolean;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  profileImage?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  loginCount?: number;
}

export interface UserFilters {
  role: string;
  status: string;
  verification: string;
  search: string;
}

export interface UserStats {
  total: number;
  active: number;
  verified: number;
  admins: number;
  recent: number;
}

export interface UserContextType {
  users: User[];
  filteredUsers: User[];
  selectedUser: User | null;
  selectedUsers: string[];
  loading: boolean;
  stats: UserStats;
  filters: UserFilters;
  setFilters: (filters: UserFilters) => void;
  setSelectedUser: (user: User | null) => void;
  setSelectedUsers: (ids: string[]) => void;
  fetchUsers: () => Promise<void>;
  handleToggleStatus: (userId: string, currentStatus: boolean) => Promise<void>;
  handleToggleVerification: (userId: string, currentStatus: boolean) => Promise<void>;
  handleUpdateRole: (userId: string, newRole: string) => Promise<void>;
  handleDeleteUser: (userId: string) => Promise<void>;
  handleBulkAction: (action: string) => Promise<void>;
}