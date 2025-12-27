import prisma from '../database.js';
import imageService from './images/imageService.js';

export const searchProducts = async ({
  categoryId,
  minPrice,
  maxPrice,
  q,
  page = 1,
  pageSize = 20,
  includePhotos = true,
  isPublished = true,
}) => {
  const where = {
    isPublished,
    categoryId: categoryId ? parseInt(categoryId) : undefined,
    price: {
      gte: minPrice || undefined,
      lte: maxPrice || undefined,
    },
    OR: q
      ? [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ]
      : undefined,
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: includePhotos ? { 
        photos: true,
        category: true,
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      } : undefined,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return { 
    items, 
    page, 
    pageSize, 
    total, 
    totalPages: Math.ceil(total / pageSize) 
  };
};

export const getProduct = async (id) => {
  const productId = Number(id);
  if (!Number.isInteger(productId)) return null;

  return prisma.product.findFirst({
    where: { id: productId, isPublished: true },
    include: { 
      photos: true,
      category: true,
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        }
      },
      variants: true
    },
  });
};

export const adminGetProduct = async (id) => {
  const productId = Number(id);
  if (!Number.isInteger(productId)) return null;

  return prisma.product.findUnique({
    where: { id: productId },
    include: { 
      photos: true,
      category: true,
      seller: true,
      variants: true
    },
  });
};

export const getProductsBySeller = async (sellerId) => {
  return prisma.product.findMany({
    where: { 
      sellerId,
      isPublished: true 
    },
    include: { 
      photos: true,
      category: true
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getProductsByCategory = async (categoryId) => {
  return prisma.product.findMany({
    where: { 
      categoryId,
      isPublished: true 
    },
    include: { 
      photos: true,
      category: true,
      seller: {
        select: {
          id: true,
          name: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const createProduct = async (data, sellerUserId, processedImages = []) => {
  const created = await prisma.product.create({
    data: {
      title: data.title,
      description: data.description || null,
      price: data.price,
      oldPrice: data.oldPrice || null,
      sku: data.sku || null,
      quantity: data.quantity || 1,
      isPublished: data.isPublished ?? true,
      categoryId: data.categoryId ? parseInt(data.categoryId) : null,
      sellerId: parseInt(sellerUserId),
      photos: processedImages.length
        ? {
            createMany: {
              data: processedImages.map((img) => ({
                url: img.original,
                publicId: img.thumbnail,
              })),
            },
          }
        : undefined,
      variants: data.variants && Array.isArray(data.variants)
        ? {
            create: data.variants.map(variant => ({
              name: variant.name,
              value: variant.value,
              price: variant.price || null,
              quantity: variant.quantity || 0,
            }))
          }
        : undefined,
    },
    include: { 
      photos: true,
      category: true,
      variants: true
    },
  });

  return created;
};

export const updateProduct = async (id, data, processedImages = []) => {
  const productId = Number(id);
  if (!Number.isInteger(productId)) throw new Error('Invalid product id');
  if (Array.isArray(data.removeImageUrls) && data.removeImageUrls.length) {
    await prisma.photo.deleteMany({
      where: { 
        productId, 
        url: { in: data.removeImageUrls } 
      },
    });
    await Promise.all(
      data.removeImageUrls.map(url => imageService.deleteImage(url))
    );
  }
  if (data.imagesAction === 'replace') {
    const existingPhotos = await prisma.photo.findMany({ 
      where: { productId } 
    });
    await prisma.photo.deleteMany({ where: { productId } });
    await Promise.all(
      existingPhotos.map(photo => imageService.deleteImage(photo.url))
    );
  }
  const {
    imagesAction,
    removeImageUrls,
    variants,
    ...fields
  } = data;
  const updateData = {};
  if (fields.title !== undefined) updateData.title = fields.title;
  if (fields.description !== undefined) updateData.description = fields.description;
  if (fields.price !== undefined) updateData.price = fields.price;
  if (fields.oldPrice !== undefined) updateData.oldPrice = fields.oldPrice;
  if (fields.sku !== undefined) updateData.sku = fields.sku;
  if (fields.quantity !== undefined) updateData.quantity = fields.quantity;
  if (fields.isPublished !== undefined) updateData.isPublished = fields.isPublished;
  if (fields.categoryId !== undefined) {
    updateData.categoryId = fields.categoryId ? parseInt(fields.categoryId) : null;
  }
  if (processedImages.length > 0) {
    updateData.photos = {
      createMany: {
        data: processedImages.map((img) => ({
          url: img.original,
          publicId: img.thumbnail,
        })),
      },
    };
  }
  if (variants && Array.isArray(variants)) {
    await prisma.variant.deleteMany({
      where: { productId }
    });
    updateData.variants = {
      create: variants.map(variant => ({
        name: variant.name,
        value: variant.value,
        price: variant.price || null,
        quantity: variant.quantity || 0,
      }))
    };
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: updateData,
    include: { 
      photos: true,
      category: true,
      variants: true
    },
  });

  return updated;
};

export const deleteProduct = async (id) => {
  const productId = Number(id);
  if (!Number.isInteger(productId)) throw new Error('Invalid product id');

  const photos = await prisma.photo.findMany({
    where: { productId },
    select: { url: true },
  });
  if (photos.length > 0) {
    await Promise.all(
      photos.map(photo => imageService.deleteImage(photo.url))
    );
  }
  await prisma.product.delete({ 
    where: { id: productId } 
  });

  return { 
    message: 'Product deleted successfully',
    deletedImages: photos.length
  };
};