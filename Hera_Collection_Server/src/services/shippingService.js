import prisma from '../database.js';

export async function getAllRegions(filters = {}) {
  const { isActive } = filters;
  const where = {};
  if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;

  return prisma.shippingRegion.findMany({
    where,
    orderBy: { name: 'asc' }
  });
}

export async function getRegionById(id) {
  return prisma.shippingRegion.findUnique({
    where: { id: parseInt(id) }
  });
}

export async function createRegion(data) {
  return prisma.shippingRegion.create({
    data: {
      ...data,
      fee: parseFloat(data.fee)
    }
  });
}

export async function updateRegion(id, data) {
  const updateData = { ...data };
  if (data.fee !== undefined) updateData.fee = parseFloat(data.fee);

  return prisma.shippingRegion.update({
    where: { id: parseInt(id) },
    data: updateData
  });
}

export async function deleteRegion(id) {
  return prisma.shippingRegion.delete({
    where: { id: parseInt(id) }
  });
}
