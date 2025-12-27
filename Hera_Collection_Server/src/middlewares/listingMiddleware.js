import prisma from '../database.js';

export const checkListingExists = async (req, res, next) => {
  const { id } = req.params;
  const listing = await prisma.listing.findUnique({
    where: { id: parseInt(id, 10) },
    select: { id: true },
  });

  if (!listing) return res.status(404).json({ message: 'Listing not found' });
  next();
};
