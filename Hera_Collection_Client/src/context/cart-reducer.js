export const initialCartState = { count: 0 };

export function cartReducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const qty = Math.max(1, Number(action.qty) || 1);
      return { ...state, count: state.count + qty };
    }
    case "SET":
      return { ...state, count: Math.max(0, Number(action.count) || 0) };
    case "CLEAR":
      return { ...state, count: 0 };
    default:
      return state;
  }
}

export function restoreCartCount() {
  return Number(localStorage.getItem("cartCount") || 0);
}

export function persistCartCount(count) {
  localStorage.setItem("cartCount", String(count));
}
