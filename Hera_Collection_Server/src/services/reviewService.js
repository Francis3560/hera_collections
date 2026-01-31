import prisma from '../database.js';

class ReviewService {
  async createReview(data) {
    const { productId, userId, rating, title, comment, isVerified } = data;

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId: parseInt(productId),
          userId: parseInt(userId)
        }
      }
    });

    if (existingReview) {
      throw new Error('You have already reviewed this product.');
    }

    return await prisma.review.create({
      data: {
        productId: parseInt(productId),
        userId: parseInt(userId),
        rating: parseInt(rating),
        title,
        comment,
        isVerified: isVerified || false,
        isApproved: false,
        isPublished: false
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            picture: true
          }
        }
      }
    });
  }

  async getAllReviews(filters = {}) {
    const { productId, userId, isApproved, isPublished } = filters;
    const where = {};

    if (productId) where.productId = parseInt(productId);
    if (userId) where.userId = parseInt(userId);
    if (isApproved !== undefined) where.isApproved = isApproved === 'true';
    if (isPublished !== undefined) where.isPublished = isPublished === 'true';

    return await prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            picture: true
          }
        },
        product: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async getPublishedReviewsByProduct(productId) {
    return await prisma.review.findMany({
      where: {
        productId: parseInt(productId),
        isApproved: true,
        isPublished: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            picture: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async getReviewById(id) {
    return await prisma.review.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            picture: true
          }
        },
        product: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });
  }

  async updateReview(id, data) {
    return await prisma.review.update({
      where: { id: parseInt(id) },
      data
    });
  }

  async deleteReview(id) {
    return await prisma.review.delete({
      where: { id: parseInt(id) }
    });
  }

  async approveReview(id) {
    return await prisma.review.update({
      where: { id: parseInt(id) },
      data: { isApproved: true }
    });
  }

  async publishReview(id) {
    const review = await prisma.review.update({
      where: { id: parseInt(id) },
      data: { isPublished: true, isApproved: true } // Auto-approve if publishing
    });

    // Update product rating after publishing
    await this.updateProductRating(review.productId);
    
    return review;
  }

  async updateProductRating(productId) {
    const reviews = await prisma.review.findMany({
      where: {
        productId: parseInt(productId),
        isPublished: true
      },
      select: {
        rating: true
      }
    });

    const reviewCount = reviews.length;
    const averageRating = reviewCount > 0 
      ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewCount 
      : 0;

    await prisma.product.update({
      where: { id: parseInt(productId) },
      data: {
        rating: averageRating,
        reviewCount: reviewCount
      }
    });
  }
}

export default new ReviewService();
