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
  sortBy = 'createdAt',
  sortOrder = 'desc',
  hasDiscount = undefined,
}) => {
  const where = {
    isPublished,
    categoryId: categoryId ? parseInt(categoryId) : undefined,
    // Note: Filtering by price now requires looking at variants
    variants: (minPrice || maxPrice || hasDiscount) ? {
      some: {
        price: {
          gte: minPrice || undefined,
          lte: maxPrice || undefined,
        },
        isActive: true,
        // Filter for discounts: for now just check if costPrice exists
        // In the future, add a dedicated 'onSale' or 'discountPercentage' field
        ...(hasDiscount ? {
          costPrice: { not: null }
        } : {})
      }
    } : undefined,
    OR: q
      ? [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ]
      : undefined,
  };


  // Build orderBy clause based on sortBy parameter
  let orderBy;
  switch (sortBy) {
    case 'price':
      // For price sorting, we'll need to use a different approach since price is in variants
      // For now, we'll sort by createdAt and handle price sorting client-side
      orderBy = { createdAt: sortOrder };
      break;
    case 'title':
      orderBy = { title: sortOrder };
      break;
    case 'purchases':
      // Assuming we'll add a purchases count field later
      // For now, fall back to createdAt
      orderBy = { createdAt: sortOrder };
      break;
    case 'createdAt':
    default:
      orderBy = { createdAt: sortOrder };
      break;
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        photos: includePhotos,
        category: true,
        seller: {
          select: { id: true, name: true, email: true }
        },
        options: {
          include: { values: true }
        },
        discounts: {
            where: { isActive: true },
            select: {
              id: true,
              discountPercentage: true,
              startDate: true,
              endDate: true,
              name: true
            }
        },
        variants: {
          where: { isActive: true },
          include: {
            optionValues: {
              include: { optionValue: { include: { option: true } } }
            }
          }
        }
      },
      orderBy,
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
      options: {
        include: { values: true }
      },
      variants: {
        where: { isActive: true },
        include: {
          optionValues: {
            include: { optionValue: { include: { option: true } } }
          }
        }
      }
    },
  });
};

