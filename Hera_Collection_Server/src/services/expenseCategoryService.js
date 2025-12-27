// services/expenseCategoryService.js
import prisma from '../database.js';

export const getAllCategories = async (filters = {}) => {
  const { search, includeExpenses = false } = filters;
  
  const where = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const categories = await prisma.expenseCategory.findMany({
    where,
    include: {
      expenses: includeExpenses ? {
        select: {
          id: true,
          title: true,
          amount: true,
          date: true,
          status: true
        },
        take: 5,
        orderBy: { date: 'desc' }
      } : false,
      _count: {
        select: {
          expenses: true
        }
      }
    },
    orderBy: { name: 'asc' },
  });

  return categories;
};

export const getCategoryById = async (id) => {
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId)) {
    throw new Error('Invalid category ID');
  }

  const category = await prisma.expenseCategory.findUnique({
    where: { id: categoryId },
    include: {
      expenses: {
        select: {
          id: true,
          title: true,
          amount: true,
          date: true,
          status: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { date: 'desc' }
      },
      _count: {
        select: {
          expenses: true
        }
      }
    },
  });

  if (!category) {
    throw new Error('Expense category not found');
  }

  return category;
};

export const createCategory = async (data, userId) => {
  const { name, description, color, icon } = data;

  // Check if category already exists
  const existing = await prisma.expenseCategory.findUnique({
    where: { name },
  });

  if (existing) {
    throw new Error('Expense category with this name already exists');
  }

  const category = await prisma.expenseCategory.create({
    data: {
      name,
      description,
      color,
      icon,
    },
  });

  return category;
};

export const updateCategory = async (id, data) => {
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId)) {
    throw new Error('Invalid category ID');
  }

  // Check if category exists
  const existing = await prisma.expenseCategory.findUnique({
    where: { id: categoryId },
  });

  if (!existing) {
    throw new Error('Expense category not found');
  }

  // If name is being updated, check for conflicts
  if (data.name && data.name !== existing.name) {
    const nameConflict = await prisma.expenseCategory.findUnique({
      where: { name: data.name },
    });

    if (nameConflict) {
      throw new Error('Another expense category with this name already exists');
    }
  }

  const category = await prisma.expenseCategory.update({
    where: { id: categoryId },
    data: {
      name: data.name,
      description: data.description,
      color: data.color,
      icon: data.icon,
    },
  });

  return category;
};

export const deleteCategory = async (id) => {
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId)) {
    throw new Error('Invalid category ID');
  }

  // Check if category exists
  const category = await prisma.expenseCategory.findUnique({
    where: { id: categoryId },
    include: {
      expenses: {
        take: 1,
      },
    },
  });

  if (!category) {
    throw new Error('Expense category not found');
  }

  // Check if category has expenses
  if (category.expenses.length > 0) {
    throw new Error('Cannot delete category with expenses. Remove or reassign expenses first.');
  }

  await prisma.expenseCategory.delete({
    where: { id: categoryId },
  });

  return {
    message: 'Expense category deleted successfully',
    deletedCategory: category.name,
  };
};

export const getCategoryStats = async () => {
  const categories = await prisma.expenseCategory.findMany({
    include: {
      expenses: {
        where: { status: 'ACTIVE' },
        select: {
          amount: true,
        },
      },
    },
  });

  const stats = categories.map(category => {
    const totalAmount = category.expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    );

    return {
      id: category.id,
      name: category.name,
      color: category.color,
      icon: category.icon,
      totalAmount,
      expenseCount: category.expenses.length,
    };
  });

  // Get overall totals
  const allExpenses = await prisma.expense.findMany({
    where: { status: 'ACTIVE' },
    select: { amount: true },
  });

  const totalExpenses = allExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  return {
    categories: stats,
    totals: {
      totalExpenses,
      categoryCount: categories.length,
      averagePerCategory: categories.length > 0 ? totalExpenses / categories.length : 0,
    },
  };
};