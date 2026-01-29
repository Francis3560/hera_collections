import axiosClient from '../utils/axiosClient';

class ShippingService {
  async getAllRegions(params = {}) {
    const response = await axiosClient.get('/shipping-regions', { params });
    return response.data;
  }

  async getRegionById(id: number) {
    const response = await axiosClient.get(`/shipping-regions/${id}`);
    return response.data;
  }

  async createRegion(data: any) {
    const response = await axiosClient.post('/shipping-regions', data);
    return response.data;
  }

  async updateRegion(id: number, data: any) {
    const response = await axiosClient.patch(`/shipping-regions/${id}`, data);
    return response.data;
  }

  async deleteRegion(id: number) {
    const response = await axiosClient.delete(`/shipping-regions/${id}`);
    return response.data;
  }
}

export default new ShippingService();
