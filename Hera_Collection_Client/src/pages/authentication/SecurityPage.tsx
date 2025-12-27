import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { OrbitProgress } from "react-loading-indicators";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Shield,
  Lock,
  Key,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut,
  RefreshCw,
  ShieldCheck,
  History,
  SmartphoneIcon,
  Laptop,
  TabletSmartphone,
} from "lucide-react";

// Full page loader component
const FullPageLoader = ({ message = "Processing..." }: { message?: string }) => (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="text-center space-y-6">
      <OrbitProgress 
        color="#32cd32" 
        size="medium" 
        text="" 
        textColor=""
      />
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent mb-2">
          {message}
        </h2>
        <p className="text-muted-foreground">
          Please wait while we process your request...
        </p>
      </div>
    </div>
  </div>
);

// Response Modal Component
const ResponseModal = ({ 
  type, 
  title, 
  message, 
  isVisible, 
  onClose 
}: { 
  type: 'success' | 'error';
  title: string;
  message: string;
  isVisible: boolean;
  onClose: () => void;
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const bgColor = type === 'success' 
    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/30' 
    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/30';
  
  const textColor = type === 'success' 
    ? 'text-green-700 dark:text-green-300' 
    : 'text-red-700 dark:text-red-300';

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-right duration-300">
      <div className={`rounded-lg border p-4 shadow-lg ${bgColor} max-w-sm`}>
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 rounded-full p-1 ${type === 'success' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
            {type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`font-semibold ${textColor}`}>{title}</h3>
            <p className={`text-sm mt-1 ${type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <AlertCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Session Device Component
const SessionDevice = ({ device, currentSession, onTerminate }: any) => {
  const getDeviceIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <TabletSmartphone className="h-4 w-4" />;
      case 'desktop':
        return <Laptop className="h-4 w-4" />;
      default:
        return <SmartphoneIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          {getDeviceIcon(device.type)}
        </div>
        <div>
          <p className="font-medium">{device.name || `${device.type} Device`}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{device.browser || 'Unknown Browser'}</span>
            <span>•</span>
            <span>{device.location || 'Unknown Location'}</span>
            <span>•</span>
            <span>{new Date(device.lastActive).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {currentSession && (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Current
          </Badge>
        )}
        {!currentSession && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTerminate(device.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Terminate
          </Button>
        )}
      </div>
    </div>
  );
};

// Security Status Component
const SecurityStatus = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'strong':
        return { color: 'bg-green-500', text: 'Strong', icon: <ShieldCheck className="h-4 w-4" /> };
      case 'medium':
        return { color: 'bg-yellow-500', text: 'Medium', icon: <AlertCircle className="h-4 w-4" /> };
      case 'weak':
        return { color: 'bg-red-500', text: 'Weak', icon: <AlertCircle className="h-4 w-4" /> };
      default:
        return { color: 'bg-gray-500', text: 'Unknown', icon: <AlertCircle className="h-4 w-4" /> };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className="flex items-center gap-2">
      <div className={`h-3 w-3 rounded-full ${config.color}`} />
      <span className="flex items-center gap-1">
        {config.icon}
        {config.text}
      </span>
    </div>
  );
};

const SecurityPage = () => {
  const { user, userProfile, logout, updateProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State for different sections
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showFullLoader, setShowFullLoader] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState('');
  
  // Form states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Sessions state
  const [sessions, setSessions] = useState<any[]>([]);
  const [terminatingSession, setTerminatingSession] = useState<string | null>(null);
  
  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginNotifications: true,
    sessionTimeout: 30, // minutes
    requireReauthForSensitive: true,
  });
  
  // Response modal state
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseType, setResponseType] = useState<'success' | 'error'>('success');
  const [responseTitle, setResponseTitle] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

  // Load sessions and security data
  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      // Mock sessions data - replace with API call
      const mockSessions = [
        {
          id: '1',
          name: 'Chrome on Windows',
          type: 'desktop',
          browser: 'Chrome 120',
          location: 'Nairobi, Kenya',
          lastActive: new Date().toISOString(),
          current: true,
        },
        {
          id: '2',
          name: 'Safari on iPhone',
          type: 'mobile',
          browser: 'Safari 16',
          location: 'Nairobi, Kenya',
          lastActive: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          current: false,
        },
        {
          id: '3',
          name: 'Firefox on Mac',
          type: 'desktop',
          browser: 'Firefox 115',
          location: 'Unknown',
          lastActive: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          current: false,
        },
      ];
      setSessions(mockSessions);
    } catch (error) {
      console.error('Failed to load security data:', error);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirm password do not match.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsChangingPassword(true);
    setShowFullLoader(true);
    setLoaderMessage('Changing your password...');

    const loadingSteps = [
      { message: "Validating current password...", duration: 800 },
      { message: "Securing new password...", duration: 1000 },
      { message: "Updating security records...", duration: 1200 },
    ];

    try {
      for (const step of loadingSteps) {
        setLoaderMessage(step.message);
        await new Promise(resolve => setTimeout(resolve, step.duration));
      }

      // Here you would call your API to change password
      // For now, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 500));

      setLoaderMessage('Password changed successfully!');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Show success
      setResponseType('success');
      setResponseTitle('Password Updated');
      setResponseMessage('Your password has been changed successfully.');
      setShowResponseModal(true);

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
        variant: "default",
        duration: 3000,
      });

      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Close loader
      setTimeout(() => {
        setShowFullLoader(false);
        setIsChangingPassword(false);
      }, 1000);

    } catch (error: any) {
      setShowFullLoader(false);
      setIsChangingPassword(false);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to change password';
      
      setResponseType('error');
      setResponseTitle('Change Failed');
      setResponseMessage(errorMessage);
      setShowResponseModal(true);

      toast({
        title: "Change Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    setTerminatingSession(sessionId);
    
    try {
      // Here you would call your API to terminate session
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Remove session from list
      setSessions(sessions.filter(session => session.id !== sessionId));
      
      toast({
        title: "Session Terminated",
        description: "The selected session has been terminated.",
        variant: "default",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Termination Failed",
        description: "Failed to terminate the session.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setTerminatingSession(null);
    }
  };

  const handleTerminateAllSessions = async () => {
    try {
      // Here you would call your API to terminate all sessions
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Keep only current session
      const currentSession = sessions.find(s => s.current);
      setSessions(currentSession ? [currentSession] : []);
      
      toast({
        title: "All Sessions Terminated",
        description: "All other sessions have been terminated.",
        variant: "default",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Termination Failed",
        description: "Failed to terminate sessions.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleSecuritySettingChange = (setting: string, value: any) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: value,
    }));
  };

  const handleLogoutAll = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out Everywhere",
        description: "You have been logged out from all devices.",
        variant: "default",
        duration: 3000,
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "Failed to log out from all devices.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    if (password.length === 0) return 'none';
    if (password.length < 8) return 'weak';
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const score = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
    
    if (score >= 4) return 'strong';
    if (score >= 2) return 'medium';
    return 'weak';
  };

  const passwordStrength = checkPasswordStrength(passwordForm.newPassword);

  return (
    <div className="space-y-6">
      {/* Response Modal */}
      <ResponseModal
        type={responseType}
        title={responseTitle}
        message={responseMessage}
        isVisible={showResponseModal}
        onClose={() => setShowResponseModal(false)}
      />

      {/* Full page loader */}
      {showFullLoader && (
        <FullPageLoader message={loaderMessage} />
      )}

      {/* Security Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Overview
          </CardTitle>
          <CardDescription>
            Review and manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Account Status</Label>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {user?.isVerified ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>{user?.isVerified ? 'Verified' : 'Unverified'}</span>
                </div>
                {!user?.isVerified && (
                  <Button size="sm" variant="outline" onClick={() => navigate('/verify-email')}>
                    Verify
                  </Button>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Password Strength</Label>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <SecurityStatus status="strong" />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => document.getElementById('change-password-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Change
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Active Sessions</Label>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>{sessions.length} device{sessions.length !== 1 ? 's' : ''}</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => document.getElementById('active-sessions-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  View
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card id="change-password-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  placeholder="Enter current password"
                  disabled={isChangingPassword}
                  className="pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  disabled={isChangingPassword}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  placeholder="Enter new password"
                  disabled={isChangingPassword}
                  className="pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={isChangingPassword}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              
              {/* Password Strength Indicator */}
              {passwordForm.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Password strength:</span>
                    <SecurityStatus status={passwordStrength} />
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordStrength === 'weak' ? 'w-1/3 bg-red-500' :
                        passwordStrength === 'medium' ? 'w-2/3 bg-yellow-500' :
                        passwordStrength === 'strong' ? 'w-full bg-green-500' :
                        'w-0'
                      }`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use at least 8 characters with a mix of letters, numbers, and symbols
                  </p>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                  disabled={isChangingPassword}
                  className="pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isChangingPassword}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {passwordForm.newPassword && passwordForm.confirmPassword && 
               passwordForm.newPassword !== passwordForm.confirmPassword && (
                <p className="text-sm text-red-500">Passwords do not match</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isChangingPassword || 
                       !passwordForm.currentPassword || 
                       !passwordForm.newPassword || 
                       !passwordForm.confirmPassword ||
                       passwordForm.newPassword !== passwordForm.confirmPassword}
            >
              {isChangingPassword ? (
                <div className="flex items-center gap-2">
                  <OrbitProgress color="#FFFFFF" size="small" text="" textColor="" />
                  <span>Changing Password...</span>
                </div>
              ) : (
                "Change Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Active Sessions Card */}
      <Card id="active-sessions-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Devices where you're currently logged in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {sessions.map((session) => (
              <SessionDevice
                key={session.id}
                device={session}
                currentSession={session.current}
                onTerminate={handleTerminateSession}
              />
            ))}
          </div>
          
          {sessions.filter(s => !s.current).length > 0 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleTerminateAllSessions}
              disabled={terminatingSession !== null}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Terminate All Other Sessions
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Security Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Configure your account security preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base">Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Switch
              checked={securitySettings.twoFactorEnabled}
              onCheckedChange={(checked) => handleSecuritySettingChange('twoFactorEnabled', checked)}
            />
          </div>

          {/* Login Notifications */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base">Login Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when someone logs into your account
              </p>
            </div>
            <Switch
              checked={securitySettings.loginNotifications}
              onCheckedChange={(checked) => handleSecuritySettingChange('loginNotifications', checked)}
            />
          </div>

          {/* Session Timeout */}
          <div className="p-4 border rounded-lg">
            <div className="space-y-2">
              <Label className="text-base">Session Timeout</Label>
              <p className="text-sm text-muted-foreground">
                Automatically log out after inactivity
              </p>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => handleSecuritySettingChange('sessionTimeout', parseInt(e.target.value))}
                  className="w-24"
                  min="5"
                  max="1440"
                />
                <span className="text-sm">minutes</span>
              </div>
            </div>
          </div>

          {/* Sensitive Actions Re-authentication */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base">Re-authentication for Sensitive Actions</Label>
              <p className="text-sm text-muted-foreground">
                Require password confirmation for sensitive changes
              </p>
            </div>
            <Switch
              checked={securitySettings.requireReauthForSensitive}
              onCheckedChange={(checked) => handleSecuritySettingChange('requireReauthForSensitive', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone Card */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Critical actions that affect your account security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Log Out Everywhere */}
          <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="space-y-2">
              <Label className="text-base text-red-600">Log Out From All Devices</Label>
              <p className="text-sm text-muted-foreground">
                This will log you out from all devices including this one
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out Everywhere
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-red-600">Log Out From All Devices</DialogTitle>
                    <DialogDescription>
                      This action will log you out from all devices. You will need to log in again on each device.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {}}>Cancel</Button>
                    <Button variant="destructive" onClick={handleLogoutAll}>Confirm Logout</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Request Account Data */}
          <div className="p-4 border rounded-lg">
            <div className="space-y-2">
              <Label className="text-base">Download Account Data</Label>
              <p className="text-sm text-muted-foreground">
                Request a copy of all your personal data
              </p>
              <Button variant="outline">
                <History className="h-4 w-4 mr-2" />
                Request Data Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityPage;