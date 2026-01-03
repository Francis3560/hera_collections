import * as cartService from '../services/cartService.js';

export const getCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;

    if (!userId && !sessionId) {
      return res.status(400).json({ message: 'User ID or Session ID required' });
    }

    const cart = await cartService.getCart(userId, sessionId);
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] || req.body.sessionId;
    const itemData = req.body; // { productId, variantId, quantity }

    if (!userId && !sessionId) {
      return res.status(400).json({ message: 'User ID or Session ID required' });
    }

    const cart = await cartService.addToCart(userId, sessionId, itemData);
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] || req.body.sessionId;
    const { id } = req.params;
    const { quantity } = req.body;

    const cart = await cartService.updateCartItemQuantity(userId, sessionId, parseInt(id), quantity);
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;
    const { id } = req.params;

    const cart = await cartService.removeFromCart(userId, sessionId, parseInt(id));
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] || req.body.sessionId;

    await cartService.clearCart(userId, sessionId);
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const checkout = async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] || req.body.sessionId;
    const { payment, customer, shipping } = req.body;
    
    // For now, if no userId, we might require customer info to create a guest order?
    // orderService.createOrder usually requires a userId.
    // If guest checkout is supported, we might need a dummy user or handle guest orders.
    // Assuming for POS, there is always a logged-in user (the cashier).
    if (!userId) {
       // Check if guest checkout is allowed by orderService
       // For now, restrict to logged in users
       return res.status(401).json({ message: 'Authentication required for checkout' });
    }

    const order = await cartService.checkoutCart(userId, sessionId, payment, customer, shipping);
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
