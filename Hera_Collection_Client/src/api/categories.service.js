import axiosClient from '../utils/axiosClient';

const CategoryService = {
  /**
   * Fetch all categories
   * @returns {Promise<Array>} List of categories
   */
  getAllCategories: async () => {
    const response = await axiosClient.get('/categories');
    return response.data;
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
