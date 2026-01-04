import prisma from '../database.js';
import { Prisma } from '@prisma/client';
import { sendLowStockAlertEmail } from './emails/emailService.js';
import { NotificationService } from './notification.service.js';
import webSocketService from './websocket.service.js';
import { NotificationTypes, NotificationPriorities, RelatedEntities } from '../types/notification.types.js';
export const addStock = async (variantId, data, userId) => {
  const { quantity, reason, notes, costPrice, location } = data;

  if (!quantity || quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  const variant = await prisma.productVariant.findUnique({
    where: { id: parseInt(variantId) },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          category: {
            select: { name: true }
          }
        }
      }
    },
  });

  if (!variant) {
    throw new Error('Product variant not found');
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedVariant = await tx.productVariant.update({
      where: { id: parseInt(variantId) },
      data: {
        stock: { increment: quantity },
      },
      include: {
        product: true
      }
    });

    const movement = await tx.stockMovement.create({
      data: {
        variantId: parseInt(variantId),
        movementType: 'ADDITION',
        quantity: quantity,
        previousStock: variant.stock,
        newStock: updatedVariant.stock,
        reason: reason || 'Manual stock addition',
        notes,
        createdById: parseInt(userId),
        location,
        costPrice: costPrice ? new Prisma.Decimal(costPrice) : variant.costPrice,
        sellingPrice: variant.price,
      },
      include: {
        variant: {
          include: {
            product: {
              select: {
                title: true,
              },
            },
          }
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    await checkAndUpdateStockAlerts(parseInt(variantId), updatedVariant.stock, tx);

    return {
      variant: updatedVariant,
      movement,
    };
  });

  return result;
};
export const adjustStock = async (variantId, data, userId) => {
  const { quantity, reason, notes, location } = data;

  if (!quantity || quantity === 0) {
    throw new Error('Quantity must be provided and not zero');
  }

  const variant = await prisma.productVariant.findUnique({
    where: { id: parseInt(variantId) },
  });

  if (!variant) {
    throw new Error('Product variant not found');
  }

  if (quantity < 0 && Math.abs(quantity) > variant.stock) {
    throw new Error('Insufficient stock for deduction');
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedVariant = await tx.productVariant.update({
      where: { id: parseInt(variantId) },
      data: {
        stock: { increment: quantity },
      },
      include: {
        product: true
      }
    });

    const movementType = quantity > 0 ? 'ADJUSTMENT' : 'CORRECTION';
    const movement = await tx.stockMovement.create({
      data: {
        variantId: parseInt(variantId),
        movementType,
        quantity: quantity,
        previousStock: variant.stock,
        newStock: updatedVariant.stock,
        reason: reason || `Stock ${quantity > 0 ? 'increase' : 'decrease'} adjustment`,
        notes,
        createdById: parseInt(userId),
        location,
        costPrice: variant.costPrice,
        sellingPrice: variant.price,
      },
      include: {
        variant: {
          include: {
            product: {
              select: {
                title: true,
              },
            },
          }
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    await checkAndUpdateStockAlerts(parseInt(variantId), updatedVariant.stock, tx);

    return {
      variant: updatedVariant,
      movement,
    };
  });

  return result;
};

export const recordSaleMovement = async (orderId, orderItems, userId, tx = null) => {
  const db = tx || prisma;
  const movements = [];
  
  for (const item of orderItems) {
    if (!item.variantId) continue;

    const variant = await db.productVariant.findUnique({
      where: { id: item.variantId },
    });

    if (!variant) {
      console.error(`Variant ${item.variantId} not found for stock movement`);
      continue;
    }

    const previousStock = variant.stock;
    const newStock = previousStock - item.quantity;

    const movement = await db.stockMovement.create({
      data: {
        variantId: item.variantId,
        movementType: 'SALE',
        quantity: -item.quantity, 
        previousStock,
        newStock,
        referenceId: parseInt(orderId),
        referenceType: 'ORDER',
        reason: `Sale - Order #${orderId}`,
        createdById: parseInt(userId),
        sellingPrice: item.price,
      },
    });

    movements.push(movement);
    await db.productVariant.update({
      where: { id: item.variantId },
      data: { stock: newStock },
    });
    
    // Broadcast stock update
    webSocketService.sendStockUpdate({
      variantId: item.variantId,
      productId: variant.productId,
      newStock: newStock,
      timestamp: new Date().toISOString()
    });

    await checkAndUpdateStockAlerts(item.variantId, newStock);
  }

  return movements;
};
export const recordReturnMovement = async (variantId, quantity, orderId, userId, reason) => {
  const variant = await prisma.productVariant.findUnique({
    where: { id: parseInt(variantId) },
  });

  if (!variant) {
    throw new Error('Product variant not found');
  }

  if (!quantity || quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedVariant = await tx.productVariant.update({
      where: { id: parseInt(variantId) },
      data: {
        stock: { increment: quantity },
      },
      include: {
        product: true
      }
    });

    const movement = await tx.stockMovement.create({
      data: {
        variantId: parseInt(variantId),
        movementType: 'RETURN',
        quantity: quantity,
        previousStock: variant.stock,
        newStock: updatedVariant.stock,
        referenceId: parseInt(orderId),
        referenceType: 'ORDER_RETURN',
        reason: reason || 'Customer return',
        createdById: parseInt(userId),
        sellingPrice: variant.price,
      },
      include: {
        variant: {
          include: {
            product: {
              select: {
                title: true,
              },
            },
          }
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    await checkAndUpdateStockAlerts(parseInt(variantId), updatedVariant.stock, tx);

    return {
      variant: updatedVariant,
      movement,
    };
  });

  return result;
};
export const recordDamageMovement = async (variantId, data, userId) => {
  const { quantity, reason, notes, location } = data;

  if (!quantity || quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  const variant = await prisma.productVariant.findUnique({
    where: { id: parseInt(variantId) },
  });

  if (!variant) {
    throw new Error('Product variant not found');
  }

  if (quantity > variant.stock) {
    throw new Error('Damage quantity cannot exceed available stock');
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedVariant = await tx.productVariant.update({
      where: { id: parseInt(variantId) },
      data: {
        stock: { decrement: quantity },
      },
      include: {
        product: true
      }
    });

    const movement = await tx.stockMovement.create({
      data: {
        variantId: parseInt(variantId),
        movementType: 'DAMAGE',
        quantity: -quantity, 
        previousStock: variant.stock,
        newStock: updatedVariant.stock,
        reason: reason || 'Damaged goods',
        notes,
        createdById: parseInt(userId),
        location,
        costPrice: variant.costPrice,
        sellingPrice: variant.price,
      },
      include: {
        variant: {
          include: {
            product: {
              select: {
                title: true,
              },
            },
          }
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    await checkAndUpdateStockAlerts(parseInt(variantId), updatedVariant.stock, tx);

    return {
      variant: updatedVariant,
      movement,
    };
  });

  return result;
};
export const checkAndUpdateStockAlerts = async (variantId, currentStock, tx = prisma) => {
  const alert = await tx.stockAlert.findUnique({
    where: { variantId },
    include: {
      variant: {
        include: {
          product: {
            include: {
              category: true
            }
          }
        }
      }
    }
  });

  if (!alert || !alert.isActive) {
    return;
  }

  const productName = alert.variant.product.title;
  const productId = alert.variant.productId;

  if (currentStock <= alert.threshold && !alert.notifiedAt) {
    try {
      // Send Email
      await sendLowStockAlertEmail(alert.variant.product, currentStock, alert.threshold);
      
      // Create Database Notification
      const admins = await tx.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true }
      });

      for (const admin of admins) {
        await NotificationService.createNotification({
          userId: admin.id,
          type: NotificationTypes.STOCK_LOW,
          title: 'Low Stock Alert',
          message: `${productName} is running low on stock (${currentStock} units remaining).`,
          relatedEntity: RelatedEntities.PRODUCT,
          relatedEntityId: productId,
          priority: NotificationPriorities.URGENT,
          data: { variantId, currentStock, threshold: alert.threshold }
        });
      }
    } catch (error) {
      console.error('Failed to process low stock notifications:', error);
    }

    await tx.stockAlert.update({
      where: { variantId },
      data: {
        notifiedAt: new Date(),
        isResolved: false,
      },
    });
  } else if (currentStock > alert.threshold && alert.notifiedAt && !alert.isResolved) {
    await tx.stockAlert.update({
      where: { variantId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
      },
    });
  }
};
export const getProductStockMovements = async (variantId, filters = {}) => {
  const {
    startDate,
    endDate,
    movementType,
    page = 1,
    limit = 20,
  } = filters;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const where = {
    variantId: parseInt(variantId),
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
        variant: {
          include: {
            product: {
              select: {
                title: true,
              },
            },
          }
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
  const variants = await prisma.productVariant.findMany({
    where: {
      stock: {
        lte: threshold,
      },
      isActive: true,
    },
    include: {
      product: {
        include: {
          category: {
            select: {
              name: true,
            },
          },
          photos: {
            take: 1,
          },
        }
      },
      _count: {
        select: {
          orderItems: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
              },
            },
          },
        },
      },
    },
    orderBy: { stock: 'asc' },
  });

  const variantIds = variants.map(v => v.id);
  const alerts = await prisma.stockAlert.findMany({
    where: {
      variantId: { in: variantIds },
    },
  });

  const variantsWithAlerts = variants.map(variant => {
    const alert = alerts.find(a => a.variantId === variant.id);
    return {
      ...variant,
      alert: alert ? {
        threshold: alert.threshold,
        isActive: alert.isActive,
        notifiedAt: alert.notifiedAt,
        isResolved: alert.isResolved,
      } : null,
    };
  });

  return variantsWithAlerts;
};

export const getStockValueAnalytics = async () => {
  const variants = await prisma.productVariant.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      sku: true,
      stock: true,
      price: true,
      costPrice: true,
      product: {
        select: {
          id: true,
          title: true,
          category: {
            select: {
              name: true,
            },
          },
        }
      },
    },
  });

  const totalValue = variants.reduce((sum, variant) => {
    const cp = Number(variant.costPrice) || Number(variant.price) * 0.7; 
    return sum + (cp * variant.stock);
  }, 0);

  const retailValue = variants.reduce((sum, variant) => {
    return sum + (Number(variant.price) * variant.stock);
  }, 0);

  const categoryBreakdown = {};
  variants.forEach(variant => {
    const categoryName = variant.product.category?.name || 'Uncategorized';
    const cp = Number(variant.costPrice) || Number(variant.price) * 0.7;
    
    if (!categoryBreakdown[categoryName]) {
      categoryBreakdown[categoryName] = {
        category: categoryName,
        variantCount: 0,
        totalStock: 0,
        totalCostValue: 0,
        totalRetailValue: 0,
      };
    }

    categoryBreakdown[categoryName].variantCount += 1;
    categoryBreakdown[categoryName].totalStock += variant.stock;
    categoryBreakdown[categoryName].totalCostValue += cp * variant.stock;
    categoryBreakdown[categoryName].totalRetailValue += Number(variant.price) * variant.stock;
  });

  const slowMovingVariants = await prisma.productVariant.findMany({
    where: {
      isActive: true,
      stock: { gt: 0 },
      orderItems: {
        none: {
          createdAt: {
            gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          },
        },
      },
    },
    include: {
      product: {
        select: {
          title: true,
          category: {
            select: {
              name: true,
            },
          },
        }
      },
    },
    take: 10,
    orderBy: { stock: 'desc' },
  });

  const fastMovingVariants = await prisma.orderItem.groupBy({
    by: ['variantId'],
    where: {
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
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

  const fastMovingVariantIds = fastMovingVariants.map(item => item.variantId).filter(Boolean);
  const fastMovingDetails = await prisma.productVariant.findMany({
    where: {
      id: { in: fastMovingVariantIds },
    },
    select: {
      id: true,
      sku: true,
      stock: true,
      price: true,
      product: {
        select: {
          title: true,
          category: {
            select: {
              name: true,
            },
          },
        }
      },
    },
  });

  const fastMovingWithSales = fastMovingDetails.map(variant => {
    const salesData = fastMovingVariants.find(item => item.variantId === variant.id);
    return {
      ...variant,
      salesCount: salesData?._sum.quantity || 0,
    };
  });

  return {
    summary: {
      totalVariants: variants.length,
      totalItems: variants.reduce((sum, v) => sum + v.stock, 0),
      totalCostValue: parseFloat(totalValue.toFixed(2)),
      totalRetailValue: parseFloat(retailValue.toFixed(2)),
      averageStockValue: variants.length > 0 ? totalValue / variants.length : 0,
    },
    categoryBreakdown: Object.values(categoryBreakdown).map(cat => ({
      ...cat,
      totalCostValue: parseFloat(cat.totalCostValue.toFixed(2)),
      totalRetailValue: parseFloat(cat.totalRetailValue.toFixed(2)),
    })),
    slowMovingProducts: slowMovingVariants.map(v => ({
      id: v.id,
      title: v.product.title,
      sku: v.sku,
      quantity: v.stock,
      price: v.price,
      category: v.product.category?.name,
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
    
    const variants = await prisma.productVariant.findMany({
      where: {
        isActive: true,
      },
      select: {
        price: true,
        stock: true,
      },
    });

    const monthValue = variants.reduce((sum, variant) => {
      return sum + (Number(variant.price) * variant.stock);
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
      const { variantId, quantity, movementType, reason, notes } = update;

      if (!variantId || !quantity || quantity === 0) {
        errors.push({
          update,
          error: 'Variant ID and quantity (non-zero) are required',
        });
        continue;
      }

      const variant = await prisma.productVariant.findUnique({
        where: { id: parseInt(variantId) },
      });

      if (!variant) {
        errors.push({
          update,
          error: `Variant ${variantId} not found`,
        });
        continue;
      }

      if (quantity < 0 && Math.abs(quantity) > variant.stock) {
        errors.push({
          update,
          error: `Insufficient stock for variant ${variantId}`,
        });
        continue;
      }

      const result = await prisma.$transaction(async (tx) => {
        const updatedVariant = await tx.productVariant.update({
          where: { id: parseInt(variantId) },
          data: {
            stock: { increment: quantity },
          },
        });

        const movementTypeToUse = movementType || (quantity > 0 ? 'ADDITION' : 'ADJUSTMENT');
        const movement = await tx.stockMovement.create({
          data: {
            variantId: parseInt(variantId),
            movementType: movementTypeToUse,
            quantity: quantity,
            previousStock: variant.stock,
            newStock: updatedVariant.stock,
            reason: reason || 'Bulk stock update',
            notes,
            createdById: parseInt(userId),
            sellingPrice: variant.price,
          },
        });

        await checkAndUpdateStockAlerts(parseInt(variantId), updatedVariant.stock, tx);

        return {
          variantId,
          previousStock: variant.stock,
          newStock: updatedVariant.stock,
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
