import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, CheckCircle, MailCheck, Shield, TrendingUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<any>;
  color: string;
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, description }) => (
  <Card className="bg-card border-border/50 hover:border-primary/50 transition-colors">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-2">{title}</p>
          <h3 className="text-3xl font-bold">{value}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${color.replace('text-', '')}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

interface UserStatsGridProps {
  stats: {
    total: number;
    active: number;
    verified: number;
    admins: number;
    recent: number;
  };
}

const UserStatsGrid: React.FC<UserStatsGridProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        title="Total Users"
        value={stats.total}
        icon={Users}
        color="text-blue-500"
      />
      <StatCard
        title="Active Users"
        value={stats.active}
        icon={CheckCircle}
        color="text-green-500"
        description={`${Math.round((stats.active / stats.total) * 100)}% of total`}
      />
      <StatCard
        title="Verified Users"
        value={stats.verified}
        icon={MailCheck}
        color="text-purple-500"
        description={`${Math.round((stats.verified / stats.total) * 100)}% verified`}
      />
      <StatCard
        title="Administrators"
        value={stats.admins}
        icon={Shield}
        color="text-amber-500"
      />
      <StatCard
        title="New Users (30d)"
        value={stats.recent}
        icon={TrendingUp}
        color="text-cyan-500"
      />
    </div>
  );
};

export default UserStatsGrid;