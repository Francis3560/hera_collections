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

const ALLOWED_FIELDS = ['name', 'description', 'fee', 'isActive', 'estimatedDays'];

function whitelist(data) {
  const out = {};
  for (const field of ALLOWED_FIELDS) {
    if (data[field] !== undefined) out[field] = data[field];
  }
  return out;
}

export async function createRegion(data) {
  const payload = whitelist(data);
  return prisma.shippingRegion.create({
    data: {
      ...payload,
      fee: parseFloat(payload.fee),
    },
  });
}

export async function updateRegion(id, data) {
  const updateData = whitelist(data);
  if (updateData.fee !== undefined) updateData.fee = parseFloat(updateData.fee);

  return prisma.shippingRegion.update({
    where: { id: parseInt(id) },
    data: updateData,
  });
}

export async function deleteRegion(id) {
  return prisma.shippingRegion.delete({
    where: { id: parseInt(id) }
  });
}
