import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, UserPlus, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUsers } from './hooks/useUsers';
import UserStatsGrid from './components/UserStatsGrid';
import UserSearchFilters from './components/UserSearchFilters';
import UsersListSidebar from './components/UsersListSidebar';
import UsersTable from './components/UsersTable';
import UserProfileCard from './components/UserProfileCard';
import LoginHistoryPanel from './components/LoginHistoryPanel';
import UserSettingsPanel from './components/UserSettingsPanel';
import UserDialogs from './components/UserDialogs';
import UserTabs from './components/UserTabs';
import AddUserModal from './components/AddUserModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from './types/users';
import { OrbitProgress } from 'react-loading-indicators';
import userService from '@/api/UserService';

const UsersPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [loadingStates, setLoadingStates] = useState<{
    [userId: string]: {
      editing?: boolean;
      togglingStatus?: boolean;
      deleting?: boolean;
      viewing?: boolean;
    };
  }>({});
  const [dialogLoading, setDialogLoading] = useState(false);
  
  const {
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
  } = useUsers();
  
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUserSelect = (userId: string, selected: boolean) => {
    if (selected) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  // Handle view user with loading state
  const handleViewUser = async (user: User) => {
    setLoadingStates(prev => ({
      ...prev,
      [user.id]: { ...prev[user.id], viewing: true }
    }));
    
    // Simulate loading for view operation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setSelectedUser(user);
    setIsViewDialogOpen(true);
    
    setLoadingStates(prev => ({
      ...prev,
      [user.id]: { ...prev[user.id], viewing: false }
    }));
  };

  // Handle edit user with loading state
  const handleEditUser = async (user: User) => {
    setLoadingStates(prev => ({
      ...prev,
      [user.id]: { ...prev[user.id], editing: true }
    }));
    
    // Simulate loading for edit operation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setSelectedUser(user);
    setIsEditDialogOpen(true);
    
    setLoadingStates(prev => ({
      ...prev,
      [user.id]: { ...prev[user.id], editing: false }
    }));
  };

  // Handle toggle status with loading state
  const handleToggleStatusWithLoading = async (userId: string, currentStatus: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [userId]: { ...prev[userId], togglingStatus: true }
    }));
    
    try {
      await handleToggleStatus(userId, currentStatus);
      toast({
        title: 'Success',
        description: `User ${currentStatus ? 'deactivated' : 'activated'} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    } finally {
      setLoadingStates(prev => ({
        ...prev,
        [userId]: { ...prev[userId], togglingStatus: false }
      }));
    }
  };

  // Handle delete user with loading state
  const handleDeleteUserClick = async () => {
    if (!selectedUser) return;
    
    setDialogLoading(true);
    try {
      await handleDeleteUser(selectedUser.id);
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setDialogLoading(false);
    }
  };

  // Handle delete from table with loading state
  const handleDeleteUserFromTable = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.name || user.email}?`)) {
      return;
    }

    setLoadingStates(prev => ({
      ...prev,
      [user.id]: { ...prev[user.id], deleting: true }
    }));
    
    try {
      await handleDeleteUser(user.id);
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setLoadingStates(prev => ({
        ...prev,
      [user.id]: { ...prev[user.id], deleting: false }
    }));
    }
  };

  const handleSaveEdit = async (updatedUser: Partial<User>) => {
    if (!selectedUser) return;
    
    setDialogLoading(true);
    try {
      // Update role if changed
      if (updatedUser.role && updatedUser.role !== selectedUser.role) {
        await handleUpdateRole(selectedUser.id, updatedUser.role);
      }
      
      // Update status if changed
      if (updatedUser.isActive !== undefined && updatedUser.isActive !== selectedUser.isActive) {
        await handleToggleStatus(selectedUser.id, selectedUser.isActive);
      }
      
      // Update verification if changed
      if (updatedUser.isVerified !== undefined && updatedUser.isVerified !== selectedUser.isVerified) {
        await handleToggleVerification(selectedUser.id, selectedUser.isVerified);
      }
      
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
      setIsEditDialogOpen(false);
      fetchUsers(); // Refresh the list
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setDialogLoading(false);
    }
  };

  const handleUserCreated = (newUser: any) => {
    fetchUsers(); // Refresh the list
    
    toast({
      title: 'Success',
      description: 'User created successfully',
    });
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: 'Warning',
        description: 'No users selected for deletion',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)?`)) {
      return;
    }

    try {
      // Set loading states for all selected users
      const newLoadingStates = { ...loadingStates };
      selectedUsers.forEach(userId => {
        newLoadingStates[userId] = { ...newLoadingStates[userId], deleting: true };
      });
      setLoadingStates(newLoadingStates);

      // Perform bulk delete
      await handleBulkAction('delete', selectedUsers);
      
      toast({
        title: 'Success',
        description: `${selectedUsers.length} user(s) deleted successfully`,
      });
      setSelectedUsers([]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete users',
        variant: 'destructive',
      });
    } finally {
      // Clear loading states
      const clearedLoadingStates = { ...loadingStates };
      selectedUsers.forEach(userId => {
        clearedLoadingStates[userId] = { ...clearedLoadingStates[userId], deleting: false };
      });
      setLoadingStates(clearedLoadingStates);
    }
  };

  const handleBulkActivate = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: 'Warning',
        description: 'No users selected for activation',
      });
      return;
    }

    try {
      // Set loading states for all selected users
      const newLoadingStates = { ...loadingStates };
      selectedUsers.forEach(userId => {
        newLoadingStates[userId] = { ...newLoadingStates[userId], togglingStatus: true };
      });
      setLoadingStates(newLoadingStates);

      // Perform bulk activate
      await handleBulkAction('activate', selectedUsers);
      
      toast({
        title: 'Success',
        description: `${selectedUsers.length} user(s) activated successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to activate users',
        variant: 'destructive',
      });
    } finally {
      // Clear loading states
      const clearedLoadingStates = { ...loadingStates };
      selectedUsers.forEach(userId => {
        clearedLoadingStates[userId] = { ...clearedLoadingStates[userId], togglingStatus: false };
      });
      setLoadingStates(clearedLoadingStates);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: 'Warning',
        description: 'No users selected for deactivation',
      });
      return;
    }

    try {
      // Set loading states for all selected users
      const newLoadingStates = { ...loadingStates };
      selectedUsers.forEach(userId => {
        newLoadingStates[userId] = { ...newLoadingStates[userId], togglingStatus: true };
      });
      setLoadingStates(newLoadingStates);

      // Perform bulk deactivate
      await handleBulkAction('deactivate', selectedUsers);
      
      toast({
        title: 'Success',
        description: `${selectedUsers.length} user(s) deactivated successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to deactivate users',
        variant: 'destructive',
      });
    } finally {
      // Clear loading states
      const clearedLoadingStates = { ...loadingStates };
      selectedUsers.forEach(userId => {
        clearedLoadingStates[userId] = { ...clearedLoadingStates[userId], togglingStatus: false };
      });
      setLoadingStates(clearedLoadingStates);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <OrbitProgress 
          color="#32cd32" 
          size="medium" 
          text="Loading users..." 
          textColor="#6b7280"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          {/* Bulk Actions Dropdown */}
          {selectedUsers.length > 0 && (
            <div className="relative">
              <select 
                className="appearance-none bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onChange={(e) => {
                  const action = e.target.value;
                  if (action === 'delete') handleBulkDelete();
                  if (action === 'activate') handleBulkActivate();
                  if (action === 'deactivate') handleBulkDeactivate();
                  e.target.value = '';
                }}
              >
                <option value="">Bulk Actions...</option>
                <option value="activate">Activate Selected</option>
                <option value="deactivate">Deactivate Selected</option>
                <option value="delete" className="text-destructive">Delete Selected</option>
              </select>
            </div>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => {
              toast({
                title: 'Export Started',
                description: 'Preparing user data for export...',
              });
            }}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button 
            variant="outline" 
            onClick={fetchUsers}
            className="gap-2"
            disabled={loading}
          >
            {loading ? (
              <OrbitProgress color="#32cd32" size="small" text="" textColor="" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </Button>
          <Button 
            className="gap-2"
            onClick={() => setIsAddUserModalOpen(true)}
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <UserStatsGrid stats={stats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Search and Filters */}
        <div className="lg:col-span-1 space-y-6">
          <UserSearchFilters 
            filters={filters}
            onFilterChange={updateFilters}
            filteredUsers={filteredUsers}
          />
          
          <UsersListSidebar
            users={filteredUsers}
            selectedUser={selectedUser}
            onUserSelect={setSelectedUser}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Selected User Info */}
          {selectedUser && (
            <Card className="lg:hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Selected User</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-medium">
                      {selectedUser.firstName?.charAt(0) || selectedUser.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {selectedUser.firstName && selectedUser.lastName 
                        ? `${selectedUser.firstName} ${selectedUser.lastName}`
                        : selectedUser.email.split('@')[0]
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab Navigation */}
          <UserTabs activeTab={activeTab} onTabChange={setActiveTab} />
          
          {/* Tab Content */}
          {activeTab === 'overview' && (
            <UsersTable
              users={users}
              filteredUsers={filteredUsers}
              selectedUsers={selectedUsers}
              onUserSelect={handleUserSelect}
              onSelectAll={handleSelectAll}
              onViewUser={handleViewUser}
              onEditUser={handleEditUser}
              onToggleStatus={handleToggleStatusWithLoading}
              onDeleteUser={handleDeleteUserFromTable}
              loadingStates={loadingStates}
            />
          )}

          {activeTab === 'profile' && selectedUser ? (
            <UserProfileCard 
              user={selectedUser} 
              onEditSettings={() => setActiveTab('settings')}
            />
          ) : activeTab === 'profile' && (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No User Selected</h3>
                <p className="text-muted-foreground mb-6">
                  Please select a user from the list to view their profile
                </p>
                <Button variant="outline" onClick={() => setActiveTab('overview')}>
                  Browse Users
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'history' && selectedUser ? (
            <LoginHistoryPanel user={selectedUser} />
          ) : activeTab === 'history' && (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No User Selected</h3>
                <p className="text-muted-foreground mb-6">
                  Please select a user to view their login history
                </p>
                <Button variant="outline" onClick={() => setActiveTab('overview')}>
                  Browse Users
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'settings' && selectedUser ? (
            <UserSettingsPanel
              user={selectedUser}
              onToggleStatus={() => handleToggleStatus(selectedUser.id, selectedUser.isActive)}
              onToggleVerification={() => handleToggleVerification(selectedUser.id, selectedUser.isVerified)}
              onUpdateRole={(newRole) => handleUpdateRole(selectedUser.id, newRole)}
            />
          ) : activeTab === 'settings' && (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No User Selected</h3>
                <p className="text-muted-foreground mb-6">
                  Please select a user to manage their settings
                </p>
                <Button variant="outline" onClick={() => setActiveTab('overview')}>
                  Browse Users
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs with Loading States */}
      <UserDialogs
        selectedUser={selectedUser}
        isDeleteDialogOpen={isDeleteDialogOpen}
        isEditDialogOpen={isEditDialogOpen}
        isViewDialogOpen={isViewDialogOpen}
        onDeleteDialogChange={setIsDeleteDialogOpen}
        onEditDialogChange={setIsEditDialogOpen}
        onViewDialogChange={setIsViewDialogOpen}
        onDeleteUser={handleDeleteUserClick}
        onSaveEdit={handleSaveEdit}
        isLoading={dialogLoading}
      />

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSuccess={handleUserCreated}
        userService={userService}
      />
    </div>
  );
};

export default UsersPage;