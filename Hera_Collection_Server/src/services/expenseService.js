// services/expenseService.js
import prisma from '../database.js';
import { Prisma } from '@prisma/client';
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';

export const getAllExpenses = async (filters = {}) => {
  const {
    startDate,
    endDate,
    categoryId,
    createdById,
    status = 'ACTIVE',
    minAmount,
    maxAmount,
    search,
    page = 1,
    limit = 20,
    sortBy = 'date',
    sortOrder = 'desc',
  } = filters;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const where = {
    status,
  };

  // Date range filter
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  // Amount range filter
  if (minAmount || maxAmount) {
    where.amount = {};
    if (minAmount) where.amount.gte = new Prisma.Decimal(minAmount);
    if (maxAmount) where.amount.lte = new Prisma.Decimal(maxAmount);
  }

  // Category filter
  if (categoryId) {
    where.categoryId = parseInt(categoryId);
  }

  // Created by filter
  if (createdById) {
    where.createdById = parseInt(createdById);
  }

  // Search filter
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { referenceNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Define sort options
  const orderBy = {};
  if (sortBy === 'amount') {
    orderBy.amount = sortOrder;
  } else if (sortBy === 'title') {
    orderBy.title = sortOrder;
  } else {
    orderBy.date = sortOrder;
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy,
      skip,
      take: parseInt(limit),
    }),
    prisma.expense.count({ where }),
  ]);

  return {
    expenses,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
};

export const getExpenseById = async (id) => {
  const expenseId = Number(id);
  if (!Number.isInteger(expenseId)) {
    throw new Error('Invalid expense ID');
  }

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          color: true,
          icon: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!expense) {
    throw new Error('Expense not found');
  }

  return expense;
};

