import prisma from '../database.js';
import { Prisma } from '@prisma/client';
import { sendLowStockAlertEmail } from './emails/emailService.js';
export const addStock = async (productId, data, userId) => {
  const { quantity, reason, notes, costPrice, location } = data;

  if (!quantity || quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }
  const product = await prisma.product.findUnique({
    where: { id: parseInt(productId) },
    include: {
      category: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error('Product not found');
  }
  const result = await prisma.$transaction(async (tx) => {
    const updatedProduct = await tx.product.update({
      where: { id: parseInt(productId) },
      data: {
        quantity: { increment: quantity },
      },
    });
    const movement = await tx.stockMovement.create({
      data: {
        productId: parseInt(productId),
        movementType: 'ADDITION',
        quantity: quantity,
        previousStock: product.quantity,
        newStock: updatedProduct.quantity,
        reason: reason || 'Manual stock addition',
        notes,
        createdById: parseInt(userId),
        location,
        costPrice: costPrice ? new Prisma.Decimal(costPrice) : null,
        sellingPrice: product.price,
      },
      include: {
        product: {
          select: {
            title: true,
            sku: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    await checkAndUpdateStockAlerts(parseInt(productId), updatedProduct.quantity, tx);

    return {
      product: updatedProduct,
      movement,
    };
  });

  return result;
};
export const adjustStock = async (productId, data, userId) => {
  const { quantity, reason, notes, location } = data;

  if (!quantity || quantity === 0) {
    throw new Error('Quantity must be provided and not zero');
  }
  const product = await prisma.product.findUnique({
    where: { id: parseInt(productId) },
  });

  if (!product) {
    throw new Error('Product not found');
  }
  if (quantity < 0 && Math.abs(quantity) > product.quantity) {
    throw new Error('Insufficient stock for deduction');
  }
  const result = await prisma.$transaction(async (tx) => {
    const updatedProduct = await tx.product.update({
      where: { id: parseInt(productId) },
      data: {
        quantity: { increment: quantity },
      },
    });
    const movementType = quantity > 0 ? 'ADJUSTMENT' : 'CORRECTION';
    const movement = await tx.stockMovement.create({
      data: {
        productId: parseInt(productId),
        movementType,
        quantity: quantity,
        previousStock: product.quantity,
        newStock: updatedProduct.quantity,
        reason: reason || `Stock ${quantity > 0 ? 'increase' : 'decrease'} adjustment`,
        notes,
        createdById: parseInt(userId),
        location,
        costPrice: product.oldPrice,
        sellingPrice: product.price,
      },
      include: {
        product: {
          select: {
            title: true,
            sku: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
    await checkAndUpdateStockAlerts(parseInt(productId), updatedProduct.quantity, tx);

    return {
      product: updatedProduct,
      movement,
    };
  });

  return result;
};

export const recordSaleMovement = async (orderId, orderItems, userId) => {
  const movements = [];
  
  for (const item of orderItems) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
    });

    if (!product) {
      console.error(`Product ${item.productId} not found for stock movement`);
      continue;
    }

    const previousStock = product.quantity;
    const newStock = previousStock - item.quantity;

    const movement = await prisma.stockMovement.create({
      data: {
        productId: item.productId,
        movementType: 'SALE',
        quantity: -item.quantity, 
        previousStock,
        newStock,
        referenceId: orderId,
        referenceType: 'ORDER',
        reason: `Sale - Order #${orderId}`,
        createdById: parseInt(userId),
        sellingPrice: item.price,
      },
    });

    movements.push(movement);
    await prisma.product.update({
      where: { id: item.productId },
      data: { quantity: newStock },
    });
    await checkAndUpdateStockAlerts(item.productId, newStock);
  }

  return movements;
};
export const recordReturnMovement = async (productId, quantity, orderId, userId, reason) => {
  const product = await prisma.product.findUnique({
    where: { id: parseInt(productId) },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  if (!quantity || quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedProduct = await tx.product.update({
      where: { id: parseInt(productId) },
      data: {
        quantity: { increment: quantity },
      },
    });
    const movement = await tx.stockMovement.create({
      data: {
        productId: parseInt(productId),
        movementType: 'RETURN',
        quantity: quantity,
        previousStock: product.quantity,
        newStock: updatedProduct.quantity,
        referenceId: orderId,
        referenceType: 'ORDER_RETURN',
        reason: reason || 'Customer return',
        createdById: parseInt(userId),
        sellingPrice: product.price,
      },
      include: {
        product: {
          select: {
            title: true,
            sku: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
    await checkAndUpdateStockAlerts(parseInt(productId), updatedProduct.quantity, tx);

    return {
      product: updatedProduct,
      movement,
    };
  });

  return result;
};
export const recordDamageMovement = async (productId, data, userId) => {
  const { quantity, reason, notes, location } = data;

  if (!quantity || quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  const product = await prisma.product.findUnique({
    where: { id: parseInt(productId) },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  if (quantity > product.quantity) {
    throw new Error('Damage quantity cannot exceed available stock');
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedProduct = await tx.product.update({
      where: { id: parseInt(productId) },
      data: {
        quantity: { decrement: quantity },
      },
    });
    const movement = await tx.stockMovement.create({
      data: {
        productId: parseInt(productId),
        movementType: 'DAMAGE',
        quantity: -quantity, 
        previousStock: product.quantity,
        newStock: updatedProduct.quantity,
        reason: reason || 'Damaged goods',
        notes,
        createdById: parseInt(userId),
        location,
        costPrice: product.oldPrice,
        sellingPrice: product.price,
      },
      include: {
        product: {
          select: {
            title: true,
            sku: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
    await checkAndUpdateStockAlerts(parseInt(productId), updatedProduct.quantity, tx);

    return {
      product: updatedProduct,
      movement,
    };
  });

  return result;
};
const checkAndUpdateStockAlerts = async (productId, currentStock, tx = prisma) => {
  const alert = await tx.stockAlert.findUnique({
    where: { productId },
  });

  if (!alert || !alert.isActive) {
    return;
  }
  if (currentStock <= alert.threshold && !alert.notifiedAt) {
    const product = await tx.product.findUnique({
      where: { id: productId },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    if (product) {
      try {
        await sendLowStockAlertEmail(product, currentStock, alert.threshold);
      } catch (emailError) {
        console.error('Failed to send low stock alert email:', emailError);
      }
      await tx.stockAlert.update({
        where: { productId },
        data: {
          notifiedAt: new Date(),
          isResolved: false,
        },
      });
    }
  } else if (currentStock > alert.threshold && alert.notifiedAt && !alert.isResolved) {
    await tx.stockAlert.update({
      where: { productId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedById: alert.resolvedById, 
      },
    });
  }
};
export const getProductStockMovements = async (productId, filters = {}) => {
  const {
    startDate,
    endDate,
    movementType,
    page = 1,
    limit = 20,
  } = filters;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const where = {
    productId: parseInt(productId),
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  if (movementType) {
    where.movementType = movementType;
  }

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        product: {
          select: {
            title: true,
            sku: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return {
    movements,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
};
export const getLowStockProducts = async (threshold = 10) => {
  const products = await prisma.product.findMany({
    where: {
      quantity: {
        lte: threshold,
      },
      isPublished: true,
    },
    include: {
      category: {
        select: {
          name: true,
        },
      },
      photos: {
        take: 1,
      },
      _count: {
        select: {
          orders: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
              },
            },
          },
        },
      },
    },
    orderBy: { quantity: 'asc' },
  });
  const productIds = products.map(p => p.id);
  const alerts = await prisma.stockAlert.findMany({
    where: {
      productId: { in: productIds },
    },
  });

  const productsWithAlerts = products.map(product => {
    const alert = alerts.find(a => a.productId === product.id);
    return {
      ...product,
      alert: alert ? {
        threshold: alert.threshold,
        isActive: alert.isActive,
        notifiedAt: alert.notifiedAt,
        isResolved: alert.isResolved,
      } : null,
    };
  });

  return productsWithAlerts;
};

export const getStockValueAnalytics = async () => {
  const products = await prisma.product.findMany({
    where: {
      isPublished: true,
    },
    select: {
      id: true,
      title: true,
      sku: true,
      quantity: true,
      price: true,
      oldPrice: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  });
  const totalValue = products.reduce((sum, product) => {
    const costPrice = Number(product.oldPrice) || Number(product.price) * 0.7; 
    return sum + (costPrice * product.quantity);
  }, 0);
  const retailValue = products.reduce((sum, product) => {
    return sum + (Number(product.price) * product.quantity);
  }, 0);
  const categoryBreakdown = {};
  products.forEach(product => {
    const categoryName = product.category?.name || 'Uncategorized';
    const costPrice = Number(product.oldPrice) || Number(product.price) * 0.7;
    
    if (!categoryBreakdown[categoryName]) {
      categoryBreakdown[categoryName] = {
        category: categoryName,
        productCount: 0,
        totalQuantity: 0,
        totalCostValue: 0,
        totalRetailValue: 0,
      };
    }

    categoryBreakdown[categoryName].productCount += 1;
    categoryBreakdown[categoryName].totalQuantity += product.quantity;
    categoryBreakdown[categoryName].totalCostValue += costPrice * product.quantity;
    categoryBreakdown[categoryName].totalRetailValue += Number(product.price) * product.quantity;
  });
  const slowMovingProducts = await prisma.product.findMany({
    where: {
      isPublished: true,
      quantity: { gt: 0 },
      orders: {
        none: {
          createdAt: {
            gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          },
        },
      },
    },
    include: {
      category: {
        select: {
          name: true,
        },
      },
    },
    take: 10,
    orderBy: { quantity: 'desc' },
  });
  const fastMovingProducts = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
    _sum: {
      quantity: true,
    },
    orderBy: {
      _sum: {
        quantity: 'desc',
      },
    },
    take: 10,
  });
  const fastMovingProductIds = fastMovingProducts.map(item => item.productId);
  const fastMovingDetails = await prisma.product.findMany({
    where: {
      id: { in: fastMovingProductIds },
    },
    select: {
      id: true,
      title: true,
      sku: true,
      quantity: true,
      price: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  });

  const fastMovingWithSales = fastMovingDetails.map(product => {
    const salesData = fastMovingProducts.find(item => item.productId === product.id);
    return {
      ...product,
      salesCount: salesData?._sum.quantity || 0,
    };
  });

  return {
    summary: {
      totalProducts: products.length,
      totalItems: products.reduce((sum, p) => sum + p.quantity, 0),
      totalCostValue: parseFloat(totalValue.toFixed(2)),
      totalRetailValue: parseFloat(retailValue.toFixed(2)),
      averageStockValue: products.length > 0 ? totalValue / products.length : 0,
    },
    categoryBreakdown: Object.values(categoryBreakdown).map(cat => ({
      ...cat,
      totalCostValue: parseFloat(cat.totalCostValue.toFixed(2)),
      totalRetailValue: parseFloat(cat.totalRetailValue.toFixed(2)),
    })),
    slowMovingProducts: slowMovingProducts.map(p => ({
      id: p.id,
      title: p.title,
      sku: p.sku,
      quantity: p.quantity,
      price: p.price,
      category: p.category?.name,
      daysWithoutSale: 60, 
    })),
    fastMovingProducts: fastMovingWithSales.sort((a, b) => b.salesCount - a.salesCount),
    stockTurnover: await calculateStockTurnover(),
  };
};

const calculateStockTurnover = async () => {
  const now = new Date();
  const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const monthlyAverages = [];
  for (let i = 0; i < 12; i++) {
    const monthStart = new Date(now.getFullYear(), i, 1);
    const monthEnd = new Date(now.getFullYear(), i + 1, 0);

    const products = await prisma.product.findMany({
      where: {
        isPublished: true,
      },
      select: {
        price: true,
        quantity: true,
      },
    });

    const monthValue = products.reduce((sum, product) => {
      return sum + (Number(product.price) * product.quantity);
    }, 0);

    monthlyAverages.push({
      month: monthStart.toLocaleString('default', { month: 'short' }),
      averageStockValue: parseFloat(monthValue.toFixed(2)),
    });
  }
  const sales = await prisma.order.aggregate({
    where: {
      status: { in: ['PAID', 'FULFILLED'] },
      createdAt: {
        gte: lastYear,
        lte: now,
      },
    },
    _sum: {
      totalAmount: true,
    },
  });

  const totalSales = Number(sales._sum.totalAmount) || 0;
  const averageStock = monthlyAverages.reduce((sum, month) => sum + month.averageStockValue, 0) / 12;
  
  const turnoverRatio = averageStock > 0 ? totalSales / averageStock : 0;

  return {
    totalSales: parseFloat(totalSales.toFixed(2)),
    averageStockValue: parseFloat(averageStock.toFixed(2)),
    turnoverRatio: parseFloat(turnoverRatio.toFixed(2)),
    monthlyAverages,
  };
};
export const bulkStockUpdate = async (updates, userId) => {
  if (!Array.isArray(updates) || updates.length === 0) {
    throw new Error('Updates array is required and cannot be empty');
  }

  const results = [];
  const errors = [];

  for (const update of updates) {
    try {
      const { productId, quantity, movementType, reason, notes } = update;

      if (!productId || !quantity || quantity === 0) {
        errors.push({
          update,
          error: 'Product ID and quantity (non-zero) are required',
        });
        continue;
      }

      const product = await prisma.product.findUnique({
        where: { id: parseInt(productId) },
      });

      if (!product) {
        errors.push({
          update,
          error: `Product ${productId} not found`,
        });
        continue;
      }

      if (quantity < 0 && Math.abs(quantity) > product.quantity) {
        errors.push({
          update,
          error: `Insufficient stock for product ${productId}`,
        });
        continue;
      }
      const result = await prisma.$transaction(async (tx) => {
        const updatedProduct = await tx.product.update({
          where: { id: parseInt(productId) },
          data: {
            quantity: { increment: quantity },
          },
        });
        const movementTypeToUse = movementType || (quantity > 0 ? 'ADDITION' : 'ADJUSTMENT');
        const movement = await tx.stockMovement.create({
          data: {
            productId: parseInt(productId),
            movementType: movementTypeToUse,
            quantity: quantity,
            previousStock: product.quantity,
            newStock: updatedProduct.quantity,
            reason: reason || 'Bulk stock update',
            notes,
            createdById: parseInt(userId),
            sellingPrice: product.price,
          },
        });
        await checkAndUpdateStockAlerts(parseInt(productId), updatedProduct.quantity, tx);

        return {
          productId,
          previousStock: product.quantity,
          newStock: updatedProduct.quantity,
          movementId: movement.id,
        };
      });

      results.push(result);
    } catch (error) {
      errors.push({
        update,
        error: error.message,
      });
    }
  }

  return {
    success: results.length,
    failed: errors.length,
    results,
    errors: errors.length > 0 ? errors : undefined,
  };
};