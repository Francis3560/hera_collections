import prisma from '../database.js';
export const setStockAlert = async (productId, threshold, userId) => {
  const product = await prisma.product.findUnique({
    where: { id: parseInt(productId) },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  if (!threshold || threshold < 0) {
    throw new Error('Threshold must be a positive number');
  }

  const existingAlert = await prisma.stockAlert.findUnique({
    where: { productId: parseInt(productId) },
  });

  let alert;
  
  if (existingAlert) {
    alert = await prisma.stockAlert.update({
      where: { productId: parseInt(productId) },
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
        productId: parseInt(productId),
        threshold: parseInt(threshold),
        isActive: true,
      },
    });
  }
  if (product.quantity <= threshold) {
    await prisma.stockAlert.update({
      where: { productId: parseInt(productId) },
      data: {
        notifiedAt: new Date(),
        isResolved: false,
      },
    });
  }

  return {
    ...alert,
    product: {
      id: product.id,
      title: product.title,
      sku: product.sku,
      currentStock: product.quantity,
    },
  };
};
export const disableStockAlert = async (productId) => {
  const alert = await prisma.stockAlert.findUnique({
    where: { productId: parseInt(productId) },
  });

  if (!alert) {
    throw new Error('Stock alert not found for this product');
  }

  const updatedAlert = await prisma.stockAlert.update({
    where: { productId: parseInt(productId) },
    data: {
      isActive: false,
      isResolved: true,
      resolvedAt: new Date(),
    },
  });

  return updatedAlert;
};
export const resolveStockAlert = async (productId, userId) => {
  const alert = await prisma.stockAlert.findUnique({
    where: { productId: parseInt(productId) },
  });

  if (!alert) {
    throw new Error('Stock alert not found for this product');
  }

  if (!alert.isActive) {
    throw new Error('Stock alert is not active');
  }
  const product = await prisma.product.findUnique({
    where: { id: parseInt(productId) },
    select: { quantity: true },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  const updatedAlert = await prisma.stockAlert.update({
    where: { productId: parseInt(productId) },
    data: {
      isResolved: product.quantity > alert.threshold,
      resolvedAt: product.quantity > alert.threshold ? new Date() : null,
      resolvedById: product.quantity > alert.threshold ? parseInt(userId) : null,
    },
  });

  return {
    ...updatedAlert,
    currentStock: product.quantity,
    threshold: alert.threshold,
    isBelowThreshold: product.quantity <= alert.threshold,
  };
};
export const getActiveStockAlerts = async () => {
  const alerts = await prisma.stockAlert.findMany({
    where: {
      isActive: true,
      OR: [
        { isResolved: false },
        { notifiedAt: null },
      ],
    },
    include: {
      product: {
        select: {
          title: true,
          sku: true,
          quantity: true,
          price: true,
          category: {
            select: {
              name: true,
            },
          },
          photos: {
            take: 1,
            select: {
              url: true,
            },
          },
        },
      },
    },
    orderBy: [
      { isResolved: 'asc' },
      { notifiedAt: 'desc' },
    ],
  });
  const activeAlerts = alerts.filter(alert => {
    return alert.product.quantity <= alert.threshold;
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
    where.productId = parseInt(productId);
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
        product: {
          select: {
            title: true,
            sku: true,
          },
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
export const getStockAlertStats = async () => {
  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalAlerts,
    activeAlerts,
    resolvedAlerts,
    recentAlerts,
    productsBelowThreshold,
  ] = await Promise.all([
    // Total alerts
    prisma.stockAlert.count({
      where: { isActive: true },
    }),

    // Active alerts (not resolved)
    prisma.stockAlert.count({
      where: {
        isActive: true,
        isResolved: false,
      },
    }),

    // Resolved alerts
    prisma.stockAlert.count({
      where: {
        isActive: true,
        isResolved: true,
      },
    }),

    // Alerts created in last 30 days
    prisma.stockAlert.count({
      where: {
        createdAt: { gte: last30Days },
      },
    }),

    // Products currently below threshold (even without alerts)
    prisma.product.count({
      where: {
        isPublished: true,
        quantity: { lte: 10 }, // Default threshold
      },
    }),
  ]);

  // Get products with most frequent alerts
  const frequentAlerts = await prisma.stockAlert.groupBy({
    by: ['productId'],
    _count: {
      _all: true,
    },
    orderBy: {
      _count: {
        _all: 'desc',
      },
    },
    take: 5,
  });

  // Get product details
  const productIds = frequentAlerts.map(alert => alert.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      title: true,
      sku: true,
      quantity: true,
    },
  });

  const frequentAlertsWithDetails = frequentAlerts.map(alert => {
    const product = products.find(p => p.id === alert.productId);
    return {
      productId: alert.productId,
      productTitle: product?.title || 'Unknown',
      sku: product?.sku,
      currentStock: product?.quantity || 0,
      alertCount: alert._count._all,
    };
  });

  return {
    summary: {
      totalAlerts,
      activeAlerts,
      resolvedAlerts,
      resolutionRate: totalAlerts > 0 ? (resolvedAlerts / totalAlerts) * 100 : 0,
      recentAlerts,
      productsBelowThreshold,
    },
    frequentAlerts: frequentAlertsWithDetails,
  };
};