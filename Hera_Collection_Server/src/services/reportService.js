import prisma from '../database.js';
import * as orderService from './orderService.js';
import * as expenseService from './expenseService.js';
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, startOfDay, subDays, subYears } from 'date-fns';

/**
 * Get Sales Summary Report Data
 */
export const getSalesSummaryData = async (startDate, endDate) => {
  const where = {
    status: { in: ['PAID', 'FULFILLED'] },
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: {
        include: {
          product: {
            select: { title: true, category: { select: { name: true } } }
          }
        }
      },
      buyer: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return orders;
};

/**
 * Get Expense Report Data
 */
export const getExpenseData = async (startDate, endDate) => {
  const where = {
    status: 'ACTIVE',
  };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: {
      category: { select: { name: true } },
      createdBy: { select: { name: true } }
    },
    orderBy: { date: 'desc' }
  });

  return expenses;
};

/**
 * Get Inventory Value Data
 */
export const getInventoryValueData = async () => {
  const variants = await prisma.productVariant.findMany({
    where: { isActive: true },
    include: {
      product: {
        select: { 
          title: true, 
          category: { select: { name: true } } 
        }
      }
    }
  });

  return variants;
};

/**
 * Get Profit and Loss Data
 */
export const getProfitLossData = async (startDate, endDate) => {
  const dateFilter = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) dateFilter.lte = new Date(endDate);

  const [sales, expenses] = await Promise.all([
    prisma.order.aggregate({
      where: {
        status: { in: ['PAID', 'FULFILLED'] },
        ...(startDate || endDate ? { createdAt: dateFilter } : {})
      },
      _sum: { totalAmount: true },
      _count: true
    }),
    prisma.expense.aggregate({
      where: {
        status: 'ACTIVE',
        ...(startDate || endDate ? { date: dateFilter } : {})
      },
      _sum: { amount: true },
      _count: true
    })
  ]);

  const totalRevenue = Number(sales._sum.totalAmount) || 0;
  const totalExpenses = Number(expenses._sum.amount) || 0;

  return {
    period: { startDate, endDate },
    summary: {
      totalRevenue,
      totalExpenses,
      grossProfit: totalRevenue - totalExpenses,
      netProfit: totalRevenue - totalExpenses, // Simplified for now
      operatingMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0
    },
    counts: {
      orderCount: sales._count,
      expenseCount: expenses._count
    }
  };
};
/**
 * Get Growth and Performance Metrics Data
 */
export const getGrowthMetricsData = async (startDate, endDate, timeframe = 'monthly') => {
  const analytics = await orderService.getSalesAnalytics(timeframe, { startDate, endDate });
  const expenses = await expenseService.getExpenseStats({ startDate, endDate });

  const totalRevenue = analytics.summary.totalRevenue;
  const totalCustomers = analytics.summary.totalCustomers;
  const totalOrders = analytics.summary.totalOrders;
  const totalExpenses = expenses.totals.amount;

  const cac = totalCustomers > 0 ? totalExpenses / totalCustomers : 0;
  const clv = totalCustomers > 0 ? (totalRevenue / totalCustomers) * 1.2 : 0;

  return {
    summary: {
      ...analytics.summary,
      cac,
      clv,
      totalExpenses
    },
    growth: analytics.summary.growth,
    recentTrends: analytics.recentOrders
  };
};
