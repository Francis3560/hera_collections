import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Globe, Monitor, Smartphone } from 'lucide-react';
import { User } from '../types/users';
import { getDisplayName, formatDate } from '../utils/user.utils';

interface LoginHistoryPanelProps {
  user: User;
}

// Mock login history data - in a real app, this would come from an API
const mockLoginHistory = [
  {
    id: 1,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    device: 'Web Browser',
    browser: 'Chrome 120.0',
    os: 'Windows 11',
    ip: '192.168.1.100',
    location: 'Nairobi, Kenya',
    successful: true,
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    device: 'Mobile App',
    browser: 'Safari',
    os: 'iOS 17.2',
    ip: '192.168.1.101',
    location: 'Nairobi, Kenya',
    successful: true,
  },
  {
    id: 3,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    device: 'Web Browser',
    browser: 'Firefox 121.0',
    os: 'macOS 14.2',
    ip: '192.168.1.102',
    location: 'Mombasa, Kenya',
    successful: true,
  },
];

const getDeviceIcon = (device: string) => {
  switch (device.toLowerCase()) {
    case 'mobile app':
      return <Smartphone className="w-4 h-4" />;
    case 'web browser':
      return <Globe className="w-4 h-4" />;
    default:
      return <Monitor className="w-4 h-4" />;
  }
};

const LoginHistoryPanel: React.FC<LoginHistoryPanelProps> = ({ user }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Login History</CardTitle>
        <CardDescription>
          Recent login activity for {getDisplayName(user)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockLoginHistory.map((login) => (
            <div key={login.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Successful Login</p>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getDeviceIcon(login.device)}
                      {login.device}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1 mt-1">
                    <p>{formatDate(login.timestamp)}</p>
                    <div className="flex items-center gap-4">
                      <span>IP: {login.ip}</span>
                      <span>Location: {login.location}</span>
                    </div>
                    <p>{login.browser} on {login.os}</p>
                  </div>
                </div>
              </div>
              <Badge variant={login.successful ? 'default' : 'destructive'}>
                {login.successful ? 'Success' : 'Failed'}
              </Badge>
            </div>
          ))}
          
          {/* Show message if no login history */}
          {mockLoginHistory.length === 0 && (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Login History</h3>
              <p className="text-muted-foreground">
                {getDisplayName(user)} hasn't logged in yet
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginHistoryPanel;