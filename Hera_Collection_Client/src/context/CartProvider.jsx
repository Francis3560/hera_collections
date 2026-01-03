import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import CartService from '../api/cart.service';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART':
      return { 
        ...state, 
        items: action.payload.items || [], 
        total: action.payload.totalAmount || 0,
        loading: false 
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_CART':
      return { ...state, items: [], total: 0 };
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    loading: false,
    error: null,
  });
  const { user } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!user) return;
    // If not logged in, we could use session ID or local storage
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await CartService.getCart();
      dispatch({ type: 'SET_CART', payload: data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart, user]);

  const addToCart = async (productId, variantId, quantity = 1) => {
    // Check local stock if item exists in cart
    const existingItem = state.items.find(
      item => item.productId === productId && item.variantId === variantId
    );

    if (existingItem) {
      const currentStock = existingItem.variant?.stock || 0;
      if (existingItem.quantity + quantity > currentStock) {
        toast.error(`Cannot add more items. Only ${currentStock} left in stock.`);
        throw new Error("Insufficient stock");
      }
    }

    try {
      const data = await CartService.addToCart(productId, variantId, quantity);
      dispatch({ type: 'SET_CART', payload: data });
      return data;
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error(error.response?.data?.message || "Failed to add to cart");
      throw error;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    const item = state.items.find(i => i.id === itemId);
    if (item) {
        const stock = item.variant?.stock || 0;
        if (quantity > stock) {
            toast.error(`Cannot update quantity. Only ${stock} left in stock.`);
            return;
        }
    }

    try {
      const data = await CartService.updateItem(itemId, quantity);
      dispatch({ type: 'SET_CART', payload: data });
    } catch (error) {
      console.error('Failed to update cart:', error);
      toast.error(error.response?.data?.message || "Failed to update quantity");
      throw error;
    }
  };

  const removeItem = async (itemId) => {
    try {
      const data = await CartService.removeItem(itemId);
      dispatch({ type: 'SET_CART', payload: data });
    } catch (error) {
      console.error('Failed to remove item:', error);
      toast.error("Failed to remove item");
    }
  };

  const clearCart = async () => {
    try {
      await CartService.clearCart();
      dispatch({ type: 'CLEAR_CART' });
    } catch (error) {
      console.error('Failed to clear cart:', error);
      toast.error("Failed to clear cart");
    }
  };

  const cartCount = useMemo(() => {
    return state.items.reduce((acc, item) => acc + item.quantity, 0);
  }, [state.items]);

  return (
    <CartContext.Provider value={{ 
      ...state, 
      cartCount,
      addToCart, 
      updateQuantity, 
      removeItem, 
      clearCart,
      refreshCart: fetchCart 
    }}>
      {children}
    </CartContext.Provider>
  );
};
