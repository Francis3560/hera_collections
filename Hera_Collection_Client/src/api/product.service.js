import axiosClient from '../utils/axiosClient';

class ProductService {
  /**
   * Fetch all products with optional filters
   * @param {Object} params - Query parameters (page, limit, search, category, etc.)
   * @returns {Promise} Axios response
   */
  getAllProducts = async (params = {}) => {
    const response = await axiosClient.get('/products', { params });
    return response.data;
  };

  getProductById = async (id) => {
    const response = await axiosClient.get(`/products/${id}`);
    return response.data;
  };

  getProductBySlug = async (slug) => {
    const response = await axiosClient.get(`/products/slug/${slug}`);
    return response.data;
  };

  getProductsBySeller = async (sellerId) => {
    const response = await axiosClient.get(`/products/seller/${sellerId}`);
    return response.data;
  };

  getProductsByCategory = async (categoryId) => {
    const response = await axiosClient.get(`/products/category/${categoryId}`);
    return response.data;
  };

  createProduct = async (productData, images = []) => {
    const formData = new FormData();
    Object.entries(productData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      }
    });

    if (images && images.length > 0) {
      images.forEach((image) => {
        formData.append('images', image);
      });
    }

    const response = await axiosClient.post('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  };

  updateProduct = async (id, productData, newImages = []) => {
    const formData = new FormData();
    Object.entries(productData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      }
    });

    if (newImages && newImages.length > 0) {
      newImages.forEach((image) => {
        formData.append('images', image);
      });
    }

    const response = await axiosClient.put(`/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  };

  deleteProduct = async (id) => {
    const response = await axiosClient.delete(`/products/${id}`);
    return response.data;
  };

  // Category Methods
  getAllCategories = async () => {
    const response = await axiosClient.get('/categories');
    return response.data;
  };

  createCategory = async (categoryData, coverPhoto = null) => {
    const formData = new FormData();
    Object.keys(categoryData).forEach(key => {
        if (categoryData[key] !== undefined && categoryData[key] !== null) {
            formData.append(key, categoryData[key]);
        }
    });

    if (coverPhoto) {
      formData.append('coverPhoto', coverPhoto);
    }

    const response = await axiosClient.post('/categories', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  };

  updateCategory = async (id, categoryData, coverPhoto = null) => {
    const formData = new FormData();
    Object.keys(categoryData).forEach(key => {
      if (categoryData[key] !== undefined && categoryData[key] !== null) {
          formData.append(key, categoryData[key]);
      }
    });

    if (coverPhoto) {
      formData.append('coverPhoto', coverPhoto);
    }

    const response = await axiosClient.put(`/categories/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  };

  deleteCategory = async (id) => {
    const response = await axiosClient.delete(`/categories/${id}`);
    return response.data;
  };
}

const productService = new ProductService();
export default productService;
