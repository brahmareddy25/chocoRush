import { createContext, useContext, useMemo, useReducer } from 'react';

const CartContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find((item) => item.id === action.product.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.id === action.product.id ? { ...item, quantity: item.quantity + 1 } : item
          ),
          isOpen: true
        };
      }

      return {
        ...state,
        items: [...state.items, { ...action.product, quantity: 1 }],
        isOpen: true
      };
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter((item) => item.id !== action.id) };
    case 'UPDATE':
      return {
        ...state,
        items: state.items
          .map((item) =>
            item.id === action.id ? { ...item, quantity: Math.max(1, action.quantity) } : item
          )
          .filter((item) => item.quantity > 0)
      };
    case 'TOGGLE':
      return { ...state, isOpen: action.value ?? !state.isOpen };
    case 'CLEAR':
      return { ...state, items: [], isOpen: false };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false });

  const summary = useMemo(() => {
    const count = state.items.reduce((sum, item) => sum + item.quantity, 0);
    const total = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return { count, total };
  }, [state.items]);

  const value = useMemo(
    () => ({
      items: state.items,
      isOpen: state.isOpen,
      count: summary.count,
      total: summary.total,
      addItem: (product) => dispatch({ type: 'ADD', product }),
      removeItem: (id) => dispatch({ type: 'REMOVE', id }),
      updateQuantity: (id, quantity) => dispatch({ type: 'UPDATE', id, quantity }),
      toggleCart: (value) => dispatch({ type: 'TOGGLE', value }),
      clearCart: () => dispatch({ type: 'CLEAR' })
    }),
    [state, summary]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
