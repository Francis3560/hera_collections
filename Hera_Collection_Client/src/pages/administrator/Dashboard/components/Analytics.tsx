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

  const trends = data?.trends?.monthly?.map((m: any) => ({
    name: m.month,
    current: m.totalRevenue,
    previous: m.totalRevenue * 0.8 // Simulate comparison for now
  })) || [];

  const statusData = [
    { status: 'Pending', count: data?.stats?.orderStats?.status?.pending || 0 },
    { status: 'Paid', count: data?.stats?.orderStats?.status?.paid || 0 },
    { status: 'Fulfilled', count: data?.stats?.orderStats?.status?.fulfilled || 0 },
    { status: 'Cancelled', count: data?.stats?.orderStats?.status?.cancelled || 0 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-medium border-none bg-card/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Sales Comparison</CardTitle>
            <CardDescription>Current vs Previous Period Performance</CardDescription>
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
                  <Bar dataKey="current" name="Current Period" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="previous" name="Previous Period" fill="hsl(var(--muted-foreground)/0.3)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-medium border-none bg-card/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
            <CardDescription>Volume of orders by their current fulfillment state</CardDescription>
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
          <CardDescription>Detailed business growth indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: 'Customer Acquisition Cost', value: 'KES 1,240.00', trend: '+2%' },
              { label: 'Customer Lifetime Value', value: 'KES 84,000.00', trend: '+15%' },
              { label: 'Retention Rate', value: '78%', trend: '+5%' }
            ].map((metric, i) => (
              <div key={i} className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold">{metric.value}</span>
                  <span className="text-xs text-success font-medium">{metric.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
