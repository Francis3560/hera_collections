import prisma from '../database.js';

/**
 * Get user's wishlist items
 */
export const getWishlistController = async (req, res) => {
  try {
    const userId = req.user.id;
    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            photos: true
          }
        },
        variant: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: wishlistItems
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve wishlist' });
  }
};

/**
 * Add item to wishlist
 */
export const addToWishlistController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, variantId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    // Check if already exists
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId_variantId: {
          userId,
          productId,
          variantId: variantId || null
        }
      }
    });

    if (existing) {
      return res.status(200).json({ success: true, message: 'Item already in wishlist', data: existing });
    }

    const newItem = await prisma.wishlistItem.create({
      data: {
        userId,
        productId,
        variantId: variantId || null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Added to wishlist',
      data: newItem
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ success: false, message: 'Failed to add to wishlist' });
  }
};

/**
 * Remove item from wishlist
 */
export const removeFromWishlistController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const item = await prisma.wishlistItem.findUnique({
      where: { id: parseInt(id) }
    });

    if (!item || item.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Wishlist item not found' });
    }

    await prisma.wishlistItem.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Removed from wishlist'
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove from wishlist' });
  }
};
