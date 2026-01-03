import axiosClient from '../utils/axiosClient';

class ExpenseCategoryService {
  /**
   * Fetch all expense categories with optional filters
   * @param {Object} params - Query parameters (search, includeExpenses)
   * @returns {Promise} Axios response data
   */
  getAllCategories = async (params = {}) => {
    const response = await axiosClient.get('/expense-categories', { params });
    return response.data;
  };

  /**
   * Fetch a single expense category by ID
   * @param {string} id - Category ID
   * @returns {Promise} Axios response data
   */
  getCategoryById = async (id) => {
    const response = await axiosClient.get(`/expense-categories/${id}`);
    return response.data;
  };

  /**
   * Fetch category statistics (Admin only)
   * @returns {Promise} Axios response data
   */
  getCategoryStats = async () => {
    const response = await axiosClient.get('/expense-categories/stats/categories');
    return response.data;
  };

  /**
   * Create a new expense category
   * @param {Object} categoryData - Data for the new category (name, description, color, etc.)
   * @returns {Promise} Axios response data
   */
  createCategory = async (categoryData) => {
    const response = await axiosClient.post('/expense-categories', categoryData);
    return response.data;
  };

  /**
   * Update an existing expense category
   * @param {string} id - Category ID to update
   * @param {Object} categoryData - Updated data
   * @returns {Promise} Axios response data
   */
  updateCategory = async (id, categoryData) => {
    const response = await axiosClient.put(`/expense-categories/${id}`, categoryData);
    return response.data;
  };

  /**
   * Delete an expense category
   * @param {string} id - Category ID to delete
   * @returns {Promise} Axios response data
   */
  deleteCategory = async (id) => {
    const response = await axiosClient.delete(`/expense-categories/${id}`);
    return response.data;
  };
}

const expenseCategoryService = new ExpenseCategoryService();
export default expenseCategoryService;
