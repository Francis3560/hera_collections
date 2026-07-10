import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import CartService from '../api/cart.service';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

// Pure function — no component state involved, so it lives outside the
// component instead of being recreated (and needing a dependency) every render.
const calculateItemPrice = (item) => {
    const product = item.product || {};
    const variant = item.variant || {};

    const originalPrice = parseFloat(variant.price || 0);
    let finalPrice = originalPrice;
    let appliedDiscount = null;

    // Check for active discounts on product (Guest logic mirroring backend)
    const activeDiscount = product.discounts?.find(d => d.isActive !== false);

    if (activeDiscount) {
       const percentage = parseFloat(activeDiscount.discountPercentage);
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
        price: finalPrice,
        originalPrice,
        appliedDiscount
    };
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART':
      return { 
        ...state, 
        items: action.payload.items || [], 
        total: action.payload.subtotal || action.payload.totalAmount || 0,
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
  const userId = user?.id;

  // Load guest cart from local storage on mount if no user
  useEffect(() => {
    if (!user) {
      const storedCart = localStorage.getItem('guest_cart');
      if (storedCart) {
        try {
          const parsedCart = JSON.parse(storedCart);
          dispatch({ type: 'SET_CART', payload: parsedCart });
        } catch (e) {
          console.error("Failed to parse guest cart", e);
        }
      }
    }
  }, [user]);

  const saveGuestCart = useCallback((items) => {
    // Process items to ensure prices are up to date with discounts
    const processedItems = items.map(calculateItemPrice);

    const total = processedItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    const cartData = { items: processedItems, totalAmount: total };
    localStorage.setItem('guest_cart', JSON.stringify(cartData));
    dispatch({ type: 'SET_CART', payload: cartData });
    return cartData;
  }, []);

  const fetchCart = useCallback(async () => {
    if (!userId) {
        // If user logs out, we might want to reload guest cart or clear it. 
        // For now, we rely on the initial useEffect for loading guest cart.
        // Or we can re-read it here.
        const storedCart = localStorage.getItem('guest_cart');
        if (storedCart) {
            try {
                dispatch({ type: 'SET_CART', payload: JSON.parse(storedCart) });
            } catch(e) {}
        }
        return;
    }
    
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await CartService.getCart();
      dispatch({ type: 'SET_CART', payload: data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [userId]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (productId, variantId, quantity = 1, productData = null, variantData = null) => {
    // Check local stock if item exists in cart
    const existingItem = state.items.find(
      item => item.productId === productId && item.variantId === variantId
    );

    if (existingItem) {
      const currentStock = existingItem.variant?.stock || 0;
      // Note: For guest cart, stock validation relies on the passed variantData or existing item data
      if (existingItem.quantity + quantity > currentStock) {
        toast.error(`Cannot add more items. Only ${currentStock} left in stock.`);
        throw new Error("Insufficient stock");
      }
    }

    if (!user) {
        // Guest Mode
        let newItems = [...state.items];
        if (existingItem) {
            newItems = newItems.map(item => 
                (item.productId === productId && item.variantId === variantId)
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
        } else {
            if (!productData || !variantData) {
                // If caller didn't pass data, we can't display it properly in guest mode. 
                // In a real app we might fetch it here, but let's assume caller provides it.
                console.warn("Product/Variant data missing for guest cart");
            }
            newItems.push({
                id: `guest-${Date.now()}`, // Temporary ID
                productId,
                variantId,
                quantity,
                product: productData || {},
                variant: variantData || {}
            });
        }
        saveGuestCart(newItems);
        toast.success("Added to cart");
        return;
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
  }, [state.items, user, saveGuestCart]);

  const updateQuantity = useCallback(async (itemId, quantity) => {
    const item = state.items.find(i => i.id === itemId);
    if (!item) return;

    const stock = item.variant?.stock || 0;
    if (quantity > stock) {
        toast.error(`Cannot update quantity. Only ${stock} left in stock.`);
        return;
    }

    if (!user) {
        // Guest Mode
        const newItems = state.items.map(i => 
            i.id === itemId ? { ...i, quantity } : i
        );
        saveGuestCart(newItems);
        return;
    }

    try {
      const data = await CartService.updateItem(itemId, quantity);
      dispatch({ type: 'SET_CART', payload: data });
    } catch (error) {
      console.error('Failed to update cart:', error);
      toast.error(error.response?.data?.message || "Failed to update quantity");
      throw error;
    }
  }, [state.items, user, saveGuestCart]);

  const removeItem = useCallback(async (itemId) => {
    if (!user) {
        // Guest Mode
        const newItems = state.items.filter(i => i.id !== itemId);
        saveGuestCart(newItems);
        return;
    }

    try {
      const data = await CartService.removeItem(itemId);
      dispatch({ type: 'SET_CART', payload: data });
    } catch (error) {
      console.error('Failed to remove item:', error);
      toast.error("Failed to remove item");
    }
  }, [state.items, user, saveGuestCart]);

  const clearCart = useCallback(async () => {
    if (!user) {
        localStorage.removeItem('guest_cart');
        dispatch({ type: 'CLEAR_CART' });
        return;
    }

    try {
      await CartService.clearCart();
      dispatch({ type: 'CLEAR_CART' });
    } catch (error) {
      console.error('Failed to clear cart:', error);
      toast.error("Failed to clear cart");
    }
  }, [user]);

  const cartCount = useMemo(() => {
    return state.items.reduce((acc, item) => acc + item.quantity, 0);
  }, [state.items]);

  const value = useMemo(() => ({
    ...state,
    cartCount,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart: fetchCart
  }), [state, cartCount, addToCart, updateQuantity, removeItem, clearCart, fetchCart]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
