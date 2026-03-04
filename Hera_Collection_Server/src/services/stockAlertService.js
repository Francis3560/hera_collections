import prisma from '../database.js';
export const setStockAlert = async (variantId, threshold, userId) => {
  const variant = await prisma.productVariant.findUnique({
    where: { id: parseInt(variantId) },
  });

  if (!variant) {
    throw new Error('Product variant not found');
  }

  if (!threshold || threshold < 0) {
    throw new Error('Threshold must be a positive number');
  }

  const existingAlert = await prisma.stockAlert.findUnique({
    where: { variantId: parseInt(variantId) },
  });

  let alert;
  
  if (existingAlert) {
    alert = await prisma.stockAlert.update({
      where: { variantId: parseInt(variantId) },
      data: {
        threshold: parseInt(threshold),
        isActive: true,
        isResolved: false,
        resolvedAt: null,
        resolvedById: null,
      },
    });
  } else {
    alert = await prisma.stockAlert.create({
      data: {
        variantId: parseInt(variantId),
        threshold: parseInt(threshold),
        isActive: true,
      },
    });
  }
  if (variant.stock <= threshold) {
    await prisma.stockAlert.update({
      where: { variantId: parseInt(variantId) },
      data: {
        notifiedAt: new Date(),
        isResolved: false,
      },
    });
  }

  return {
    ...alert,
    variant: {
      id: variant.id,
      sku: variant.sku,
      currentStock: variant.stock,
    },
  };
};
export const disableStockAlert = async (variantId) => {
  const alert = await prisma.stockAlert.findUnique({
    where: { variantId: parseInt(variantId) },
  });

  if (!alert) {
    throw new Error('Stock alert not found for this variant');
  }

  const updatedAlert = await prisma.stockAlert.update({
    where: { variantId: parseInt(variantId) },
    data: {
      isActive: false,
      isResolved: true,
      resolvedAt: new Date(),
    },
  });

  return updatedAlert;
};
export const resolveStockAlert = async (variantId, userId) => {
  const alert = await prisma.stockAlert.findUnique({
    where: { variantId: parseInt(variantId) },
  });

  if (!alert) {
    throw new Error('Stock alert not found for this variant');
  }

  if (!alert.isActive) {
    throw new Error('Stock alert is not active');
  }
  const variant = await prisma.productVariant.findUnique({
    where: { id: parseInt(variantId) },
    select: { stock: true },
  });

  if (!variant) {
    throw new Error('Product variant not found');
  }

  const updatedAlert = await prisma.stockAlert.update({
    where: { variantId: parseInt(variantId) },
    data: {
      isResolved: variant.stock > alert.threshold,
      resolvedAt: variant.stock > alert.threshold ? new Date() : null,
      resolvedById: variant.stock > alert.threshold ? parseInt(userId) : null,
    },
  });

  return {
    ...updatedAlert,
    currentStock: variant.stock,
    threshold: alert.threshold,
    isBelowThreshold: variant.stock <= alert.threshold,
  };
};
export const getActiveStockAlerts = async () => {
  // Fetch variants that are either below their custom alert threshold OR below default threshold 10
  const variantsWithLowStock = await prisma.productVariant.findMany({
    where: {
      isActive: true,
      OR: [
        {
          // Has at least one active alert and stock is below or equal to the threshold
          stockAlerts: {
            some: {
              isActive: true,
              isResolved: false
            }
          }
        },
        {
          // No explicit alert record but stock is below default threshold
          stock: { lte: 10 },
          stockAlerts: {
            none: {}
          }
        }
      ]
    },
    include: {
      stockAlerts: {
        where: {
          isActive: true
        }
      },
      product: {
        select: {
          title: true,
          category: {
            select: { name: true }
          }
        }
      }
    }
  });

  // Transform into a consistent alert format
  const activeAlerts = variantsWithLowStock
    .filter(v => {
      const alert = v.stockAlerts[0];
      const threshold = alert?.threshold || 10;
      return v.stock <= threshold;
    })
    .map(v => {
      const alert = v.stockAlerts[0];
      return {
        id: alert?.id || `temp-${v.id}`,
        variantId: v.id,
        threshold: alert?.threshold || 10,
        notifiedAt: alert?.notifiedAt || v.updatedAt,
        createdAt: alert?.createdAt || v.updatedAt,
        isResolved: false,
        variant: v,
        productName: v.product?.title || 'Unknown',
        message: `Item stock (${v.stock}) is at or below threshold (${alert?.threshold || 10}).`
      };
    });

  return activeAlerts;
};
export const getStockAlertHistory = async (filters = {}) => {
  const {
    productId,
    startDate,
    endDate,
    resolved,
    page = 1,
    limit = 20,
  } = filters;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const where = {};

  if (productId) {
    where.variant = { productId: parseInt(productId) };
  } else if (filters.variantId) {
    where.variantId = parseInt(filters.variantId);
  }

  if (resolved !== undefined) {
    where.isResolved = resolved === 'true';
  }

  if (startDate || endDate) {
    where.updatedAt = {};
    if (startDate) where.updatedAt.gte = new Date(startDate);
    if (endDate) where.updatedAt.lte = new Date(endDate);
  }

  const [alerts, total] = await Promise.all([
    prisma.stockAlert.findMany({
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
        resolvedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.stockAlert.count({ where }),
  ]);

  return {
    alerts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
};

/**
 * Get stock alert statistics
 */
export const getStockAlertStats = async (filters = {}) => {
  try {
    const now = new Date();
    const startDate = filters.startDate ? new Date(filters.startDate) : null;
    const endDate = filters.endDate ? new Date(filters.endDate) : now;

    const whereBase = { isActive: true };
    if (startDate || endDate) {
      whereBase.updatedAt = {};
      if (startDate) whereBase.updatedAt.gte = startDate;
      if (endDate) whereBase.updatedAt.lte = endDate;
    }

    const [
      totalAlerts,
      actualActiveAlerts,
      resolvedAlerts,
      recentAlerts,
      productsBelowThreshold,
    ] = await Promise.all([
      // Total active alerts record count in period
      prisma.stockAlert.count({
        where: whereBase,
      }),

      // Variants currently below their threshold (Explicit or Default 10)
      prisma.productVariant.count({
        where: {
          isActive: true,
          OR: [
            { stockAlerts: { some: { isActive: true, isResolved: false, ...(startDate || endDate ? { updatedAt: whereBase.updatedAt } : {}) } } },
            { stock: { lte: 10 }, stockAlerts: { none: {} } }
          ]
        },
      }),

      // Resolved alerts records in period
      prisma.stockAlert.count({
        where: {
          ...whereBase,
          isResolved: true,
        },
      }),

      // Alerts created in period
      prisma.stockAlert.count({
        where: {
          createdAt: startDate || endDate ? { 
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {})
          } : { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),

      // Total variants below generic threshold 10
      prisma.productVariant.count({
        where: {
          isActive: true,
          stock: { lte: 10 },
        },
      }),
    ]);

    // Get products with most frequent alerts
    const frequentAlertsData = await prisma.stockAlert.findMany({
      where: whereBase,
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5,
      include: {
        variant: {
          select: {
            id: true,
            sku: true,
            stock: true,
            product: {
              select: {
                title: true,
              },
            }
          }
        }
      }
    });

    const frequentAlertsWithDetails = frequentAlertsData.map(alert => ({
      variantId: alert.variantId,
      productTitle: alert.variant?.product?.title || 'Unknown',
      sku: alert.variant?.sku,
      currentStock: alert.variant?.stock || 0,
      alertCount: 1,
    }));

    return {
      summary: {
        totalAlerts,
        activeAlerts: actualActiveAlerts,
        resolvedAlerts,
        resolutionRate: totalAlerts > 0 ? (resolvedAlerts / totalAlerts) * 100 : 0,
        recentAlerts,
        productsBelowThreshold,
      },
      frequentAlerts: frequentAlertsWithDetails,
    };
  } catch (error) {
    console.error('Error in getStockAlertStats service:', error);
    throw error; // Rethrow to be caught by controller
  }
};
