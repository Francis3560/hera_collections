// services/stockTakeService.js
import prisma from '../database.js';
import { Prisma } from '@prisma/client';
import { checkAndUpdateStockAlerts } from './stockService.js';

/**
 * Create a new stock take
 */
export const createStockTake = async (data, userId) => {
  const { title, description, startDate, notes } = data;

  const stockTake = await prisma.stockTake.create({
    data: {
      title,
      description,
      startDate: startDate ? new Date(startDate) : new Date(),
      status: 'PENDING',
      createdById: parseInt(userId),
      notes,
    },
    include: {
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return stockTake;
};

/**
 * Start a stock take
 */
export const startStockTake = async (stockTakeId, userId) => {
  const stockTake = await prisma.stockTake.findUnique({
    where: { id: parseInt(stockTakeId) },
  });

  if (!stockTake) {
    throw new Error('Stock take not found');
  }

  if (stockTake.status !== 'PENDING') {
    throw new Error(`Stock take is already ${stockTake.status}`);
  }

  const updatedStockTake = await prisma.stockTake.update({
    where: { id: parseInt(stockTakeId) },
    data: {
      status: 'IN_PROGRESS',
      startDate: new Date(),
    },
    include: {
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return updatedStockTake;
};

/**
 * Add items to stock take
 */
export const addStockTakeItems = async (stockTakeId, items, userId) => {
  const stockTake = await prisma.stockTake.findUnique({
    where: { id: parseInt(stockTakeId) },
  });

  if (!stockTake) {
    throw new Error('Stock take not found');
  }

  if (stockTake.status !== 'IN_PROGRESS') {
    throw new Error(`Stock take must be IN_PROGRESS to add items. Current status: ${stockTake.status}`);
  }

  const results = [];
  const errors = [];

  for (const item of items) {
    try {
      const { variantId, countedQuantity, notes } = item;

      // Get variant with current stock
      const variant = await prisma.productVariant.findUnique({
        where: { id: parseInt(variantId) },
        select: {
          id: true,
          stock: true,
          price: true,
          product: {
            select: {
              title: true
            }
          }
        },
      });

      if (!variant) {
        errors.push({
          item,
          error: `Variant ${variantId} not found`,
        });
        continue;
      }

      // Check if item already exists in stock take
      const existingItem = await prisma.stockTakeItem.findUnique({
        where: {
          stockTakeId_variantId: {
            stockTakeId: parseInt(stockTakeId),
            variantId: parseInt(variantId),
          },
        },
      });

      if (existingItem) {
        errors.push({
          item,
          error: `Variant ${variantId} already added to this stock take`,
        });
        continue;
      }

      const difference = countedQuantity - variant.stock;

      // Create stock take item
      const stockTakeItem = await prisma.stockTakeItem.create({
        data: {
          stockTakeId: parseInt(stockTakeId),
          variantId: parseInt(variantId),
          systemQuantity: variant.stock,
          countedQuantity,
          difference,
          notes,
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
        },
      });

      results.push(stockTakeItem);

      // Update stock take counters
      await prisma.stockTake.update({
        where: { id: parseInt(stockTakeId) },
        data: {
          totalItems: { increment: 1 },
          itemsCounted: { increment: 1 },
          itemsAdjusted: difference !== 0 ? { increment: 1 } : undefined,
          discrepancyValue: difference !== 0 
            ? { increment: new Prisma.Decimal(Math.abs(difference * Number(variant.price))) }
            : undefined,
        },
      });

    } catch (error) {
      errors.push({
        item,
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

/**
 * Complete a stock take
 */
export const completeStockTake = async (stockTakeId, userId, autoAdjust = false) => {
  const stockTake = await prisma.stockTake.findUnique({
    where: { id: parseInt(stockTakeId) },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                },
              },
            }
          },
        },
      },
    },
  });

  if (!stockTake) {
    throw new Error('Stock take not found');
  }

  if (stockTake.status !== 'IN_PROGRESS') {
    throw new Error(`Stock take must be IN_PROGRESS to complete. Current status: ${stockTake.status}`);
  }
  const result = await prisma.$transaction(async (tx) => {
    if (autoAdjust) {
      for (const item of stockTake.items) {
        if (item.difference !== 0 && !item.adjusted) {
          const adjustmentQuantity = item.difference;
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: { increment: adjustmentQuantity },
            },
          });
          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              movementType: 'CORRECTION',
              quantity: adjustmentQuantity,
              previousStock: item.systemQuantity,
              newStock: item.systemQuantity + adjustmentQuantity,
              referenceId: stockTake.id,
              referenceType: 'STOCK_TAKE',
              reason: `Stock take adjustment - ${stockTake.title}`,
              notes: item.notes,
              createdById: parseInt(userId),
              sellingPrice: item.variant.price,
            },
          });
          await tx.stockTakeItem.update({
            where: { id: item.id },
            data: {
              adjusted: true,
              adjustedAt: new Date(),
              adjustedById: parseInt(userId),
            },
          });

          // 🔔 Trigger alerts if necessary
          await checkAndUpdateStockAlerts(item.variantId, item.systemQuantity + adjustmentQuantity, tx);
        }
      }
    }
    const updatedStockTake = await tx.stockTake.update({
      where: { id: parseInt(stockTakeId) },
      data: {
        status: 'COMPLETED',
        endDate: new Date(),
        completedAt: new Date(),
        approvedById: parseInt(userId),
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
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
          },
        },
      },
    });

    return updatedStockTake;
  });

  return result;
};
export const getStockTakeById = async (stockTakeId) => {
  const stockTake = await prisma.stockTake.findUnique({
    where: { id: parseInt(stockTakeId) },
    include: {
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
      approvedBy: {
        select: {
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: {
                  title: true,
                  category: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            }
          },
          adjustedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          difference: 'desc', 
        },
      },
    },
  });

  if (!stockTake) {
    throw new Error('Stock take not found');
  }
  const itemsWithDifference = stockTake.items.filter(item => item.difference !== 0);
  const totalDiscrepancyValue = itemsWithDifference.reduce((sum, item) => {
    return sum + Math.abs(item.difference * Number(item.variant.price));
  }, 0);

  return {
    ...stockTake,
    summary: {
      totalItems: stockTake.totalItems,
      itemsCounted: stockTake.itemsCounted,
      itemsAdjusted: stockTake.itemsAdjusted,
      itemsWithDifference: itemsWithDifference.length,
      totalDiscrepancyValue: parseFloat(totalDiscrepancyValue.toFixed(2)),
      accuracyRate: stockTake.totalItems > 0 
        ? ((stockTake.totalItems - itemsWithDifference.length) / stockTake.totalItems) * 100 
        : 100,
    },
  };
};
export const getAllStockTakes = async (filters = {}) => {
  const {
    status,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = filters;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const where = {};

  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [stockTakes, total] = await Promise.all([
    prisma.stockTake.findMany({
      where,
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.stockTake.count({ where }),
  ]);
  const stockTakesWithSummary = await Promise.all(
    stockTakes.map(async (stockTake) => {
      const itemsWithDifference = await prisma.stockTakeItem.count({
        where: {
          stockTakeId: stockTake.id,
          difference: { not: 0 },
        },
      });

      return {
        ...stockTake,
        summary: {
          itemsCount: stockTake._count.items,
          itemsWithDifference,
          accuracyRate: stockTake._count.items > 0 
            ? ((stockTake._count.items - itemsWithDifference) / stockTake._count.items) * 100 
            : 100,
        },
      };
    })
  );

  return {
    stockTakes: stockTakesWithSummary,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
};
export const cancelStockTake = async (stockTakeId, userId, reason) => {
  const stockTake = await prisma.stockTake.findUnique({
    where: { id: parseInt(stockTakeId) },
  });

  if (!stockTake) {
    throw new Error('Stock take not found');
  }

  if (stockTake.status === 'COMPLETED') {
    throw new Error('Cannot cancel a completed stock take');
  }

  if (stockTake.status === 'CANCELLED') {
    throw new Error('Stock take is already cancelled');
  }

  const updatedStockTake = await prisma.stockTake.update({
    where: { id: parseInt(stockTakeId) },
    data: {
      status: 'CANCELLED',
      notes: reason ? `${stockTake.notes || ''}\nCancelled: ${reason}` : stockTake.notes,
    },
    include: {
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return updatedStockTake;
};
export const getStockTakeReport = async (stockTakeId) => {
  const stockTake = await getStockTakeById(stockTakeId);
  const categoryBreakdown = {};
  stockTake.items.forEach(item => {
    const categoryName = item.variant.product.category?.name || 'Uncategorized';
    
    if (!categoryBreakdown[categoryName]) {
      categoryBreakdown[categoryName] = {
        category: categoryName,
        items: [],
        totalItems: 0,
        itemsWithDifference: 0,
        totalDifference: 0,
        totalValueDifference: 0,
      };
    }

    categoryBreakdown[categoryName].items.push(item);
    categoryBreakdown[categoryName].totalItems += 1;
    
    if (item.difference !== 0) {
      categoryBreakdown[categoryName].itemsWithDifference += 1;
      categoryBreakdown[categoryName].totalDifference += item.difference;
      categoryBreakdown[categoryName].totalValueDifference += Math.abs(
        item.difference * Number(item.variant.price)
      );
    }
  });
  const topDiscrepancies = [...stockTake.items]
    .filter(item => item.difference !== 0)
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
    .slice(0, 10);

  return {
    stockTake: {
      id: stockTake.id,
      title: stockTake.title,
      status: stockTake.status,
      createdAt: stockTake.createdAt,
      completedAt: stockTake.completedAt,
      createdBy: stockTake.createdBy,
      approvedBy: stockTake.approvedBy,
    },
    summary: stockTake.summary,
    categoryBreakdown: Object.values(categoryBreakdown).map(cat => ({
      ...cat,
      accuracyRate: cat.totalItems > 0 
        ? ((cat.totalItems - cat.itemsWithDifference) / cat.totalItems) * 100 
        : 100,
      totalValueDifference: parseFloat(cat.totalValueDifference.toFixed(2)),
    })),
    topDiscrepancies: topDiscrepancies.map(item => ({
      variantId: item.variantId,
      productTitle: item.variant.product.title,
      sku: item.variant.sku,
      systemQuantity: item.systemQuantity,
      countedQuantity: item.countedQuantity,
      difference: item.difference,
      valueDifference: parseFloat(Math.abs(item.difference * Number(item.variant.price)).toFixed(2)),
      adjusted: item.adjusted,
    })),
    items: stockTake.items.map(item => ({
      variantId: item.variantId,
      productTitle: item.variant.product.title,
      sku: item.variant.sku,
      category: item.variant.product.category?.name,
      price: item.variant.price,
      systemQuantity: item.systemQuantity,
      countedQuantity: item.countedQuantity,
      difference: item.difference,
      valueDifference: parseFloat(Math.abs(item.difference * Number(item.variant.price)).toFixed(2)),
      adjusted: item.adjusted,
      notes: item.notes,
    })),
  };
};