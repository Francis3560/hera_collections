import prisma from '../database.js';
import { Prisma } from '@prisma/client';
import * as stockService from './stockService.js';
import { 
  subDays, 
  subMonths, 
  subYears, 
  startOfDay, 
  startOfMonth, 
  startOfYear, 
  endOfYear, 
  endOfMonth, 
  eachMonthOfInterval,
  addDays 
} from 'date-fns';
import {
  sendOrderConfirmationEmail,
  sendAdminOrderNotification,
  sendOrderStatusUpdateEmail,
  sendOrderProcessingEmail,
  sendOrderShippedEmail
} from './emails/emailService.js';
import NotificationService from './notification.service.js';

async function generateOrderNumber() {
  const lastOrder = await prisma.order.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { orderNumber: true },
  });

  if (!lastOrder || !lastOrder.orderNumber) {
    return 'HERA001';
  }

  // Fix: Replace the correct prefix 'HERA' (or 'VZG' for legacy support)
  const lastNum = parseInt(lastOrder.orderNumber.replace(/^(HERA|VZG)/, ''), 10) || 0;
  const nextNum = (lastNum + 1).toString().padStart(3, '0');
  return `HERA${nextNum}`;
}

export async function createOrder(userId, data, paymentIntentId = null) {
  const { items, customer, payment, amounts, shipping } = data;
  const productIds = items.map((i) => i.productId);

  const products = await prisma.product.findMany({
    where: { 
      id: { in: productIds }, 
      isPublished: true 
    },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (products.length !== items.length) {
    throw new Error('Some products are invalid or unavailable');
  }
  
  const orderNumber = await generateOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    console.log(`[OrderService] Starting transaction for Order #${orderNumber}`);
    
    // Check stock availability
    for (const item of items) {
      if (item.variantId) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true }
        });

        if (!variant) {
          throw new Error(`Product variant not found (ID: ${item.variantId})`);
        }

        console.log(`[OrderService] Checking stock for ${variant.sku}: requested ${item.quantity}, available ${variant.stock}`);
        if (variant.stock < item.quantity) {
          throw new Error(`Not enough stock for "${variant.product.title}" (${variant.sku}). Available: ${variant.stock}, Requested: ${item.quantity}`);
        }
      } else {
        // Fallback for items without variantId (if any)
        const product = products.find(p => p.id === item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }
        
        const firstVariant = await tx.productVariant.findFirst({
          where: { productId: item.productId }
        });

        if (firstVariant && firstVariant.stock < item.quantity) {
          throw new Error(`Not enough stock for "${product.title}". Available: ${firstVariant.stock}, Requested: ${item.quantity}`);
        }
      }
    }

    console.log(`[OrderService] Creating order record...`);

    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        buyerId: userId,
        status: payment.method === 'CASH' ? 'PAID' : 'PENDING',
        paymentMethod: payment.method,
        customerPhone: payment.phone || customer.phone,
        customerFirstName: customer.firstName || null,
        customerLastName: customer.lastName || null,
        customerEmail: customer.email || null,
        shippingAddress: shipping?.address || null,
        shippingCity: shipping?.city || null,
        shippingCountry: shipping?.country || null,
        notes: shipping?.notes || null,
        subtotalAmount: new Prisma.Decimal(amounts.subtotal),
        totalAmount: new Prisma.Decimal(amounts.total),
        paymentIntentId,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: new Prisma.Decimal(item.price),
            total: new Prisma.Decimal(item.price * item.quantity), // Fixed: Calculate total for line item
            variantName: item.variantName || null,
            variantValue: item.variantValue || null,
            variantId: item.variantId || null // Link to the specific variant
          })),
        },
      },
      include: { 
        items: { 
          include: { 
            product: {
              include: {
                photos: true,
                seller: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            } 
          } 
        } 
      },
    });
    
    console.log("Recording stock movements and clearing cart...");
    // Record stock movements (this also updates variant stock and broadcasts)
    await stockService.recordSaleMovement(newOrder.id, items, userId, tx);

    // Clear user's cart after order creation
    await tx.cartItem.deleteMany({
      where: {
        cart: {
          userId: userId
        }
      }
    });

    return newOrder;
  });
  try {
    const customerName = order.customerFirstName 
      ? `${order.customerFirstName} ${order.customerLastName || ''}`.trim()
      : 'Customer';

    await sendOrderConfirmationEmail(order, customerName, order.items);
    await sendAdminOrderNotification(order, order.items, customerName);
    // 🏆 ADDED: Real-time Notification for the Buyer
    await NotificationService.createNotification({
      userId: userId,
      type: 'ORDER_PLACED',
      title: 'Order Placed Successfully',
      message: `Your order ${order.orderNumber} has been placed and is being processed.`,
      link: `/profile/orders/${order.id}`,
      entityId: order.id,
      entityType: 'ORDER'
    });

    // 🏆 ADDED: Real-time Notification for the Admin (via broadcast logic in service)
    // The service handles sendAdminNotification for ORDER_PLACED type.

  } catch (emailError) {
    console.error('Failed to send order notification emails:', emailError);
  }

  return order;
}

export async function getUserOrders(userId, filters = {}) {
  const { search, status } = filters;
  const where = { buyerId: userId };

  if (search) {
    where.orderNumber = { contains: search, mode: 'insensitive' };
  }
  if (status) {
    where.status = status;
  }

  return prisma.order.findMany({
    where,
    include: { 
      items: { 
        include: { 
          product: {
            include: {
              photos: true,
              category: true
            }
          }
        } 
      } 
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAllOrderItems(filters = {}) {
  const { search } = filters;
  const where = {};
  
  if (search) {
      where.product = {
          title: { contains: search }
      };
  }

  return prisma.orderItem.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
        order: {
            select: { 
              orderNumber: true, 
              status: true, 
              buyerId: true,
              customerFirstName: true,
              customerLastName: true
            }
        },
        product: {
             include: { photos: true }
        }
    }
  });
}

export async function getAllOrders(filters = {}) {
  const { status, startDate, endDate, paymentMethod, search } = filters;
  
  const where = {};
  
  if (status) where.status = status;
  if (paymentMethod) where.paymentMethod = paymentMethod;
  if (search) {
      where.OR = [
          { orderNumber: { contains: search } },
          { customerFirstName: { contains: search } },
          { customerLastName: { contains: search } },
          { customerEmail: { contains: search } }
      ];
  }
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  return prisma.order.findMany({
    where,
    include: {
      buyer: { 
        select: { 
          id: true, 
          name: true, 
          email: true, 
          phone: true 
        } 
      },
      items: { 
        include: { 
          product: {
            include: {
              photos: true,
              category: true
            }
          }
        } 
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getOrderById(userId, orderId) {
  const order = await prisma.order.findFirst({
    where: { 
      id: orderId, 
      buyerId: userId 
    },
    include: { 
      items: { 
        include: { 
          product: {
            include: {
              photos: true,
              category: true,
              seller: {
                select: {
                  name: true,
                  phone: true,
                  email: true
                }
              }
            }
          }
        } 
      } 
    },
  });

  if (!order) throw new Error('Order not found');
  return order;
}

export async function getOrderByIdAdmin(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: { 
        select: { 
          id: true, 
          name: true, 
          email: true, 
          phone: true 
        } 
      },
      items: { 
        include: { 
          product: {
            include: {
              photos: true,
              category: true,
              seller: {
                select: {
                  name: true,
                  phone: true,
                  email: true
                }
              }
            }
          }
        } 
      },
      paymentIntent: true,
    },
  });

  if (!order) throw new Error('Order not found');
  return order;
}

export async function updateOrderStatus(orderId, status, adminUserId, trackingNumber = null, estimatedDelivery = null) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { 
      buyer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      items: {
        include: {
          product: true
        }
      }
    },
  });

  if (!order) throw new Error('Order not found');

  const oldStatus = order.status;
  
  const updateData = { status };

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: updateData,
  });

  if (status === 'SHIPPED' || status === 'FULFILLED') {
      // Check if shipment already exists
      const existingShipment = await prisma.shipment.findFirst({
          where: { orderId: orderId }
      });
      
      if (!existingShipment) {
          await prisma.shipment.create({
              data: {
                  orderId,
                  trackingNumber: trackingNumber || `TRK-${Date.now()}`,
                  carrier: 'Default',
                  method: 'Standard',
                  status: status,
                  shippedAt: new Date(),
                  estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null
              }
          });
      } else {
           await prisma.shipment.update({
              where: { id: existingShipment.id },
              data: {
                  status: status,
                  shippedAt: new Date(),
                  trackingNumber: trackingNumber || existingShipment.trackingNumber,
                   estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : existingShipment.estimatedDelivery
              }
          });
      }
  }
  try {
    const customerName = order.customerFirstName 
      ? `${order.customerFirstName} ${order.customerLastName || ''}`.trim()
      : order.buyer.name || 'Customer';

    const customerEmail = order.customerEmail || order.buyer.email;
    
    if (customerEmail) {
      await sendOrderStatusUpdateEmail(order, customerName, oldStatus, status);
      if (status === 'PAID') {
        await sendOrderProcessingEmail(updatedOrder, customerName);
      } else if (status === 'SHIPPED') {
        await sendOrderShippedEmail(updatedOrder, customerName, trackingNumber, estimatedDelivery);
      } else if (status === 'FULFILLED') {
        await sendOrderStatusUpdateEmail(updatedOrder, customerName, oldStatus, 'DELIVERED');
      }
    }

    // 🏆 ADDED: Real-time Notification for Status Update
    await NotificationService.createNotification({
      userId: order.buyerId,
      type: status === 'CANCELLED' ? 'ORDER_CANCELLED' : 'ORDER_FULFILLED',
      title: `Order ${status.toLowerCase()}`,
      message: `Your order ${order.orderNumber} status has been updated to ${status}.`,
      link: `/profile/orders/${order.id}`,
      entityId: order.id,
      entityType: 'ORDER'
    });
  } catch (emailError) {
    console.error('Failed to send status update email:', emailError);
  }

  return updatedOrder;
}

