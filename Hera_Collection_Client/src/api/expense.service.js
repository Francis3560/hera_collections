import axiosClient from '../utils/axiosClient';

class ExpenseService {
  /**
   * Fetch all expenses with optional filters and pagination
   * @param {Object} params - Query parameters (startDate, endDate, categoryId, createdById, status, minAmount, maxAmount, search, page, limit, sortBy, sortOrder)
   * @returns {Promise} Axios response data
   */
  getAllExpenses = async (params = {}) => {
    const response = await axiosClient.get('/expenses', { params });
    return response.data;
  };

  /**
   * Fetch a single expense by ID
   * @param {string} id - Expense ID
   * @returns {Promise} Axios response data
   */
  getExpenseById = async (id) => {
    const response = await axiosClient.get(`/expenses/${id}`);
    return response.data;
  };

  /**
   * Create a new expense
   * @param {Object} expenseData - Data for the new expense (title, amount, date, categoryId, etc.)
   * @returns {Promise} Axios response data
   */
  createExpense = async (expenseData) => {
    const response = await axiosClient.post('/expenses', expenseData);
    return response.data;
  };

  /**
   * Update an existing expense
   * @param {string} id - Expense ID to update
   * @param {Object} expenseData - Updated data
   * @returns {Promise} Axios response data
   */
  updateExpense = async (id, expenseData) => {
    const response = await axiosClient.put(`/expenses/${id}`, expenseData);
    return response.data;
  };

  /**
   * Delete an expense
   * @param {string} id - Expense ID to delete
   * @returns {Promise} Axios response data
   */
  deleteExpense = async (id) => {
    const response = await axiosClient.delete(`/expenses/${id}`);
    return response.data;
  };

  /**
   * Fetch expense analytics (Admin only)
   * @param {string} timeframe - 'daily', 'weekly', 'monthly', 'yearly', 'last-month'
   * @returns {Promise} Axios response data
   */
  getExpenseAnalytics = async (timeframe = 'monthly') => {
    const response = await axiosClient.get('/expenses/analytics/expenses', {
      params: { timeframe }
    });
    return response.data;
  };

  /**
   * Fetch general expense statistics (Admin only)
   * @returns {Promise} Axios response data
   */
  getExpenseStats = async () => {
    const response = await axiosClient.get('/expenses/stats/expenses');
    return response.data;
  };

  /**
   * Export expenses (Admin only)
   * @param {Object} params - Export filters (startDate, endDate, categoryId, format)
   * @returns {Promise} Axios response data or download
   */
  exportExpenses = async (params = {}) => {
    const response = await axiosClient.get('/expenses/export/expenses', {
      params,
      responseType: params.format === 'csv' ? 'blob' : 'json'
    });
    return response.data;
  };

  /**
   * Create multiple expenses in one operation
   * @param {Array} expenses - Array of expense objects
   * @returns {Promise} Axios response data
   */
  bulkCreateExpenses = async (expenses) => {
    const response = await axiosClient.post('/expenses/bulk', { expenses });
    return response.data;
  };
}

const expenseService = new ExpenseService();
export default expenseService;
