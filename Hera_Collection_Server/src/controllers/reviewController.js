import reviewService from '../services/reviewService.js';

class ReviewController {
  async createReview(req, res) {
    try {
      const userId = req.user.id;
      const review = await reviewService.createReview({ ...req.body, userId });
      res.status(201).json({
        success: true,
        message: 'Review submitted successfully. It will be visible after admin approval.',
        data: review
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getAllReviews(req, res) {
    try {
      const reviews = await reviewService.getAllReviews(req.query);
      res.status(200).json({
        success: true,
        data: reviews
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getProductReviews(req, res) {
    try {
      const { productId } = req.params;
      const reviews = await reviewService.getPublishedReviewsByProduct(productId);
      res.status(200).json({
        success: true,
        data: reviews
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateReview(req, res) {
    try {
      const { id } = req.params;
      const review = await reviewService.updateReview(id, req.body);
      res.status(200).json({
        success: true,
        message: 'Review updated successfully',
        data: review
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteReview(req, res) {
    try {
      const { id } = req.params;
      await reviewService.deleteReview(id);
      res.status(200).json({
        success: true,
        message: 'Review deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async approveReview(req, res) {
    try {
      const { id } = req.params;
      const review = await reviewService.approveReview(id);
      res.status(200).json({
        success: true,
        message: 'Review approved successfully',
        data: review
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async publishReview(req, res) {
    try {
      const { id } = req.params;
      const review = await reviewService.publishReview(id);
      res.status(200).json({
        success: true,
        message: 'Review published successfully',
        data: review
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new ReviewController();
