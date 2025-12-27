import prisma from '../database.js';
import { Prisma } from '@prisma/client';
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

async function generateOrderNumber() {
  const lastOrder = await prisma.order.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { orderNumber: true },
  });

  if (!lastOrder || !lastOrder.orderNumber) {
    return 'HERA001';
  }

  const lastNum = parseInt(lastOrder.orderNumber.replace('VZG', ''), 10) || 0;
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
  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} not found`);
    }
    if (product.quantity < item.quantity) {
      throw new Error(`Not enough stock for "${product.title}". Available: ${product.quantity}, Requested: ${item.quantity}`);
    }
  }

  const orderNumber = await generateOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        buyerId: userId,
        status: payment.method === 'CASH' ? 'PAID' : 'PENDING',
        paymentMethod: payment.method,
        phone: payment.phone || customer.phone,
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
            variantName: item.variantName || null,
            variantValue: item.variantValue || null,
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
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });
    }

    return newOrder;
  });
  try {
    const customerName = order.customerFirstName 
      ? `${order.customerFirstName} ${order.customerLastName || ''}`.trim()
      : 'Customer';

    await sendOrderConfirmationEmail(order, customerName, order.items);
    await sendAdminOrderNotification(order, order.items, customerName);
    const sellerNotifications = [];
    for (const item of order.items) {
      const seller = item.product.seller;
      if (seller && seller.email && seller.id !== userId) { 
        const sellerOrderDetails = {
          orderNumber: order.orderNumber,
          product: item.product.title,
          quantity: item.quantity,
          price: item.price,
          customerName,
          total: item.quantity * item.price
        };
        console.log(`Seller ${seller.name} should be notified about order ${order.orderNumber}`);
        sellerNotifications.push(seller.email);
      }
    }

  } catch (emailError) {
    console.error('Failed to send order notification emails:', emailError);
  }

  return order;
}

export async function getUserOrders(userId) {
  return prisma.order.findMany({
    where: { buyerId: userId },
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

export async function getAllOrders(filters = {}) {
  const { status, startDate, endDate, paymentMethod } = filters;
  
  const where = {};
  
  if (status) where.status = status;
  if (paymentMethod) where.paymentMethod = paymentMethod;
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
  if (status === 'SHIPPED' || status === 'FULFILLED') {
    updateData.shippedAt = new Date();
    if (trackingNumber) {
      updateData.notes = order.notes 
        ? `${order.notes}\n\nTracking: ${trackingNumber}`
        : `Tracking: ${trackingNumber}`;
    }
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: updateData,
  });
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
      price: true
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
      price: true,
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
      totalRevenue: Number(item._sum.price) * item._sum.quantity,
      orderCount: item._count.orderId,
      price: product?.price || 0
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