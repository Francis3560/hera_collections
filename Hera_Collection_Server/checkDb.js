
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  try {
    const nullProductItems = await prisma.orderItem.count({
      where: { productId: null }
    });
    console.log('OrderItems with productId null:', nullProductItems);

    const result = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          status: { in: ['PAID', 'FULFILLED'] }
        }
      },
      _sum: { quantity: true, total: true },
      _count: { orderId: true }
    });
    console.log('GroupBy result:', JSON.stringify(result, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value, 2));

  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
