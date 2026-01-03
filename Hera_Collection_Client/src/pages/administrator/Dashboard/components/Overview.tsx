import React from 'react';
import { StatsCard } from './StatsCard';
import { RevenueChart } from './charts/RevenueChart';
import { ExpenseBreakdown } from './charts/ExpenseBreakdown';
import { Card } from "@/components/ui/card";
import { DollarSign, ShoppingBag, TrendingUp, AlertTriangle, Users, Package } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

interface OverviewProps {
  data: any;
  isLoading: boolean;
}

export const DashboardOverview: React.FC<OverviewProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-7">
          <div className="md:col-span-4 h-80 rounded-xl bg-muted animate-pulse" />
          <div className="md:col-span-3 h-80 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  const { orderStats, expenseStats, alertStats } = data?.stats || {};
  const salesSummary = data?.salesAnalytics?.summary || {};
  const topProducts = data?.salesAnalytics?.topProducts || [];
  const salesData = data?.trends?.daily?.map((d: any) => ({
    date: `Day ${d.day}`,
    revenue: d.totalRevenue
  })) || [];
  
  // Transform categoryBreakdown object into array for the chart
  const salesCategoryData = Object.entries(data?.salesAnalytics?.categoryBreakdown || {}).map(([name, stats]: [string, any]) => ({
    name,
    value: stats.revenue || 0
  }));

  const expenseData = (data?.expenseAnalytics?.categoryBreakdown || []).map((cat: any) => ({
    name: cat.name,
    value: cat.amount || 0
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Total Revenue" 
          value={salesSummary?.totalRevenue || 0} 
          prefix="KES "
          change={12.5} 
          icon={DollarSign}
          color="primary"
        />
        <StatsCard 
          title="Total Orders" 
          value={salesSummary?.totalOrders || 0} 
          change={8.2} 
          icon={ShoppingBag}
          color="success"
        />
        <StatsCard 
          title="Active Alerts" 
          value={alertStats?.summary?.activeAlerts || 0} 
          icon={AlertTriangle}
          color="destructive"
          description="Requires immediate attention"
        />
        <StatsCard 
          title="Avg Order Value" 
          value={salesSummary?.avgOrderValue || 0} 
          prefix="KES "
          change={3.1} 
          icon={TrendingUp}
          color="info"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <RevenueChart data={salesData} />
        </div>
        <div className="lg:col-span-3">
          <ExpenseBreakdown data={salesCategoryData.length > 0 ? salesCategoryData : expenseData} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard 
          title="Today's Revenue" 
          value={orderStats?.today?.revenue || 0} 
          prefix="KES "
          icon={TrendingUp}
          color="success"
        />
        <StatsCard 
          title="Today's Orders" 
          value={orderStats?.today?.orders || 0} 
          icon={ShoppingBag}
          color="primary"
        />
        <StatsCard 
          title="Total Expenses" 
          value={expenseStats?.totals?.amount || 0} 
          prefix="KES "
          icon={DollarSign}
          color="warning"
        />
      </div>

      {topProducts.length > 0 && (
        <Card className="shadow-medium border-none bg-card/40 backdrop-blur-md overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
            <div className="space-y-4">
              {topProducts.map((product: any) => (
                <div key={product.productId} className="flex items-center justify-between p-3 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {product.title.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.title}</p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">KES {product.totalRevenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{product.totalQuantity} Sold</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
