import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, RotateCcw, Mail, Phone, Shield, Bell, Lock, AlertTriangle } from 'lucide-react';
import { User } from '../types/user.types';
import { getDisplayName } from '../utils/user.utils';

interface UserSettingsPanelProps {
  user: User;
  onToggleStatus: () => Promise<void>;
  onToggleVerification: () => Promise<void>;
  onUpdateRole: (newRole: string) => Promise<void>;
  onUpdateUser?: (updatedUser: Partial<User>) => Promise<void>;
}

const UserSettingsPanel: React.FC<UserSettingsPanelProps> = ({
  user,
  onToggleStatus,
  onToggleVerification,
  onUpdateRole,
  onUpdateUser,
}) => {
  // State for form fields
  const [role, setRole] = useState(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [isVerified, setIsVerified] = useState(user.isVerified);
  const [emailNotifications, setEmailNotifications] = useState(user.emailNotifications || false);
  const [smsNotifications, setSmsNotifications] = useState(user.smsNotifications || false);
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [notes, setNotes] = useState('');
  
  // Loading states for async operations
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [verificationUpdating, setVerificationUpdating] = useState(false);
  const [roleUpdating, setRoleUpdating] = useState(false);

  // Check if there are any changes
  const hasChanges = 
    role !== user.role ||
    isActive !== user.isActive ||
    isVerified !== user.isVerified ||
    emailNotifications !== user.emailNotifications ||
    smsNotifications !== user.smsNotifications ||
    firstName !== (user.firstName || '') ||
    lastName !== (user.lastName || '') ||
    phone !== (user.phone || '');

  // Handle save all changes
  const handleSaveAll = async () => {
    if (!hasChanges) return;
    
    setSaving(true);
    try {
      // Update role if changed
      if (role !== user.role) {
        setRoleUpdating(true);
        await onUpdateRole(role);
        setRoleUpdating(false);
      }
      
      // Update status if changed
      if (isActive !== user.isActive) {
        setStatusUpdating(true);
        await onToggleStatus();
        setStatusUpdating(false);
      }
      
      // Update verification if changed
      if (isVerified !== user.isVerified) {
        setVerificationUpdating(true);
        await onToggleVerification();
        setVerificationUpdating(false);
      }
      
      // Update other user details if onUpdateUser is provided
      if (onUpdateUser && (firstName !== user.firstName || lastName !== user.lastName || phone !== user.phone)) {
        const updates: Partial<User> = {};
        if (firstName !== user.firstName) updates.firstName = firstName;
        if (lastName !== user.lastName) updates.lastName = lastName;
        if (phone !== user.phone) updates.phone = phone;
        await onUpdateUser(updates);
      }
      
      // Show success message
      // Note: Actual toast would come from parent component
    } catch (error) {
      console.error('Failed to save changes:', error);
    } finally {
      setSaving(false);
    }
  };

  // Handle reset to original values
  const handleReset = () => {
    setRole(user.role);
    setIsActive(user.isActive);
    setIsVerified(user.isVerified);
    setEmailNotifications(user.emailNotifications || false);
    setSmsNotifications(user.smsNotifications || false);
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setPhone(user.phone || '');
    setNotes('');
  };

  // Handle quick actions
  const handleQuickAction = async (action: string) => {
    switch (action) {
      case 'resetPassword':
        // This would trigger a password reset email
        console.log('Reset password for:', user.id);
        break;
      case 'sendWelcome':
        // This would send a welcome email
        console.log('Send welcome email to:', user.email);
        break;
      case 'forceLogout':
        // This would force logout from all devices
        console.log('Force logout for:', user.id);
        break;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Settings</CardTitle>
            <CardDescription>
              Manage settings for <span className="font-medium">{getDisplayName(user)}</span>
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReset}
              disabled={!hasChanges || saving}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Button 
              size="sm" 
              onClick={handleSaveAll}
              disabled={!hasChanges || saving}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-8">
          {/* Account Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Account Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter first name"
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter last name"
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="mt-2 bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed
                </p>
              </div>
              
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 XXX XXX XXX"
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Account Status Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Account Status</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Account Status</p>
                    <p className="text-sm text-muted-foreground">
                      Enable or disable user access
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isActive ? 'default' : 'secondary'}>
                      {isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Switch
                      checked={isActive}
                      onCheckedChange={setIsActive}
                      disabled={statusUpdating}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Verification</p>
                    <p className="text-sm text-muted-foreground">
                      Mark email as verified
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isVerified ? 'outline' : 'secondary'}>
                      {isVerified ? 'Verified' : 'Pending'}
                    </Badge>
                    <Switch
                      checked={isVerified}
                      onCheckedChange={setIsVerified}
                      disabled={verificationUpdating}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="role" className="mb-2 block">User Role</Label>
                  <Select 
                    value={role} 
                    onValueChange={setRole}
                    disabled={roleUpdating}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-amber-500" />
                          <span>Administrator</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="STAFF">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-500" />
                          <span>Staff</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="USER">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-green-500" />
                          <span>User</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="mt-2 text-sm text-muted-foreground space-y-1">
                    <p>• Administrators have full system access</p>
                    <p>• Staff have limited admin privileges</p>
                    <p>• Users have basic access rights</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Notification Preferences */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Notification Preferences</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive system notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive urgent notifications via SMS
                    </p>
                  </div>
                  <Switch
                    checked={smsNotifications}
                    onCheckedChange={setSmsNotifications}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Users will receive notifications for:
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    Account security alerts
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    System announcements
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    Important updates
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    Password reset requests
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <Separator />

          {/* Quick Actions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Quick Actions</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                onClick={() => handleQuickAction('resetPassword')}
              >
                <Lock className="w-5 h-5" />
                <div className="text-center">
                  <p className="font-medium">Reset Password</p>
                  <p className="text-xs text-muted-foreground">
                    Send password reset email
                  </p>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                onClick={() => handleQuickAction('sendWelcome')}
              >
                <Mail className="w-5 h-5" />
                <div className="text-center">
                  <p className="font-medium">Send Welcome</p>
                  <p className="text-xs text-muted-foreground">
                    Send welcome email
                  </p>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                onClick={() => handleQuickAction('forceLogout')}
              >
                <Lock className="w-5 h-5" />
                <div className="text-center">
                  <p className="font-medium">Force Logout</p>
                  <p className="text-xs text-muted-foreground">
                    Logout from all devices
                  </p>
                </div>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Admin Notes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-semibold">Admin Notes</h3>
            </div>
            
            <div>
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add internal notes about this user (only visible to admins)"
                className="mt-2 min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                These notes are only visible to administrators
              </p>
            </div>
          </div>

          <Separator />

          {/* Danger Zone */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-destructive/30 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-destructive">Temporary Suspension</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Temporarily suspend this user account
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    disabled={!user.isActive}
                  >
                    Suspend
                  </Button>
                </div>
              </div>
              
              <div className="p-4 border border-destructive/30 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-destructive">Delete Account</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Permanently delete this user account
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                  >
                    Delete
                  </Button>
                </div>
                <p className="text-xs text-destructive/80 mt-2">
                  Warning: This action cannot be undone
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">Important Notes:</p>
              <ul className="text-xs text-destructive/80 mt-1 space-y-1">
                <li>• Suspended users cannot log in until reinstated</li>
                <li>• Deleted accounts cannot be recovered</li>
                <li>• Associated data may be permanently removed</li>
                <li>• Notify the user before taking these actions</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserSettingsPanel;