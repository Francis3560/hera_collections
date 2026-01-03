import axiosClient from '../utils/axiosClient';

class StockService {
  // Movements
  async addStock(variantId, data) {
    const response = await axiosClient.post(`/stock/${variantId}/add`, data);
    return response.data;
  }

  async adjustStock(variantId, data) {
    const response = await axiosClient.post(`/stock/${variantId}/adjust`, data);
    return response.data;
  }

  async recordDamage(variantId, data) {
    const response = await axiosClient.post(`/stock/${variantId}/damage`, data);
    return response.data;
  }

  async getMovements(variantId, params = {}) {
    const response = await axiosClient.get(`/stock/movements/${variantId}`, { params });
    return response.data;
  }

  async getLowStock(threshold = 10) {
    const response = await axiosClient.get('/stock/low-stock', { params: { threshold } });
    return response.data;
  }

  async getStockValueAnalytics() {
    const response = await axiosClient.get('/stock/analytics/value');
    return response.data;
  }

  async bulkUpdate(updates) {
    const response = await axiosClient.post('/stock/bulk-update', { updates });
    return response.data;
  }

  // Stock Takes
  async createStockTake(data) {
    const response = await axiosClient.post('/stock/stock-takes', data);
    return response.data;
  }

  async getAllStockTakes(params = {}) {
    const response = await axiosClient.get('/stock/stock-takes', { params });
    return response.data;
  }

  async getStockTakeById(id) {
    const response = await axiosClient.get(`/stock/stock-takes/${id}`);
    return response.data;
  }

  async startStockTake(id) {
    const response = await axiosClient.post(`/stock/stock-takes/${id}/start`);
    return response.data;
  }

  async addStockTakeItems(id, items) {
    const response = await axiosClient.post(`/stock/stock-takes/${id}/items`, { items });
    return response.data;
  }

  async completeStockTake(id, data = {}) {
    const response = await axiosClient.post(`/stock/stock-takes/${id}/complete`, data);
    return response.data;
  }

  async cancelStockTake(id) {
    const response = await axiosClient.post(`/stock/stock-takes/${id}/cancel`);
    return response.data;
  }

  async getStockTakeReport(id) {
    const response = await axiosClient.get(`/stock/stock-takes/${id}/report`);
    return response.data;
  }

  // Alerts
  async setAlert(variantId, threshold) {
    const response = await axiosClient.post(`/stock/alerts/${variantId}`, { threshold });
    return response.data;
  }

  async disableAlert(variantId) {
    const response = await axiosClient.delete(`/stock/alerts/${variantId}`);
    return response.data;
  }

  async resolveAlert(variantId) {
    const response = await axiosClient.post(`/stock/alerts/${variantId}/resolve`);
    return response.data;
  }

  async getActiveAlerts() {
    const response = await axiosClient.get('/stock/alerts/active');
    return response.data;
  }

  async getAlertHistory(params = {}) {
    const response = await axiosClient.get('/stock/alerts/history', { params });
    return response.data;
  }

  async getAlertStats() {
    const response = await axiosClient.get('/stock/alerts/stats');
    return response.data;
  }
}

export default new StockService();
