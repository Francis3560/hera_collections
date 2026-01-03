import prisma from '../database.js';

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
