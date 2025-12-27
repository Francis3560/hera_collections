import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import userService from '@/api/userService';
import { User, UserFilters } from '../types/users';
import { calculateStats, applyFilters } from '../utils/user.utils';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    verified: 0,
    admins: 0,
    recent: 0
  });
  const [filters, setFilters] = useState<UserFilters>({
    role: 'all',
    status: 'all',
    verification: 'all',
    search: ''
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!userService.isAuthenticated()) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to access user management',
          variant: 'destructive',
        });
        return;
      }

      if (!userService.isAdmin()) {
        toast({
          title: 'Permission Denied',
          description: 'You need administrator privileges to access this page',
          variant: 'destructive',
        });
        return;
      }

      const response = await userService.getAllUsers();
      let usersData: User[] = [];
      
      if (Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        usersData = response.data.data;
      } else if (response.data && response.data.users) {
        usersData = response.data.users;
      }

      setUsers(usersData);
      const filtered = applyFilters(usersData, filters);
      setFilteredUsers(filtered);
      setStats(calculateStats(filtered));
      
      if (usersData.length > 0 && !selectedUser) {
        setSelectedUser(usersData[0]);
      }

    } catch (error: any) {
      console.error('Error fetching users:', error);
      
      if (error.response?.status === 401) {
        toast({
          title: 'Session Expired',
          description: 'Your login session has expired. Please log in again.',
          variant: 'destructive',
        });
        userService.clearAuthData();
        navigate('/login');
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch users',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [filters, selectedUser, toast, navigate]);

  const handleToggleStatus = useCallback(async (userId: string, currentStatus: boolean) => {
    try {
      await userService.updateUser(userId, { isActive: !currentStatus });
      toast({
        title: 'Success',
        description: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
      await fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    }
  }, [fetchUsers, toast]);

  const handleToggleVerification = useCallback(async (userId: string, currentStatus: boolean) => {
    try {
      await userService.updateUser(userId, { isVerified: !currentStatus });
      toast({
        title: 'Success',
        description: `User verification ${!currentStatus ? 'approved' : 'revoked'}`,
      });
      await fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update verification status',
        variant: 'destructive',
      });
    }
  }, [fetchUsers, toast]);

  const handleUpdateRole = useCallback(async (userId: string, newRole: string) => {
    try {
      await userService.updateUser(userId, { role: newRole });
      toast({
        title: 'Success',
        description: `User role updated to ${newRole}`,
      });
      await fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  }, [fetchUsers, toast]);

  const handleDeleteUser = useCallback(async (userId: string) => {
    try {
      await userService.deleteUser(userId);
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
      await fetchUsers();
      setSelectedUser(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  }, [fetchUsers, toast]);

  const handleBulkAction = useCallback(async (action: string) => {
    if (selectedUsers.length === 0) {
      toast({
        title: 'No users selected',
        description: 'Please select users to perform bulk actions',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (action === 'delete') {
        const deletePromises = selectedUsers.map(userId => 
          userService.deleteUser(userId)
        );
        await Promise.all(deletePromises);
        
        setUsers(users.filter(user => !selectedUsers.includes(user.id)));
        setSelectedUsers([]);
        toast({
          title: 'Success',
          description: `${selectedUsers.length} user(s) deleted successfully`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to perform bulk action',
        variant: 'destructive',
      });
    }
  }, [selectedUsers, users, toast]);

  const updateFilters = useCallback((newFilters: Partial<UserFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  return {
    users,
    filteredUsers,
    selectedUser,
    selectedUsers,
    loading,
    stats,
    filters,
    setSelectedUser,
    setSelectedUsers,
    fetchUsers,
    handleToggleStatus,
    handleToggleVerification,
    handleUpdateRole,
    handleDeleteUser,
    handleBulkAction,
    updateFilters
  };
};