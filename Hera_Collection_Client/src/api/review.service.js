import axiosClient from '../utils/axiosClient';

class ReviewService {
  /**
   * Submit a new review for a product
   * @param {Object} reviewData - { productId, rating, title, comment }
   * @returns {Promise} Axios response data
   */
  submitReview = async (reviewData) => {
    const response = await axiosClient.post('/reviews', reviewData);
    return response.data;
  };

  /**
   * Fetch all approved and published reviews for a specific product
   * @param {number|string} productId 
   * @returns {Promise} Axios response data
   */
  getProductReviews = async (productId) => {
    const response = await axiosClient.get(`/reviews/product/${productId}`);
    return response.data;
  };

  /**
   * Fetch all reviews (Admin only)
   * @param {Object} params - Query filters (isApproved, isPublished, productId, userId)
   * @returns {Promise} Axios response data
   */
  getAllReviews = async (params = {}) => {
    const response = await axiosClient.get('/reviews', { params });
    return response.data;
  };

  /**
   * Update a review (Admin only)
   * @param {number|string} id 
   * @param {Object} updateData 
   * @returns {Promise} Axios response data
   */
  updateReview = async (id, updateData) => {
    const response = await axiosClient.patch(`/reviews/${id}`, updateData);
    return response.data;
  };

  /**
   * Delete a review (Admin only)
   * @param {number|string} id 
   * @returns {Promise} Axios response data
   */
  deleteReview = async (id) => {
    const response = await axiosClient.delete(`/reviews/${id}`);
    return response.data;
  };

  /**
   * Approve a review (Admin only)
   * @param {number|string} id 
   * @returns {Promise} Axios response data
   */
  approveReview = async (id) => {
    const response = await axiosClient.patch(`/reviews/${id}/approve`);
    return response.data;
  };

  /**
   * Publish a review (Admin only)
   * @param {number|string} id 
   * @returns {Promise} Axios response data
   */
  publishReview = async (id) => {
    const response = await axiosClient.patch(`/reviews/${id}/publish`);
    return response.data;
  };
}

const reviewService = new ReviewService();
export default reviewService;
