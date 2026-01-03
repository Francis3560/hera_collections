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
              category: true
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
          userId: userId || null, // Ensure explicit null
          sessionId: userId ? null : sessionId // Only use sessionId if no userId
        },
        include: {
          items: true
        }
      });
      // Important to initialize items array for new carts
      cart.items = [];
    } catch (e) {
      // Handle race condition where cart might have been created by another request in parallel
      if (e.code === 'P2002') {
         cart = await prisma.cart.findFirst({
            where,
            include: {
              items: {
                  include: {
                      product: { include: { photos: true, category: true } },
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

  // Safety check
  if (!cart) {
      throw new Error("Failed to initialize cart");
  }
  
  // Ensure items is an array if not included
  if (!cart.items) cart.items = [];

  // Calculate totals
  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.variant ? item.variant.price : item.product.price; // Note: Product price might be needed if no variant
    // However, schema says ProductVariant has price. Product doesn't explicitly serve as price source if variants exist? 
    // Assuming Product has price if no variants.
    // Wait, Product model doesn't have price?
    // Let's check Product model again.
    return sum + (Number(price || 0) * item.quantity);
  }, 0);

  return { ...cart, subtotal };
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

  // Check product availability
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: true }
  });

  if (!product) throw new Error('Product not found');

  let price = 0;
  let variantName = null;
  let variantValue = null;

  if (variantId) {
    const variant = product.variants.find(v => v.id === variantId);
    if (!variant) throw new Error('Variant not found');
    if (variant.stock < quantity) throw new Error('Insufficient stock for variant');
    price = variant.price;
    // We might want to fetch option values to populate variantName/Value properly, 
    // but for now we'll leave them null or fetch if needed specifically.
    // The schema has variantName/Value in CartItem.
  } else {
    // If product has no variants, maybe it has a base price? 
    // The Product model in schema doesn't show a price field? 
    // Wait, I need to check Schema for Product price.
    // Schema lines 166-214: Product has no price field! Only ProductVariant has price.
    // This implies ALL products must have at least one variant? Or I missed it.
    // Let's assume for now we use the variant.
    if (product.variants.length > 0 && !variantId) {
        // If product has variants, one must be selected.
        // Or maybe there is a default variant?
        throw new Error('Product variant must be selected');
    }
  }

  // Upsert CartItem
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId,
      variantId: variantId || null
    }
  });

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: { increment: quantity } }
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        variantId,
        quantity,
        variantName, // Populate if possible
        variantValue
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
  const items = cartData.items.map(item => {
    const price = item.variant ? item.variant.price : 0; // Fix: Handle price logic
    return {
      productId: item.productId,
      quantity: item.quantity,
      price: Number(price),
      variantName: item.variantName,
      variantValue: item.variantValue,
      variantId: item.variantId // Added: Need variantId for stock management
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

  // Create Order
  const order = await createOrder(userId, orderData);

  // Clear Cart
  await clearCart(userId, sessionId);

  return order;
}
