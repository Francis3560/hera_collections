import { useEffect, useMemo, useReducer } from "react";
import { CartContext } from "./cart-context";
import {
  cartReducer,
  initialCartState,
  restoreCartCount,
  persistCartCount,
} from "./cart-reducer";

export default function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);

  // restore from localStorage
  useEffect(() => {
    const saved = restoreCartCount();
    if (saved) dispatch({ type: "SET", count: saved });
  }, []);

  useEffect(() => {
    persistCartCount(state.count);
  }, [state.count]);

  const value = useMemo(
    () => ({
      cartCount: state.count,
      addToCart: (qty = 1) => dispatch({ type: "ADD", qty }),
      setCartCount: (count = 0) => dispatch({ type: "SET", count }),
      clearCart: () => {
        dispatch({ type: "CLEAR" });
        localStorage.removeItem("cartCount"); 
      },
    }),
    [state.count]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
