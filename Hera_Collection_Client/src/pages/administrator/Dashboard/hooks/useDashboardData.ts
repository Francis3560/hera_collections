import { useQuery } from '@tanstack/react-query';
import orderService from '@/api/order.service';
import expenseService from '@/api/expense.service';
import stockService from '@/api/stock.service';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export const useDashboardData = (period: string, dateRange: { from: Date | undefined; to: Date | undefined }) => {
  
  const getParams = () => {
    if (period === 'custom' && dateRange.from && dateRange.to) {
      return {
        startDate: format(dateRange.from, 'yyyy-MM-dd'),
        endDate: format(dateRange.to, 'yyyy-MM-dd'),
      };
    }
    return { timeframe: period };
  };

  const params = getParams();

  const statsQuery = useQuery({
    queryKey: ['dashboard-stats', params],
    queryFn: async () => {
      const [orderStatsRes, expenseStatsRes, alertStatsRes] = await Promise.all([
        orderService.getOrderStats(),
        expenseService.getExpenseStats(),
        stockService.getAlertStats(),
      ]);
      return { 
        orderStats: orderStatsRes.data, 
        expenseStats: expenseStatsRes.data, 
        alertStats: alertStatsRes.data 
      };
    }
  });

  const salesAnalyticsQuery = useQuery({
    queryKey: ['sales-analytics', params],
    queryFn: async () => {
      const res = await orderService.getOrderAnalytics(period === 'custom' ? 'custom' : period);
      return res.data;
    }
  });

  const trendsQuery = useQuery({
    queryKey: ['sales-trends', params],
    queryFn: async () => {
      const res = await orderService.getSalesTrends(params);
      return res.data;
    }
  });

  const expenseAnalyticsQuery = useQuery({
    queryKey: ['expense-analytics', params],
    queryFn: async () => {
      const res = await expenseService.getExpenseAnalytics(period === 'custom' ? 'monthly' : period);
      return res.data;
    }
  });

  const activeAlertsQuery = useQuery({
    queryKey: ['active-alerts'],
    queryFn: async () => {
      const res = await stockService.getActiveAlerts();
      return res.data;
    }
  });

  return {
    stats: statsQuery.data,
    salesAnalytics: salesAnalyticsQuery.data,
    trends: trendsQuery.data,
    expenseAnalytics: expenseAnalyticsQuery.data,
    activeAlerts: activeAlertsQuery.data,
    isLoading: statsQuery.isLoading || salesAnalyticsQuery.isLoading || trendsQuery.isLoading,
    isError: statsQuery.isError || salesAnalyticsQuery.isError,
    refetch: () => {
      statsQuery.refetch();
      salesAnalyticsQuery.refetch();
      trendsQuery.refetch();
      expenseAnalyticsQuery.refetch();
      activeAlertsQuery.refetch();
    }
  };
};
