import axiosClient from '../utils/axiosClient';

class DiscountService {
  async getAllDiscounts() {
    const response = await axiosClient.get('/discounts');
    return response.data;
  }

  async getDiscount(id: string) {
    const response = await axiosClient.get(`/discounts/${id}`);
    return response.data;
  }

  async createDiscount(data: any) {
    const response = await axiosClient.post('/discounts', data);
    return response.data;
  }

  async updateDiscount(id: string, data: any) {
    const response = await axiosClient.put(`/discounts/${id}`, data);
    return response.data;
  }

  async deleteDiscount(id: string) {
    const response = await axiosClient.delete(`/discounts/${id}`);
    return response.data;
  }
}

export default new DiscountService();
