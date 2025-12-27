import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Settings, Mail, Phone, Calendar, Clock, Shield, User as UserIcon, Globe, CheckCircle } from 'lucide-react';
import { User } from '../types/users';
import { getInitials, getDisplayName, formatDate, getAvatarColor, getTextColor } from '../utils/user.utils';

interface UserProfileCardProps {
  user: User;
  onEditSettings: () => void;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ user, onEditSettings }) => {
  // Get avatar colors
  const bgColor = getAvatarColor(user.id, user.name || user.email);
  const textColor = getTextColor(bgColor);

  // Get status display
  const getStatusDisplay = () => {
    switch (user.status) {
      case 'ONLINE':
        return { text: 'Online', variant: 'default' as const, className: 'bg-green-100 text-green-800' };
      case 'OFFLINE':
        return { text: 'Offline', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' };
      case 'AWAY':
        return { text: 'Away', variant: 'default' as const, className: 'bg-amber-100 text-amber-800' };
      case 'BUSY':
        return { text: 'Busy', variant: 'default' as const, className: 'bg-rose-100 text-rose-800' };
      default:
        return { text: 'Offline', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' };
    }
  };

  // Get role display
  const getRoleDisplay = () => {
    switch (user.role) {
      case 'ADMIN':
        return 'Administrator';
      case 'USER':
        return 'User';
      default:
        return user.role || 'User';
    }
  };

  // Get provider display
  const getProviderDisplay = () => {
    switch (user.provider) {
      case 'GOOGLE':
        return 'Google';
      case 'EMAIL':
        return 'Email';
      default:
        return user.provider || 'Unknown';
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className={`w-20 h-20 ${bgColor}`}>
              <AvatarFallback className={`text-xl ${textColor}`}>
                {getInitials(user)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{getDisplayName(user)}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" />
                {user.email || 'No email provided'}
              </CardDescription>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  <UserIcon className="w-3 h-3 mr-1" />
                  {getRoleDisplay()}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Globe className="w-3 h-3 mr-1" />
                  {getProviderDisplay()}
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onEditSettings}>
            <Settings className="w-4 h-4 mr-2" />
            Edit Settings
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Status & Verification */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-sm">Status</Label>
              <div className="mt-1">
                <Badge variant={statusDisplay.variant} className={statusDisplay.className}>
                  {statusDisplay.text}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Verification</Label>
              <div className="mt-1">
                <Badge 
                  variant={user.isVerified ? 'outline' : 'secondary'} 
                  className={user.isVerified ? 'border-green-500 text-green-500' : ''}
                >
                  {user.isVerified ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </>
                  ) : (
                    'Pending'
                  )}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm">Phone</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium">{user.phone || 'Not provided'}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Location</Label>
                <p className="font-medium mt-1">{user.location || 'Not specified'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Account Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm">Created</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium">{formatDate(user.createdAt)}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Updated</Label>
                <p className="font-medium mt-1">{formatDate(user.updatedAt)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm">Last Seen</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium">{formatDate(user.lastSeen) || 'Never'}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Login Attempts</Label>
                <p className="font-medium mt-1">{user.loginAttempts || 0}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Security & Preferences */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Security & Preferences</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm">Two-Factor Auth</Label>
                <div className="mt-1">
                  <Badge variant={user.twoFactorEnabled ? 'default' : 'secondary'}>
                    <Shield className="w-3 h-3 mr-1" />
                    {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Last Password Change</Label>
                <p className="font-medium mt-1">{formatDate(user.lastPasswordChange) || 'Never'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm">Email Notifications</Label>
                <div className="mt-1">
                  <Badge variant={user.emailNotifications ? 'default' : 'secondary'}>
                    {user.emailNotifications ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">SMS Notifications</Label>
                <div className="mt-1">
                  <Badge variant={user.smsNotifications ? 'default' : 'secondary'}>
                    {user.smsNotifications ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm">Language</Label>
                <p className="font-medium mt-1">{user.language || 'English (en)'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Timezone</Label>
                <p className="font-medium mt-1">{user.timezone || 'UTC'}</p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {user.bio && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Bio</Label>
                <p className="text-sm text-foreground whitespace-pre-line">{user.bio}</p>
              </div>
            </>
          )}

          {/* Soft Delete Notice */}
          {user.deletedAt && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">
                This account was deleted on {formatDate(user.deletedAt)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfileCard;