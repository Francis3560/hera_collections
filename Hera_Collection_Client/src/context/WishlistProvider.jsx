import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import WishlistService from '../api/wishlist.service';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

const wishlistReducer = (state, action) => {
  switch (action.type) {
    case 'SET_ITEMS':
      return { ...state, items: action.payload, loading: false };
    case 'ADD_ITEM':
      if (state.items.find(item => item.productId === action.payload.productId)) return state;
      return { ...state, items: [action.payload, ...state.items] };
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(item => item.id !== action.payload) };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

export const WishlistProvider = ({ children }) => {
  const [state, dispatch] = useReducer(wishlistReducer, {
    items: [],
    loading: false,
    error: null,
  });
  const { user } = useAuth();

  const fetchWishlist = useCallback(async () => {
    if (!user) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await WishlistService.getWishlist();
      dispatch({ type: 'SET_ITEMS', payload: response.data || [] });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = async (productId, variantId) => {
    if (!user) {
      // Handle guest wishlist if needed, but for now let's focus on logged in users
      return;
    }
    try {
      const response = await WishlistService.addToWishlist(productId, variantId);
      dispatch({ type: 'ADD_ITEM', payload: response.data });
      return response.data;
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
    }
  };

  const removeFromWishlist = async (id) => {
    try {
      await WishlistService.removeFromWishlist(id);
      dispatch({ type: 'REMOVE_ITEM', payload: id });
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  const isInWishlist = (productId) => {
    return state.items.some(item => item.productId === productId);
  };

  const wishlistCount = state.items.length;

  return (
    <WishlistContext.Provider value={{ 
      ...state, 
      addToWishlist, 
      removeFromWishlist, 
      isInWishlist, 
      wishlistCount,
      refreshWishlist: fetchWishlist 
    }}>
      {children}
    </WishlistContext.Provider>
  );
};
