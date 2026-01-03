import  axiosClient  from '@/utils/axiosClient';

class OrderService {
  // For normal users: get their own orders
  async getOrders(params = {}) {
    const response = await axiosClient.get('/orders', { params });
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

  async updateOrderStatus(id, status) {
    const response = await axiosClient.put(`/orders/admin/${id}/status`, { status });
    return response.data;
  }

  async getOrderAnalytics(timeframe = 'month') {
    const response = await axiosClient.get('/orders/admin/analytics/sales', { params: { timeframe } });
    return response.data;
  }

  async getOrderStats() {
    const response = await axiosClient.get('/orders/stats');
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
