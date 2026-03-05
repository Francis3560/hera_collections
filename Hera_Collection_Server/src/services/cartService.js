import prisma from '../database.js';
import { Prisma } from '@prisma/client';
import { createOrder } from './orderService.js';

/**
 * Get the active cart for a user or session
 */
export async function getCart(userId, sessionId) {
  const where = userId ? { userId } : { sessionId };
  
  let cart = await prisma.cart.findFirst({
    where,
    include: {
      items: {
        include: {
          product: {
            include: {
              photos: true,
              category: true,
              discounts: {
                where: { isActive: true },
                select: {
                  id: true,
                  name: true,
                  discountPercentage: true,
                  startDate: true,
                  endDate: true
                }
              }
            }
          },
          variant: true
        }
      }
    }
  });

  if (!cart) {
    try {
      cart = await prisma.cart.create({
        data: {
          userId: userId || null,
          sessionId: userId ? null : sessionId
        },
        include: {
          items: true
        }
      });
      cart.items = [];
    } catch (e) {
      if (e.code === 'P2002') {
         cart = await prisma.cart.findFirst({
            where,
            include: {
              items: {
                  include: {
                      product: { 
                        include: { 
                          photos: true, 
                          category: true,
                          discounts: { where: { isActive: true } }
                        } 
                      },
                      variant: true
                  }
              }
            }
         });
      } else {
        throw e;
      }
    }
  }

  if (!cart) throw new Error("Failed to initialize cart");
  if (!cart.items) cart.items = [];

  const itemsWithDiscounts = cart.items.map(item => {
    const product = item.product;
    const variant = item.variant;
    
    const originalPrice = Number(variant?.price || 0);
    let finalPrice = originalPrice;
    let appliedDiscount = null;

    // Check for active discounts on product
    const activeDiscount = product.discounts?.[0]; // Prisma query already filters for isActive: true

    if (activeDiscount) {
       const percentage = Number(activeDiscount.discountPercentage);
       const discountAmount = (originalPrice * percentage) / 100;
       finalPrice = originalPrice - discountAmount;
       appliedDiscount = {
          id: activeDiscount.id,
          name: activeDiscount.name,
          percentage: percentage,
          amountSaved: discountAmount
       };
    }

    return {
      ...item,
      originalPrice,
      price: item.price !== null ? Number(item.price) : finalPrice,
      discountedPrice: item.price !== null ? Number(item.price) : finalPrice,
      appliedDiscount,
      title: item.customTitle || product?.title
    };
  });

  const subtotal = itemsWithDiscounts.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  return { ...cart, items: itemsWithDiscounts, subtotal };
}

/**
 * Add an item to the cart
 */
export async function addToCart(userId, sessionId, itemData) {
  const { productId, variantId, quantity } = itemData;
  const where = userId ? { userId } : { sessionId };

  // Ensure unique constraint isn't violated by checking both optional fields appropriately
  const query = userId ? { userId } : { sessionId };
  let cart = await prisma.cart.findFirst({ where: query });

  if (!cart) {
    try {
        cart = await prisma.cart.create({
            data: {
              userId: userId || null,
              sessionId: userId ? null : sessionId
            }
        });
    } catch (e) {
        // Race condition or duplicate key error, try fetching again
        if (e.code === 'P2002') {
             cart = await prisma.cart.findFirst({ where: query });
        } else {
            throw e;
        }
    }
  }

  if (productId) {
    // Check product availability
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true }
    });

    if (!product) throw new Error('Product not found');

    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        include: {
          optionValues: {
            include: { optionValue: { include: { option: true } } }
          }
        }
      });

      if (!variant) throw new Error('Variant not found');
      if (variant.stock < quantity) throw new Error('Insufficient stock for variant');
      
      price = variant.price;
      
      // Construct variant strings (e.g., "Color", "Red")
      if (variant.optionValues && variant.optionValues.length > 0) {
        variantName = variant.optionValues.map(ov => ov.optionValue.option.name).join(' / ');
        variantValue = variant.optionValues.map(ov => ov.optionValue.value).join(' / ');
      } else {
        variantName = 'Default';
        variantValue = variant.sku || 'Default';
      }
    } else {
      // If product has variants, one must be selected.
      const productWithVariants = await prisma.product.findUnique({
        where: { id: productId },
        include: { variants: { where: { isActive: true } } }
      });
      
      if (productWithVariants?.variants.length > 0) {
        throw new Error('Product variant must be selected');
      }
    }
  } else if (!itemData.customTitle || !itemData.price) {
    throw new Error('Custom items require a title and price');
  }

  // Upsert CartItem
  const existingItem = productId ? await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId,
      variantId: variantId || null
    }
  }) : null;

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: { increment: quantity } }
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: productId || null,
        variantId: variantId || null,
        quantity,
        variantName,
        variantValue,
        customTitle: itemData.customTitle || null,
        price: itemData.price ? Number(itemData.price) : null
      }
    });
  }

  return getCart(userId, sessionId);
}

/**
 * Remove item from cart
 */
export async function removeFromCart(userId, sessionId, itemId) {
  const cart = await getCart(userId, sessionId);
  
  // Verify item belongs to cart
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id }
  });

  if (!item) throw new Error('Item not found in cart');

  await prisma.cartItem.delete({ where: { id: itemId } });
  
  return getCart(userId, sessionId);
}

/**
 * Update item quantity
 */
export async function updateCartItemQuantity(userId, sessionId, itemId, quantity) {
  if (quantity <= 0) return removeFromCart(userId, sessionId, itemId);

  const cart = await getCart(userId, sessionId);
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id }
  });

  if (!item) throw new Error('Item not found in cart');

  // Check stock
  if (item.variantId) {
    const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
    if (variant.stock < quantity) throw new Error('Insufficient stock');
  }

  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity }
  });

  return getCart(userId, sessionId);
}

/**
 * Clear cart
 */
export async function clearCart(userId, sessionId) {
  const where = userId ? { userId } : { sessionId };
  const cart = await prisma.cart.findFirst({ where });
  
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
  return { message: 'Cart cleared' };
}

/**
 * Convert Cart to Order (Checkout)
 */
export async function checkoutCart(userId, sessionId, paymentData, customerData, shippingData) {
  const cartData = await getCart(userId, sessionId);
  if (!cartData || cartData.items.length === 0) {
    throw new Error('Cart is empty');
  }

  // Prepare items for createOrder
  // createOrder expects: items: [{ productId, quantity, price, variantName, variantValue }]
  // Create order items
  const items = cartData.items.map(item => {
    // item.price comes from getCart and includes discounts if applicable
    const price = item.price !== undefined ? item.price : (item.variant ? item.variant.price : 0);
    
    return {
      productId: item.productId,
      quantity: item.quantity,
      price: Number(price),
      variantName: item.variantName,
      variantValue: item.variantValue,
      variantId: item.variantId 
    };
  });

  // Calculate amounts
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal; // Add tax/shipping logic if needed

  const orderData = {
    items,
    customer: customerData || {},
    payment: paymentData,
    amounts: {
      subtotal,
      total
    },
    shipping: shippingData
  };

  // Determine the buyer. For POS, the cashier triggers this but the buyer is the customer.
  const buyerId = customerData?.userId || userId;

  // Create Order
  const order = await createOrder(buyerId, orderData);

  // Clear the cart used for this checkout (the auth'd user/session cart)
  await clearCart(userId, sessionId);

  return order;
}
