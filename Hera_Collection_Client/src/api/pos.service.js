import axiosClient from '../utils/axiosClient';

const posService = {
  // --- Cart Operations ---
  getCart: async () => {
    const response = await axiosClient.get('/cart');
    return response.data;
  },

  addToCart: async (productId, variantId, quantity) => {
    const response = await axiosClient.post('/cart/add', { productId, variantId, quantity });
    return response.data;
  },

  updateCartItem: async (itemId, quantity) => {
    const response = await axiosClient.patch(`/cart/item/${itemId}`, { quantity });
    return response.data;
  },

  removeCartItem: async (itemId) => {
    const response = await axiosClient.delete(`/cart/item/${itemId}`);
    return response.data;
  },

  clearCart: async () => {
    const response = await axiosClient.delete('/cart');
    return response.data;
  },

  // --- Checkout ---
  checkout: async (data) => {
    // data structure: { payment, customer, shipping }
    const response = await axiosClient.post('/cart/checkout', data);
    return response.data;
  },

  // --- Transactions ---
  getTransactions: async (params) => {
    const response = await axiosClient.get('/orders', { params });
    return response.data; // Expected { data: [], count, ... }
  },
  
  getTransactionById: async (id) => {
    const response = await axiosClient.get(`/orders/${id}`);
    return response.data;
  }
};

export default posService;
