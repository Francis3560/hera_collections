import axiosClient from '../utils/axiosClient';

const CategoryService = {
  /**
   * Fetch all categories
   * @returns {Promise<Array>} List of categories
   */
  getAllCategories: async () => {
    const response = await axiosClient.get('/categories');

    // Robustly handle different response structures
    if (Array.isArray(response.data)) {
      return response.data;
    }

    // Check for nested data properties commonly used in APIs
    if (response.data && typeof response.data === 'object') {
      if (Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (Array.isArray(response.data.categories)) {
        return response.data.categories;
      }
      if (Array.isArray(response.data.items)) {
        return response.data.items;
      }
    }

    console.warn('getAllCategories: Expected array but got:', typeof response.data, response.data);
    return [];
  },

  /**
   * Fetch a single category by ID
   * @param {number|string} id - Category ID
   * @returns {Promise<Object>} Category object
   */
  getCategoryById: async (id) => {
    const response = await axiosClient.get(`/categories/${id}`);
    return response.data;
  },

  getCategoryBySlug: async (slug) => {
    const response = await axiosClient.get(`/categories/slug/${slug}`);
    return response.data;
  },

  /**
   * Create a new category
   * @param {Object} data - { name, description, slug }
   * @param {File} coverPhoto - Image file
   * @returns {Promise<Object>} Created category
   */
  createCategory: async (data, coverPhoto = null) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    if (coverPhoto) {
      formData.append('coverPhoto', coverPhoto);
    }
    const response = await axiosClient.post('/categories', formData, {
      headers: { 'Content-Type': 'multipart/form-data ' }
    });
    return response.data;
  },

  /**
   * Update an existing category
   * @param {number|string} id - Category ID
   * @param {Object} data - { name, description, slug }
   * @param {File} coverPhoto - Image file
   * @returns {Promise<Object>} Updated category
   */
  updateCategory: async (id, data, coverPhoto = null) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    if (coverPhoto) {
      formData.append('coverPhoto', coverPhoto);
    }
    const response = await axiosClient.put(`/categories/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data ' }
    });
    return response.data;
  },

  /**
   * Delete a category
   * @param {number|string} id - Category ID
   * @returns {Promise<Object>} Delete confirmation
   */
  deleteCategory: async (id) => {
    const response = await axiosClient.delete(`/categories/${id}`);
    return response.data;
  },
};

export default CategoryService;
