// controllers/expenseCategoryController.js
import * as expenseCategoryService from '../services/expenseCategoryService.js';

export const getAllCategories = async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      includeExpenses: req.query.includeExpenses === 'true',
    };

    const categories = await expenseCategoryService.getAllCategories(filters);

    return res.status(200).json({
      success: true,
      data: categories,
      count: categories.length,
    });
  } catch (error) {
    console.error('Failed to fetch expense categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch expense categories',
    });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await expenseCategoryService.getCategoryById(id);

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Failed to fetch expense category:', error);
    
    if (error.message === 'Expense category not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch expense category',
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const category = await expenseCategoryService.createCategory(req.body, req.auth.userId);

    return res.status(201).json({
      success: true,
      message: 'Expense category created successfully',
      data: category,
    });
  } catch (error) {
    console.error('Failed to create expense category:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create expense category',
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await expenseCategoryService.updateCategory(id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Expense category updated successfully',
      data: category,
    });
  } catch (error) {
    console.error('Failed to update expense category:', error);
    
    if (error.message === 'Expense category not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update expense category',
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await expenseCategoryService.deleteCategory(id);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        deletedCategory: result.deletedCategory,
      },
    });
  } catch (error) {
    console.error('Failed to delete expense category:', error);
    
    if (error.message === 'Expense category not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('Cannot delete category')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to delete expense category',
    });
  }
};

export const getCategoryStats = async (req, res) => {
  try {
    const stats = await expenseCategoryService.getCategoryStats();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Failed to fetch category stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch category statistics',
    });
  }
};