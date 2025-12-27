import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Users, ChevronDown, ChevronUp, User as UserIcon, Mail, Phone, Globe, CheckCircle } from 'lucide-react';
import { User } from '../types/users';
import { getDisplayName, getInitials } from '../utils/user.utils';

interface UsersListSidebarProps {
  users: User[];
  selectedUser: User | null;
  onUserSelect: (user: User) => void;
  onTabChange: (tab: string) => void;
}

// Function to generate a consistent color based on user ID or name
const getAvatarColor = (userId: string | number | undefined, name?: string): string => {
  // Handle cases where userId might be undefined or not a string
  let idString = '';
  
  if (typeof userId === 'string') {
    idString = userId;
  } else if (typeof userId === 'number') {
    idString = userId.toString();
  } else if (userId === undefined || userId === null) {
    // Use name or email as fallback for hash
    if (name) {
      idString = name;
    } else {
      // Return a default color
      return 'bg-gray-500';
    }
  }
  
  // Use a simple hash function to get consistent colors
  let hash = 0;
  for (let i = 0; i < idString.length; i++) {
    hash = idString.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Color palette: different shades for variety
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

// Get text color based on background color
const getTextColor = (bgColor: string): string => {
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

// Get user status display
const getUserStatusDisplay = (status: string): { text: string; color: string } => {
  switch (status) {
    case 'ONLINE':
      return { text: 'Online', color: 'text-green-500' };
    case 'OFFLINE':
      return { text: 'Offline', color: 'text-gray-500' };
    case 'AWAY':
      return { text: 'Away', color: 'text-amber-500' };
    case 'BUSY':
      return { text: 'Busy', color: 'text-rose-500' };
    default:
      return { text: 'Offline', color: 'text-gray-500' };
  }
};

const UsersListSidebar: React.FC<UsersListSidebarProps> = ({
  users,
  selectedUser,
  onUserSelect,
  onTabChange,
}) => {
  const [showAllUsers, setShowAllUsers] = useState(false);
  
  // Filter out any undefined/null users and ensure we have valid data
  const validUsers = users?.filter((user): user is User => 
    user != null && typeof user === 'object' && 'id' in user
  ) || [];
  
  // Always show 1 user when collapsed, show all when expanded
  const displayedUsers = showAllUsers ? validUsers : validUsers.slice(0, 1);

  // Calculate statistics
  const totalUsers = validUsers.length;
  const activeUsers = validUsers.filter(u => u.status === 'ONLINE').length;
  const verifiedUsers = validUsers.filter(u => u.isVerified).length;
  const adminUsers = validUsers.filter(u => u.role === 'ADMIN').length;

  if (validUsers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Users</CardTitle>
          <CardDescription>No users found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No users to display
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Users</CardTitle>
            <CardDescription>
              {showAllUsers ? `${totalUsers} users` : `${totalUsers} user${totalUsers !== 1 ? 's' : ''} in total`}
            </CardDescription>
          </div>
          {validUsers.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllUsers(!showAllUsers)}
              className="h-8 w-8 p-0"
            >
              {showAllUsers ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Users List */}
        <div className="space-y-2">
          {displayedUsers.map((user) => {
            // Get avatar background color and text color
            const bgColor = getAvatarColor(user.id, user.name || user.email);
            const textColor = getTextColor(bgColor);
            const statusDisplay = getUserStatusDisplay(user.status || 'OFFLINE');
            
            return (
              <motion.div
                key={user.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button
                  variant={selectedUser?.id === user.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start h-auto py-3 px-2 hover:bg-accent"
                  onClick={() => {
                    onUserSelect(user);
                    onTabChange('profile');
                  }}
                >
                  <div className="flex items-center gap-3 w-full">
                    {/* User Avatar with Initials */}
                    <div className="relative flex-shrink-0">
                      <div className={`h-10 w-10 rounded-full ${bgColor} flex items-center justify-center`}>
                        <span className={`text-sm font-medium ${textColor}`}>
                          {getInitials(user)}
                        </span>
                      </div>
                      {/* Status indicator */}
                      {user.status === 'ONLINE' && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                      )}
                    </div>
                    
                    {/* User Info */}
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">
                          {getDisplayName(user)}
                        </p>
                        {user.role === 'ADMIN' && (
                          <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full flex items-center gap-1">
                            <UserIcon className="w-3 h-3" />
                            Admin
                          </span>
                        )}
                        {user.isVerified && (
                          <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <p className="truncate">{user.email}</p>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <p className="truncate">{user.phone}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`flex items-center gap-1 ${statusDisplay.color}`}>
                          <div className={`h-2 w-2 rounded-full ${statusDisplay.color.replace('text-', 'bg-')}`} />
                          {statusDisplay.text}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {user.provider === 'GOOGLE' ? 'Google' : 'Email'}
                        </span>
                      </div>
                    </div>
                    
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </Button>
              </motion.div>
            );
          })}
          
          {/* View All/Collapse button for more than 1 user */}
          {validUsers.length > 1 && (
            <div className="pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowAllUsers(!showAllUsers)}
              >
                <div className="flex items-center gap-2 justify-center w-full">
                  {showAllUsers ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Show less
                    </>
                  ) : (
                    <>
                      <Users className="w-3 h-3" />
                      View all {validUsers.length} users
                    </>
                  )}
                </div>
              </Button>
            </div>
          )}
          
          {/* Quick access to overview tab */}
          {showAllUsers && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs hover:bg-primary hover:text-primary-foreground"
                onClick={() => onTabChange('overview')}
              >
                <div className="flex items-center gap-2 justify-center w-full">
                  <Users className="w-3 h-3" />
                  View Full User Table
                  <ChevronRight className="w-3 h-3" />
                </div>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UsersListSidebar;