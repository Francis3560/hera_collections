// controllers/expenseController.js
import * as expenseService from '../services/expenseService.js';

export const getAllExpenses = async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      categoryId: req.query.categoryId,
      createdById: req.query.createdById,
      status: req.query.status,
      minAmount: req.query.minAmount,
      maxAmount: req.query.maxAmount,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    };

    const result = await expenseService.getAllExpenses(filters);

    return res.status(200).json({
      success: true,
      data: result.expenses,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Failed to fetch expenses:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses',
    });
  }
};

export const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await expenseService.getExpenseById(id);

    return res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error('Failed to fetch expense:', error);
    
    if (error.message === 'Expense not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch expense',
    });
  }
};

export const createExpense = async (req, res) => {
  try {
    const expense = await expenseService.createExpense(req.body, req.auth.userId);

    return res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: expense,
    });
  } catch (error) {
    console.error('Failed to create expense:', error);
    
    if (error.message.includes('not found') || 
        error.message.includes('already exists') ||
        error.message.includes('Amount must be')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create expense',
    });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await expenseService.updateExpense(id, req.body, req.auth.userId);

    return res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: expense,
    });
  } catch (error) {
    console.error('Failed to update expense:', error);
    
    if (error.message === 'Expense not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('not found') || 
        error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update expense',
    });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await expenseService.deleteExpense(id);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        expenseId: result.expenseId,
        title: result.title,
        amount: result.amount,
      },
    });
  } catch (error) {
    console.error('Failed to delete expense:', error);
    
    if (error.message === 'Expense not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to delete expense',
    });
  }
};

export const getExpenseAnalytics = async (req, res) => {
  try {
    const timeframe = req.query.timeframe || 'monthly';
    const analytics = await expenseService.getExpenseAnalytics(timeframe);

    return res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Failed to fetch expense analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch expense analytics',
    });
  }
};

export const getExpenseStats = async (req, res) => {
  try {
    const stats = await expenseService.getExpenseStats();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Failed to fetch expense stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch expense statistics',
    });
  }
};

export const exportExpenses = async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      categoryId: req.query.categoryId,
      format: req.query.format || 'json',
    };

    const result = await expenseService.exportExpenses(filters);

    if (result.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      return res.send(result.data);
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      count: result.count,
      generatedAt: result.generatedAt,
    });
  } catch (error) {
    console.error('Failed to export expenses:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to export expenses',
    });
  }
};

export const bulkCreateExpenses = async (req, res) => {
  try {
    const { expenses } = req.body;

    if (!Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Expenses array is required and cannot be empty',
      });
    }

    // Validate each expense
    for (const expense of expenses) {
      if (!expense.title || !expense.amount) {
        return res.status(400).json({
          success: false,
          message: 'Each expense must have a title and amount',
        });
      }
    }

    const createdExpenses = [];
    const errors = [];

    for (const expenseData of expenses) {
      try {
        const expense = await expenseService.createExpense(expenseData, req.auth.userId);
        createdExpenses.push(expense);
      } catch (error) {
        errors.push({
          expense: expenseData,
          error: error.message,
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: `Created ${createdExpenses.length} expenses successfully`,
      data: {
        created: createdExpenses,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error('Failed to bulk create expenses:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to bulk create expenses',
    });
  }
};