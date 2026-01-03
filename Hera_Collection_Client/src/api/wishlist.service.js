import axiosClient from '../utils/axiosClient';

class WishlistService {
  async getWishlist() {
    const response = await axiosClient.get('/wishlist');
    return response.data;
  }

  async addToWishlist(productId, variantId) {
    const response = await axiosClient.post('/wishlist', { productId, variantId });
    return response.data;
  }

  async removeFromWishlist(id) {
    const response = await axiosClient.delete(`/wishlist/${id}`);
    return response.data;
  }
}

export default new WishlistService();
