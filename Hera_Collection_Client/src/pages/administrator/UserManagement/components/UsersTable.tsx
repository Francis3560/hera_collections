import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { OrbitProgress } from 'react-loading-indicators';
import { User } from '../types/users';
import { getDisplayName, getInitials } from '../utils/user.utils';
import UserActionsDropdown from './UserActionsDropdown';

// Helper function for avatar colors (same as in sidebar)
const getAvatarColor = (userId: string | number | undefined, name?: string): string => {
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

interface UsersTableProps {
  users: User[];
  filteredUsers: User[];
  selectedUsers: string[];
  onUserSelect: (userId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onViewUser: (user: User) => void;
  onEditUser: (user: User) => Promise<void> | void;
  onToggleStatus: (userId: string, currentStatus: boolean) => Promise<void> | void;
  onDeleteUser: (user: User) => Promise<void> | void;
  loadingStates?: {
    [userId: string]: {
      editing?: boolean;
      togglingStatus?: boolean;
      deleting?: boolean;
    };
  };
}

const UsersTable: React.FC<UsersTableProps> = ({
  users,
  filteredUsers,
  selectedUsers,
  onUserSelect,
  onSelectAll,
  onViewUser,
  onEditUser,
  onToggleStatus,
  onDeleteUser,
  loadingStates = {}
}) => {
  // Local state for loading indicators (fallback if parent doesn't provide)
  const [localLoadingStates, setLocalLoadingStates] = useState<{
    [userId: string]: {
      editing?: boolean;
      togglingStatus?: boolean;
      deleting?: boolean;
    };
  }>({});

  // Use parent loading states if provided, otherwise use local state
  const effectiveLoadingStates = Object.keys(loadingStates).length > 0 
    ? loadingStates 
    : localLoadingStates;

  const handleEdit = async (user: User) => {
    if (effectiveLoadingStates[user.id]?.editing) return;
    
    setLocalLoadingStates(prev => ({
      ...prev,
      [user.id]: { ...prev[user.id], editing: true }
    }));
    
    try {
      await onEditUser(user);
    } finally {
      setLocalLoadingStates(prev => ({
        ...prev,
        [user.id]: { ...prev[user.id], editing: false }
      }));
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    if (effectiveLoadingStates[userId]?.togglingStatus) return;
    
    setLocalLoadingStates(prev => ({
      ...prev,
      [userId]: { ...prev[userId], togglingStatus: true }
    }));
    
    try {
      await onToggleStatus(userId, currentStatus);
    } finally {
      setLocalLoadingStates(prev => ({
        ...prev,
        [userId]: { ...prev[userId], togglingStatus: false }
      }));
    }
  };

  const handleDelete = async (user: User) => {
    if (effectiveLoadingStates[user.id]?.deleting) return;
    
    setLocalLoadingStates(prev => ({
      ...prev,
      [user.id]: { ...prev[user.id], deleting: true }
    }));
    
    try {
      await onDeleteUser(user);
    } finally {
      setLocalLoadingStates(prev => ({
        ...prev,
        [user.id]: { ...prev[user.id], deleting: false }
      }));
    }
  };

  const getLoadingIndicator = (size: 'small' | 'medium' = 'medium') => (
    <OrbitProgress 
      color="#32cd32" 
      size={size} 
      text="" 
      textColor="" 
    />
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Users</CardTitle>
        <CardDescription>
          Complete list of all {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                    disabled={filteredUsers.length === 0}
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const bgColor = getAvatarColor(user.id, user.name || user.email);
                  const userLoading = effectiveLoadingStates[user.id] || {};
                  
                  return (
                    <TableRow 
                      key={user.id} 
                      className="hover:bg-muted/50"
                    >
                      <TableCell>
                        {userLoading.deleting ? (
                          getLoadingIndicator('small')
                        ) : (
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => onUserSelect(user.id, e.target.checked)}
                            className="rounded border-gray-300"
                            disabled={userLoading.deleting}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className={`h-8 w-8 ${bgColor}`}>
                            <AvatarFallback className={`${bgColor.includes('600') || bgColor.includes('500') || bgColor.includes('400') ? 'text-white' : 'text-gray-900'}`}>
                              {getInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {getDisplayName(user)}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {user.email}
                            </p>
                            {user.phone && (
                              <p className="text-xs text-muted-foreground">
                                {user.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.role === 'ADMIN' ? 'default' : 'outline'}
                          className={user.role === 'ADMIN' ? 'bg-primary/10 text-primary border-primary/20' : ''}
                        >
                          {user.role === 'ADMIN' ? 'Administrator' : 'User'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            {user.isVerified && (
                              <Badge variant="outline" className="border-green-500 text-green-500">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="capitalize">{user.provider?.toLowerCase()}</span>
                            {user.deletedAt && (
                              <Badge variant="destructive" className="text-xs">
                                Deleted
                              </Badge>
                            )}
                          </div>
                          {userLoading.togglingStatus && (
                            <div className="mt-1">
                              {getLoadingIndicator('small')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {userLoading.editing || userLoading.deleting || userLoading.togglingStatus ? (
                          <div className="flex justify-end">
                            {getLoadingIndicator('small')}
                          </div>
                        ) : (
                          <UserActionsDropdown
                            user={user}
                            onView={() => onViewUser(user)}
                            onEdit={() => handleEdit(user)}
                            onToggleStatus={() => handleToggleStatus(user.id, user.status === 'ONLINE')}
                            onDelete={() => handleDelete(user)}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Summary footer */}
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <div>
            {selectedUsers.length > 0 && (
              <span>
                {selectedUsers.length} of {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span>Total: {users.length}</span>
            <span>Filtered: {filteredUsers.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UsersTable;