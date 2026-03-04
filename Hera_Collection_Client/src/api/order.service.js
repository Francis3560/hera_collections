import  axiosClient  from '@/utils/axiosClient';

class OrderService {
  // For normal users: get their own orders
  async getOrders(params = {}) {
    const response = await axiosClient.get('/orders', { params });
    return response.data;
  }

  async createOrder(data) {
    const response = await axiosClient.post('/orders', data);
    return response.data;
  }

  // For admins: get all orders
  async getAllOrders(params = {}) {
     const response = await axiosClient.get('/orders/admin/all', { params });
     return response.data;
  }

  async getOrderById(id) {
    const response = await axiosClient.get(`/orders/${id}`);
    return response.data;
  }

  async updateOrderStatus(id, status, mpesaReference = null) {
    const payload = { status };
    if (mpesaReference) payload.mpesaReference = mpesaReference;
    
    const response = await axiosClient.put(`/orders/admin/${id}/status`, payload);
    return response.data;
  }

  async getOrderAnalytics(params = {}) {
    const response = await axiosClient.get('/orders/admin/analytics/sales', { params });
    return response.data;
  }

  async getOrderStats(params = {}) {
    const response = await axiosClient.get('/orders/stats', { params });
    return response.data;
  }

  async getSalesTrends(params = {}) {
    const response = await axiosClient.get('/orders/admin/analytics/trends', { params });
    return response.data;
  }
  
  async getOrderItems(params = {}) {
    const response = await axiosClient.get('/orders/admin/items', { params });
    return response.data;
  }

  async deleteOrder(id) {
      const response = await axiosClient.delete(`/orders/${id}`);
      return response.data;
  }
}

export default new OrderService();
