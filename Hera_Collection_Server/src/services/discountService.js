import prisma from '../database.js';

/**
 * Create a new discount
 */
export const createDiscount = async (data) => {
  const { name, description, discountPercentage, startDate, endDate, isActive, productIds } = data;

  const discount = await prisma.discount.create({
    data: {
      name,
      description,
      discountPercentage,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: isActive !== undefined ? isActive : true,
      products: {
        connect: productIds?.map(id => ({ id })) || []
      }
    },
    include: {
      products: {
        select: {
          id: true,
          title: true,
          variants: {
            select: {
              price: true
            },
            take: 1
          }
        }
      }
    }
  });

  return discount;
};

/**
 * Get all discounts
 */
export const getAllDiscounts = async () => {
  return prisma.discount.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { products: true }
      }
    }
  });
};

/**
 * Get discount by ID
 */
export const getDiscountById = async (id) => {
  return prisma.discount.findUnique({
    where: { id: parseInt(id) },
    include: {
      products: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });
};

/**
 * Update discount
 */
export const updateDiscount = async (id, data) => {
  const { name, description, discountPercentage, startDate, endDate, isActive, productIds } = data;

  const updateData = {
    name,
    description,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    isActive,
    discountPercentage
  };

  // If productIds is provided, update the relationship
  // We use 'set' to replace all existing products with the new list
  if (productIds) {
    updateData.products = {
      set: productIds.map(pid => ({ id: pid }))
    };
  }

  return prisma.discount.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      products: {
         select: { id: true, title: true }
      }
    }
  });
};

/**
 * Delete discount
 */
export const deleteDiscount = async (id) => {
  return prisma.discount.delete({
    where: { id: parseInt(id) }
  });
};
