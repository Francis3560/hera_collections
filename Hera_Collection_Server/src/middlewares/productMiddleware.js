import prisma from '../database.js';

export const checkProductExists = async (req, res, next) => {
  const { id } = req.params;
  const product = await prisma.product.findUnique({
    where: { id: parseInt(id, 10) },
    select: { id: true, sellerId: true },
  });

  if (!product) return res.status(404).json({ message: 'Product not found' });
  req.product = product;
  next();
};

export const checkProductOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id, 10) },
      select: { sellerId: true },
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (req.user.role === 'ADMIN') {
      return next();
    }
    if (product.sellerId !== req.user.id) {
      return res.status(403).json({ message: 'You can only modify your own products' });
    }

    next();
  } catch (error) {
    console.error('Error in checkProductOwnership:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};