export async function updateOrderDetails(orderId, updateData) {
  const order = await prisma.order.findUnique({ 
    where: { id: orderId } 
  });
  
  if (!order) throw new Error('Order not found');

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: updateData,
  });

  return updatedOrder;
}

export async function deleteOrder(orderId) {
  const order = await prisma.order.findUnique({ 
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });
  
  if (!order) throw new Error('Order not found');
  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { increment: item.quantity } },
      });
    }
    await tx.order.delete({ where: { id: orderId } });
  });

  return { 
    message: 'Order deleted successfully',
    orderNumber: order.orderNumber 
  };
}

export async function getSalesAnalytics(timeframe = 'monthly') {
  const now = new Date();
  let startDate;

  switch (timeframe) {
    case 'daily':
      startDate = startOfDay(now);
      break;
    case 'weekly':
      startDate = subDays(now, 7);
      break;
    case 'monthly':
      startDate = subMonths(now, 1);
      break;
    case 'yearly':
      startDate = subYears(now, 1);
      break;
    default:
      startDate = subMonths(now, 1);
  }

  const orders = await prisma.order.findMany({
    where: {
      status: { in: ['PAID', 'FULFILLED'] },
      createdAt: { gte: startDate },
    },
    include: {
      items: {
        include: { 
          product: { 
            select: { 
              category: true,
              title: true
            } 
          } 
        }
      },
    },
  });

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const totalOrders = orders.length;
  const totalItemsSold = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const categoryBreakdown = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      const categoryName = item.product?.category?.name || 'Uncategorized';
      if (!categoryBreakdown[categoryName]) {
        categoryBreakdown[categoryName] = {
          quantity: 0,
          revenue: 0,
          orders: 0
        };
      }
      categoryBreakdown[categoryName].quantity += item.quantity;
      categoryBreakdown[categoryName].revenue += Number(item.price) * item.quantity;
      categoryBreakdown[categoryName].orders += 1;
    });
  });
  const paymentMethodBreakdown = {};
  orders.forEach(order => {
    const method = order.paymentMethod;
    if (!paymentMethodBreakdown[method]) {
      paymentMethodBreakdown[method] = {
        count: 0,
        revenue: 0
      };
    }
    paymentMethodBreakdown[method].count += 1;
    paymentMethodBreakdown[method].revenue += Number(order.totalAmount);
  });

  return {
    timeframe,
    period: {
      start: startDate,
      end: now
    },
    summary: {
      totalRevenue,
      totalOrders,
      totalItemsSold,
      avgOrderValue,
      avgItemsPerOrder: totalOrders > 0 ? totalItemsSold / totalOrders : 0
    },
    categoryBreakdown,
    paymentMethodBreakdown,
    topProducts: await getTopProducts(startDate, now),
    recentOrders: orders.slice(0, 10).map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      totalAmount: o.totalAmount,
      status: o.status,
      createdAt: o.createdAt,
      itemsCount: o.items.length
    }))
  };
}

