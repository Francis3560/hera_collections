import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';

interface AnalyticsProps {
  data: any;
  isLoading: boolean;
}

export const DashboardAnalytics: React.FC<AnalyticsProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return <div className="h-96 w-full bg-muted animate-pulse rounded-xl" />;
  }

  // Data Aggregation
  const trends = data?.trends?.monthly?.map((m: any) => ({
    name: m.month,
    current: m.totalRevenue,
    previous: m.totalRevenue * 0.8 // Comparison baseline
  })) || [];

  const statusData = [
    { status: 'Pending', count: data?.stats?.orderStats?.status?.pending || 0 },
    { status: 'Paid', count: data?.stats?.orderStats?.status?.paid || 0 },
    { status: 'Fulfilled', count: data?.stats?.orderStats?.status?.fulfilled || 0 },
    { status: 'Cancelled', count: data?.stats?.orderStats?.status?.cancelled || 0 },
  ];

  // Growth Metrics Logic
  const totalRevenue = data?.salesAnalytics?.summary?.totalRevenue || 0;
  const totalOrders = data?.salesAnalytics?.summary?.totalOrders || 0;
  const totalExpenses = data?.stats?.expenseStats?.totals?.amount || 0;
  const totalCustomers = data?.salesAnalytics?.summary?.totalCustomers || 0;
  const retentionRate = data?.salesAnalytics?.summary?.retentionRate || 0;
  const growth = data?.salesAnalytics?.summary?.growth || { revenue: 0, orders: 0, customers: 0 };
  
  const cac = totalCustomers > 0 ? (totalExpenses / totalCustomers).toFixed(0) : "0";
  const clv = totalCustomers > 0 ? (totalRevenue / totalCustomers * 1.2).toFixed(0) : "0";
  const retention = `${retentionRate.toFixed(1)}%`;

  const growthMetrics = [
    { 
      label: 'Customer Acquisition Cost', 
      value: `KES ${Number(cac).toLocaleString()}`, 
      trend: `Based on expenses`, 
      color: 'text-muted-foreground' 
    },
    { 
      label: 'Estimated Customer Value', 
      value: `KES ${Number(clv).toLocaleString()}`, 
      trend: `${growth.revenue >= 0 ? '+' : ''}${growth.revenue.toFixed(1)}% revenue`, 
      color: growth.revenue >= 0 ? 'text-success' : 'text-destructive' 
    },
    { 
      label: 'Customer Retention', 
      value: retention, 
      trend: `${growth.customers >= 0 ? '+' : ''}${growth.customers.toFixed(1)}% users`, 
      color: growth.customers >= 0 ? 'text-success' : 'text-destructive' 
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-medium border-none bg-card/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Sales comparison</CardTitle>
            <CardDescription>Current Period Revenue Projection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.1)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '12px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="current" name="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="previous" name="Target" fill="hsl(var(--muted-foreground)/0.3)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-medium border-none bg-card/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Order Fulfillment Health</CardTitle>
            <CardDescription>Order volume by state</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.1)" />
                  <XAxis dataKey="status" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '12px',
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    name="Orders" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3} 
                    dot={{ fill: 'hsl(var(--primary))', r: 6 }} 
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-medium border-none bg-card/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Growth Metrics</CardTitle>
          <CardDescription>Business health indicators based on {data?.salesAnalytics?.timeframe || 'current period'} data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {growthMetrics.map((metric, i) => (
              <div key={i} className="p-4 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors">
                <p className="text-sm text-muted-foreground font-medium">{metric.label}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold tracking-tight">{metric.value}</span>
                  <span className={`text-xs font-bold ${metric.color}`}>{metric.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
