import axiosClient from '../utils/axiosClient';

class CartService {
  async getCart() {
    const response = await axiosClient.get('/cart');
    return response.data;
  }

  async addToCart(productId, variantId, quantity = 1) {
    const response = await axiosClient.post('/cart/add', { productId, variantId, quantity });
    return response.data;
  }

  async updateItem(id, quantity) {
    const response = await axiosClient.patch(`/cart/item/${id}`, { quantity });
    return response.data;
  }

  async removeItem(id) {
    const response = await axiosClient.delete(`/cart/item/${id}`);
    return response.data;
  }

  async clearCart() {
    const response = await axiosClient.delete('/cart');
    return response.data;
  }

  async checkout(checkoutData) {
    const response = await axiosClient.post('/cart/checkout', checkoutData);
    return response.data;
  }
}

export default new CartService();
