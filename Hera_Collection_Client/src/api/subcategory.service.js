import axiosClient from '../utils/axiosClient';

const SubCategoryService = {
  /**
   * Fetch all sub-categories
   * @param {Object} params - Filter params (e.g., { categoryId })
   * @returns {Promise<Array>} List of sub-categories
   */
  getAllSubCategories: async (params = {}) => {
    const response = await axiosClient.get('/sub-categories', { params });

    // Robustly handle different response structures
    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (response.data && typeof response.data === 'object') {
      if (Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (Array.isArray(response.data.items)) {
        return response.data.items;
      }
    }

    return [];
  },

  /**
   * Fetch a single sub-category by slug
   * @param {string} slug - Sub-category slug
   * @returns {Promise<Object>} Sub-category object
   */
  getSubCategoryBySlug: async (slug) => {
    const response = await axiosClient.get(`/sub-categories/slug/${slug}`);
    return response.data;
  },

  /**
   * Create a new sub-category
   * @param {Object} data - { name, description, slug, categoryId }
   * @param {File} coverPhoto - Image file
   * @returns {Promise<Object>} Created sub-category
   */
  createSubCategory: async (data, coverPhoto = null) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    if (coverPhoto) {
      formData.append('coverPhoto', coverPhoto);
    }
    const response = await axiosClient.post('/sub-categories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  /**
   * Update an existing sub-category
   * @param {number|string} id - Sub-category ID
   * @param {Object} data - { name, description, slug, categoryId, isActive }
   * @param {File} coverPhoto - Image file
   * @returns {Promise<Object>} Updated sub-category
   */
  updateSubCategory: async (id, data, coverPhoto = null) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    if (coverPhoto) {
      formData.append('coverPhoto', coverPhoto);
    }
    const response = await axiosClient.put(`/sub-categories/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  /**
   * Delete a sub-category
   * @param {number|string} id - Sub-category ID
   * @returns {Promise<Object>} Delete confirmation
   */
  deleteSubCategory: async (id) => {
    const response = await axiosClient.delete(`/sub-categories/${id}`);
    return response.data;
  },
};

export default SubCategoryService;