export const getProductBySlug = async (slug) => {
  return prisma.product.findUnique({
    where: { slug, isPublished: true },
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
      options: {
        include: { values: true }
      },
      discounts: {
        where: { isActive: true },
        select: {
           id: true,
           discountPercentage: true,
           name: true,
           isActive: true
        }
      },
      variants: {
        where: { isActive: true },
        include: {
          optionValues: {
            include: { optionValue: { include: { option: true } } }
          }
        }
      }
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
      options: {
        include: { values: true }
      },
      variants: {
        include: {
          optionValues: {
            include: { optionValue: { include: { option: true } } }
          }
        }
      }
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
  return await prisma.$transaction(async (tx) => {
    // 1. Create Product
    const product = await tx.product.create({
      data: {
        title: data.title,
        slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now(),
        description: data.description || null,
        isPublished: data.isPublished ?? true,
        categoryId: data.categoryId ? parseInt(data.categoryId) : null,
        sellerId: parseInt(sellerUserId),
        brand: data.brand || null,
        manufacturer: data.manufacturer || null,
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
      },
    });

    // 2. Create Options and Values
    const createdOptions = {};
    for (const opt of data.options) {
      const option = await tx.productOption.create({
        data: {
          productId: product.id,
          name: opt.name,
          values: {
            create: opt.values.map(val => ({ value: val }))
          }
        },
        include: { values: true }
      });
      
      createdOptions[opt.name] = {};
      option.values.forEach(v => {
        createdOptions[opt.name][v.value] = v.id;
      });
    }

    // 3. Create Variants and initial Stock Movements
    for (const varData of data.variants) {
      const variant = await tx.productVariant.create({
        data: {
          productId: product.id,
          sku: varData.sku,
          price: varData.price,
          costPrice: varData.costPrice || null,
          stock: varData.stock || 0,
          image: varData.image || null,
          optionValues: {
            create: Object.entries(varData.optionMappings).map(([optName, valName]) => ({
              optionValueId: createdOptions[optName][valName]
            }))
          }
        }
      });

      // 4. Initial Stock Movement
      if (varData.stock > 0) {
        await tx.stockMovement.create({
          data: {
            variantId: variant.id,
            movementType: 'ADDITION',
            quantity: varData.stock,
            unitCost: varData.costPrice || null,
            previousStock: 0,
            newStock: varData.stock,
            reason: 'Initial stock on creation',
            createdById: parseInt(sellerUserId)
          }
        });
      }
    }

    return tx.product.findUnique({
      where: { id: product.id },
      include: {
        photos: true,
        category: true,
        options: { include: { values: true } },
        variants: { include: { optionValues: { include: { optionValue: { include: { option: true } } } } } }
      }
    });
  });
};

export const updateProduct = async (id, data, processedImages = []) => {
  const productId = Number(id);
  if (!Number.isInteger(productId)) throw new Error('Invalid product id');

  return await prisma.$transaction(async (tx) => {
    // 1. Handle image management
    if (Array.isArray(data.removeImageUrls) && data.removeImageUrls.length) {
      await tx.photo.deleteMany({
        where: { productId, url: { in: data.removeImageUrls } },
      });
      await Promise.all(data.removeImageUrls.map(url => imageService.deleteImage(url)));
    }

    if (processedImages.length > 0) {
      await tx.photo.createMany({
        data: processedImages.map((img) => ({
          productId,
          url: img.original,
          publicId: img.thumbnail,
        })),
      });
    }

    // 2. Update Basic Product Fields
    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId ? parseInt(data.categoryId) : undefined,
        brand: data.brand,
        manufacturer: data.manufacturer,
        isPublished: data.isPublished,
      }
    });

    // 3. Update Options and Values (if provided)
    if (data.options) {
      // For simplicity in this logic, we'll sync options by name
      for (const opt of data.options) {
        let option = await tx.productOption.findFirst({
          where: { productId, name: opt.name }
        });

        if (!option) {
          option = await tx.productOption.create({
            data: {
              productId,
              name: opt.name,
              values: {
                create: opt.values.map(val => ({ value: val }))
              }
            },
            include: { values: true }
          });
        } else {
          // Sync option values
          for (const valName of opt.values) {
            await tx.optionValue.upsert({
              where: { 
                productOptionId_value: { productOptionId: option.id, value: valName }
              },
              update: {},
              create: { productOptionId: option.id, value: valName }
            });
          }
        }
      }
    }

    // 4. Update Variants
    if (data.variants) {
      const incomingVariantIds = data.variants.map(v => v.id).filter(Boolean);
      
      // Deactivate variants not in the incoming list
      await tx.productVariant.updateMany({
        where: { 
          productId, 
          id: { notIn: incomingVariantIds.map(id => parseInt(id)) } 
        },
        data: { isActive: false }
      });

      // Upsert incoming variants
      for (const varData of data.variants) {
        if (varData.id) {
          // Update existing
          await tx.productVariant.update({
            where: { id: parseInt(varData.id) },
            data: {
              sku: varData.sku,
              price: varData.price,
              costPrice: varData.costPrice || null,
              stock: varData.stock || 0,
              isActive: varData.isActive !== undefined ? varData.isActive : true,
              image: varData.image || null,
            }
          });
          // Note: Option mappings for existing variants are generally immutable 
          // to prevent data corruption. If they need to change, a new variant should be created.
        } else {
          // Create new variant
          // Fetch current options/values to map IDs
          const currentOptions = await tx.productOption.findMany({
            where: { productId },
            include: { values: true }
          });

          const optionValueMap = {};
          currentOptions.forEach(opt => {
            optionValueMap[opt.name] = {};
            opt.values.forEach(v => {
              optionValueMap[opt.name][v.value] = v.id;
            });
          });

          await tx.productVariant.create({
            data: {
              productId,
              sku: varData.sku,
              price: varData.price,
              costPrice: varData.costPrice || null,
              stock: varData.stock || 0,
              image: varData.image || null,
              optionValues: {
                create: Object.entries(varData.optionMappings).map(([optName, valName]) => ({
                  optionValueId: optionValueMap[optName][valName]
                }))
              }
            }
          });
        }
      }
    }

    return tx.product.findUnique({
      where: { id: productId },
      include: {
        photos: true,
        category: true,
        options: { include: { values: true } },
        variants: { 
          where: { isActive: true },
          include: { optionValues: { include: { optionValue: { include: { option: true } } } } } 
        }
      }
    });
  });
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