async function getTopProducts(startDate, endDate, limit = 5) {
  const result = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: {
        status: { in: ['PAID', 'FULFILLED'] },
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    },
    _sum: {
      quantity: true,
      total: true
    },
    _count: {
      orderId: true
    },
    orderBy: {
      _sum: {
        quantity: 'desc'
      }
    },
    take: limit
  });
  const productIds = result.map(r => r.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      title: true,
      photos: true,
      category: {
        select: {
          name: true
        }
      }
    }
  });

  return result.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      productId: item.productId,
      title: product?.title || 'Unknown Product',
      category: product?.category?.name || 'Uncategorized',
      totalQuantity: item._sum.quantity,
      totalRevenue: Number(item._sum.total) || 0,
      orderCount: item._count.orderId,
    };
  });
}

export async function getSalesTrends() {
  const now = new Date();
  const yearStart = startOfYear(now);
  const yearEnd = endOfYear(now);
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
  const monthly = [];

  for (const monthStart of months) {
    const monthEnd = endOfMonth(monthStart);

    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['PAID', 'FULFILLED'] },
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      select: { 
        totalAmount: true,
        createdAt: true,
        items: {
          select: {
            quantity: true
          }
        }
      },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalOrders = orders.length;
    const totalItems = orders.reduce((sum, o) => 
      sum + o.items.reduce((itemSum, i) => itemSum + i.quantity, 0), 0
    );
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    monthly.push({
      month: monthStart.toLocaleString("en-US", { month: "short" }), 
      year: monthStart.getFullYear(),
      totalRevenue,
      totalOrders,
      totalItems,
      avgOrderValue,
    });
  }
  const currentMonthStart = startOfMonth(now);
  const dailyOrders = await prisma.order.findMany({
    where: {
      status: { in: ['PAID', 'FULFILLED'] },
      createdAt: { gte: currentMonthStart, lte: now },
    },
    select: { 
      totalAmount: true, 
      createdAt: true 
    },
  });
  const dailyStats = {};
  dailyOrders.forEach(order => {
    const day = order.createdAt.getDate();
    if (!dailyStats[day]) {
      dailyStats[day] = {
        revenue: 0,
        orders: 0
      };
    }
    dailyStats[day].revenue += Number(order.totalAmount);
    dailyStats[day].orders += 1;
  });

  const daily = Object.entries(dailyStats).map(([day, stats]) => ({
    day: parseInt(day),
    totalRevenue: stats.revenue,
    totalOrders: stats.orders,
    avgOrderValue: stats.orders > 0 ? stats.revenue / stats.orders : 0
  })).sort((a, b) => a.day - b.day);

  return { 
    monthly, 
    daily,
    currentMonth: {
      name: now.toLocaleString("en-US", { month: "long" }),
      year: now.getFullYear(),
      totalRevenue: monthly.find(m => m.month === now.toLocaleString("en-US", { month: "short" }))?.totalRevenue || 0,
      totalOrders: monthly.find(m => m.month === now.toLocaleString("en-US", { month: "short" }))?.totalOrders || 0,
    }
  };
}
export async function getOrderStats() {
  const [
    totalOrders,
    pendingOrders,
    paidOrders,
    fulfilledOrders,
    cancelledOrders,
    totalRevenue,
    todayOrders,
    todayRevenue
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'PAID' } }),
    prisma.order.count({ where: { status: 'FULFILLED' } }),
    prisma.order.count({ where: { status: 'CANCELLED' } }),
    prisma.order.aggregate({
      where: { status: { in: ['PAID', 'FULFILLED'] } },
      _sum: { totalAmount: true }
    }),
    prisma.order.count({
      where: {
        status: { in: ['PAID', 'FULFILLED'] },
        createdAt: { gte: startOfDay(new Date()) }
      }
    }),
    prisma.order.aggregate({
      where: {
        status: { in: ['PAID', 'FULFILLED'] },
        createdAt: { gte: startOfDay(new Date()) }
      },
      _sum: { totalAmount: true }
    })
  ]);

  return {
    totals: {
      orders: totalOrders,
      revenue: Number(totalRevenue._sum.totalAmount) || 0
    },
    status: {
      pending: pendingOrders,
      paid: paidOrders,
      fulfilled: fulfilledOrders,
      cancelled: cancelledOrders
    },
    today: {
      orders: todayOrders,
      revenue: Number(todayRevenue._sum.totalAmount) || 0
    }
  };
}