export const createExpense = async (data, userId) => {
  const {
    title,
    description,
    amount,
    date,
    categoryId,
    paymentMethod,
    referenceNumber,
    receiptUrl,
  } = data;

  // Normalize empty strings to null for optional unique/metadata fields
  const normalizedReferenceNumber = referenceNumber === '' ? null : referenceNumber;
  const normalizedReceiptUrl = receiptUrl === '' ? null : receiptUrl;

  // Validate amount
  if (!amount || amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  // Check if category exists (if provided)
  if (categoryId) {
    const category = await prisma.expenseCategory.findUnique({
      where: { id: parseInt(categoryId) },
    });

    if (!category) {
      throw new Error('Expense category not found');
    }
  }

  // Check if reference number is unique (if provided)
  if (normalizedReferenceNumber) {
    const existing = await prisma.expense.findUnique({
      where: { referenceNumber: normalizedReferenceNumber },
    });

    if (existing) {
      throw new Error('Expense with this reference number already exists');
    }
  }

  const expense = await prisma.expense.create({
    data: {
      title,
      description,
      amount: new Prisma.Decimal(amount),
      date: date ? new Date(date) : new Date(),
      categoryId: categoryId ? parseInt(categoryId) : null,
      createdById: parseInt(userId),
      paymentMethod: paymentMethod || 'CASH',
      referenceNumber: normalizedReferenceNumber,
      receiptUrl: normalizedReceiptUrl,
      status: 'ACTIVE',
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return expense;
};

export const updateExpense = async (id, data, userId) => {
  const expenseId = Number(id);
  if (!Number.isInteger(expenseId)) {
    throw new Error('Invalid expense ID');
  }

  // Check if expense exists
  const existing = await prisma.expense.findUnique({
    where: { id: expenseId },
  });

  if (!existing) {
    throw new Error('Expense not found');
  }

  // Check if user is authorized (only creator or admin can update)
  // You'll need to check the user's role in the controller

  // Check if category exists (if being updated)
  if (data.categoryId) {
    const category = await prisma.expenseCategory.findUnique({
      where: { id: parseInt(data.categoryId) },
    });

    if (!category) {
      throw new Error('Expense category not found');
    }
  }

  // Check if reference number is unique (if being updated)
  const normalizedUpdateReference = data.referenceNumber === '' ? null : data.referenceNumber;
  
  if (normalizedUpdateReference && normalizedUpdateReference !== existing.referenceNumber) {
    const referenceConflict = await prisma.expense.findUnique({
      where: { referenceNumber: normalizedUpdateReference },
    });

    if (referenceConflict) {
      throw new Error('Another expense with this reference number already exists');
    }
  }

  // Prepare update data
  const updateData = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.amount !== undefined) updateData.amount = new Prisma.Decimal(data.amount);
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.categoryId !== undefined) {
    updateData.categoryId = data.categoryId ? parseInt(data.categoryId) : null;
  }
  if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
  if (data.referenceNumber !== undefined) {
    updateData.referenceNumber = data.referenceNumber === '' ? null : data.referenceNumber;
  }
  if (data.receiptUrl !== undefined) {
    updateData.receiptUrl = data.receiptUrl === '' ? null : data.receiptUrl;
  }
  if (data.status !== undefined) updateData.status = data.status;

  const expense = await prisma.expense.update({
    where: { id: expenseId },
    data: updateData,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return expense;
};

export const deleteExpense = async (id) => {
  const expenseId = Number(id);
  if (!Number.isInteger(expenseId)) {
    throw new Error('Invalid expense ID');
  }

  // Check if expense exists
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
  });

  if (!expense) {
    throw new Error('Expense not found');
  }

  // Soft delete by marking as cancelled
  await prisma.expense.update({
    where: { id: expenseId },
    data: { status: 'CANCELLED' },
  });

  return {
    message: 'Expense cancelled successfully',
    expenseId: expense.id,
    title: expense.title,
    amount: expense.amount,
  };
};

export const getExpenseAnalytics = async (timeframe = 'monthly') => {
  const now = new Date();
  let startDate, endDate;

  switch (timeframe) {
    case 'daily':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;
    case 'weekly':
      startDate = new Date(now.setDate(now.getDate() - 7));
      endDate = new Date();
      break;
    case 'monthly':
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      break;
    case 'yearly':
      startDate = startOfYear(now);
      endDate = endOfYear(now);
      break;
    case 'last-month':
      startDate = startOfMonth(subMonths(now, 1));
      endDate = endOfMonth(subMonths(now, 1));
      break;
    default:
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
  }

  // Get total expenses for period
  const expenses = await prisma.expense.findMany({
    where: {
      status: 'ACTIVE',
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });
  const totalAmount = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );
  const categoryBreakdown = {};
  expenses.forEach(expense => {
    const categoryName = expense.category?.name || 'Uncategorized';
    const categoryId = expense.category?.id || 0;
    const categoryColor = expense.category?.color || '#999999';

    if (!categoryBreakdown[categoryName]) {
      categoryBreakdown[categoryName] = {
        id: categoryId,
        name: categoryName,
        color: categoryColor,
        amount: 0,
        count: 0,
        percentage: 0,
      };
    }

    categoryBreakdown[categoryName].amount += Number(expense.amount);
    categoryBreakdown[categoryName].count += 1;
  });
  Object.values(categoryBreakdown).forEach(category => {
    category.percentage = totalAmount > 0 ? (category.amount / totalAmount) * 100 : 0;
  });
  const paymentMethodBreakdown = {};
  expenses.forEach(expense => {
    const method = expense.paymentMethod;
    if (!paymentMethodBreakdown[method]) {
      paymentMethodBreakdown[method] = {
        amount: 0,
        count: 0,
      };
    }
    paymentMethodBreakdown[method].amount += Number(expense.amount);
    paymentMethodBreakdown[method].count += 1;
  });
  const recentExpenses = await prisma.expense.findMany({
    where: {
      status: 'ACTIVE',
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { date: 'desc' },
    take: 10,
  });
  const monthlyTrends = [];
  for (let i = 0; i < 12; i++) {
    const monthStart = new Date(now.getFullYear(), i, 1);
    const monthEnd = new Date(now.getFullYear(), i + 1, 0, 23, 59, 59, 999);

    const monthExpenses = await prisma.expense.findMany({
      where: {
        status: 'ACTIVE',
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: { amount: true },
    });

    const monthTotal = monthExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    );

    monthlyTrends.push({
      month: monthStart.toLocaleString('default', { month: 'short' }),
      year: monthStart.getFullYear(),
      total: monthTotal,
      count: monthExpenses.length,
    });
  }

  return {
    timeframe,
    period: {
      start: startDate,
      end: endDate,
    },
    summary: {
      totalAmount,
      expenseCount: expenses.length,
      averageExpense: expenses.length > 0 ? totalAmount / expenses.length : 0,
    },
    categoryBreakdown: Object.values(categoryBreakdown),
    paymentMethodBreakdown,
    recentExpenses,
    monthlyTrends,
  };
};

export const getExpenseStats = async () => {
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const previousMonthStart = startOfMonth(subMonths(now, 1));
  const previousMonthEnd = endOfMonth(subMonths(now, 1));

  const [
    totalExpenses,
    currentMonthExpenses,
    previousMonthExpenses,
    uncategorizedExpenses,
    topCategories,
    topSpenders,
  ] = await Promise.all([
    prisma.expense.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: {
        status: 'ACTIVE',
        date: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: {
        status: 'ACTIVE',
        date: {
          gte: previousMonthStart,
          lte: previousMonthEnd,
        },
      },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.count({
      where: {
        status: 'ACTIVE',
        categoryId: null,
      },
    }),
    prisma.expense.groupBy({
      by: ['categoryId'],
      where: { status: 'ACTIVE' },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: 5,
    }),
    prisma.expense.groupBy({
      by: ['createdById'],
      where: { status: 'ACTIVE' },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: 5,
    }),
  ]);
  const categoryIds = topCategories.map(item => item.categoryId).filter(Boolean);
  const categories = await prisma.expenseCategory.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, color: true },
  });
  const userIds = topSpenders.map(item => item.createdById);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  const currentMonthTotal = Number(currentMonthExpenses._sum.amount) || 0;
  const previousMonthTotal = Number(previousMonthExpenses._sum.amount) || 0;
  const monthOverMonthChange = previousMonthTotal > 0 
    ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 
    : currentMonthTotal > 0 ? 100 : 0;

  return {
    totals: {
      amount: Number(totalExpenses._sum.amount) || 0,
      count: totalExpenses._count || 0,
      average: totalExpenses._count > 0 
        ? Number(totalExpenses._sum.amount) / totalExpenses._count 
        : 0,
    },
    currentMonth: {
      amount: currentMonthTotal,
      count: currentMonthExpenses._count || 0,
      average: currentMonthExpenses._count > 0 
        ? currentMonthTotal / currentMonthExpenses._count 
        : 0,
    },
    previousMonth: {
      amount: previousMonthTotal,
      count: previousMonthExpenses._count || 0,
    },
    monthOverMonthChange: parseFloat(monthOverMonthChange.toFixed(2)),
    uncategorizedCount: uncategorizedExpenses,
    topCategories: topCategories.map(item => {
      const category = categories.find(c => c.id === item.categoryId);
      return {
        categoryId: item.categoryId,
        categoryName: category?.name || 'Uncategorized',
        categoryColor: category?.color || '#999999',
        totalAmount: Number(item._sum.amount) || 0,
        expenseCount: item._count || 0,
      };
    }),
    topSpenders: topSpenders.map(item => {
      const user = users.find(u => u.id === item.createdById);
      return {
        userId: item.createdById,
        userName: user?.name || 'Unknown',
        userEmail: user?.email || 'N/A',
        totalAmount: Number(item._sum.amount) || 0,
        expenseCount: item._count || 0,
      };
    }),
  };
};

export const exportExpenses = async (filters = {}) => {
  const { startDate, endDate, categoryId, format = 'json' } = filters;
  
  const where = {
    status: 'ACTIVE',
  };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  if (categoryId) {
    where.categoryId = parseInt(categoryId);
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: {
      category: {
        select: {
          name: true,
        },
      },
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { date: 'desc' },
  });

  if (format === 'csv') {
    const headers = ['ID', 'Title', 'Description', 'Amount', 'Date', 'Category', 'Payment Method', 'Reference', 'Created By', 'Status'];
    const rows = expenses.map(expense => [
      expense.id,
      `"${expense.title.replace(/"/g, '""')}"`,
      `"${(expense.description || '').replace(/"/g, '""')}"`,
      expense.amount,
      expense.date.toISOString().split('T')[0],
      expense.category?.name || 'Uncategorized',
      expense.paymentMethod,
      expense.referenceNumber || '',
      expense.createdBy.name,
      expense.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return {
      format: 'csv',
      data: csvContent,
      filename: `expenses_${new Date().toISOString().split('T')[0]}.csv`,
    };
  }

  return {
    format: 'json',
    data: expenses,
    count: expenses.length,
    generatedAt: new Date().toISOString(),
  };
};