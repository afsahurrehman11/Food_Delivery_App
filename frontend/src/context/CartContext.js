import React, {createContext, useState, useContext, useEffect, useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_KEY = '@foodapp_cart';
const RESTAURANT_KEY = '@foodapp_cart_restaurant';
const ORDER_KEY = '@foodapp_active_order';

const CartContext = createContext(null);

export const CartProvider = ({children}) => {
  const [cartItems, setCartItems] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [cartLoaded, setCartLoaded] = useState(false);

  // ── Load persisted data on mount ──────────────────────────────────
  useEffect(() => {
    const loadPersisted = async () => {
      try {
        const [cartJson, rid, oid] = await Promise.all([
          AsyncStorage.getItem(CART_KEY),
          AsyncStorage.getItem(RESTAURANT_KEY),
          AsyncStorage.getItem(ORDER_KEY),
        ]);
        if (cartJson) setCartItems(JSON.parse(cartJson));
        if (rid) setRestaurantId(rid);
        if (oid) setActiveOrderId(oid);
      } catch (_) {
      } finally {
        setCartLoaded(true);
      }
    };
    loadPersisted();
  }, []);

  // ── Persist cart whenever it changes (after initial load) ─────────
  useEffect(() => {
    if (!cartLoaded) return;
    AsyncStorage.setItem(CART_KEY, JSON.stringify(cartItems)).catch(() => {});
  }, [cartItems, cartLoaded]);

  useEffect(() => {
    if (!cartLoaded) return;
    if (restaurantId) {
      AsyncStorage.setItem(RESTAURANT_KEY, restaurantId).catch(() => {});
    } else {
      AsyncStorage.removeItem(RESTAURANT_KEY).catch(() => {});
    }
  }, [restaurantId, cartLoaded]);

  // ── Cart actions ──────────────────────────────────────────────────
  const addToCart = useCallback((item, restaurant_id) => {
    if (restaurantId && restaurantId !== restaurant_id) {
      // Different restaurant — replace cart
      setCartItems([{...item, quantity: 1}]);
      setRestaurantId(restaurant_id);
      return;
    }
    setRestaurantId(restaurant_id);
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i =>
          i.id === item.id ? {...i, quantity: i.quantity + 1} : i,
        );
      }
      return [...prev, {...item, quantity: 1}];
    });
  }, [restaurantId]);

  const removeFromCart = useCallback(itemId => {
    setCartItems(prev => prev.filter(i => i.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId, quantity) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(i => i.id !== itemId));
      return;
    }
    setCartItems(prev =>
      prev.map(i => (i.id === itemId ? {...i, quantity} : i)),
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setRestaurantId(null);
    AsyncStorage.multiRemove([CART_KEY, RESTAURANT_KEY]).catch(() => {});
  }, []);

  const getTotal = useCallback(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const getItemCount = useCallback(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  // ── Active order tracking ─────────────────────────────────────────
  const saveActiveOrder = useCallback(async (orderId) => {
    setActiveOrderId(orderId);
    try {
      await AsyncStorage.setItem(ORDER_KEY, orderId);
    } catch (_) {}
  }, []);

  const clearActiveOrder = useCallback(async () => {
    setActiveOrderId(null);
    try {
      await AsyncStorage.removeItem(ORDER_KEY);
    } catch (_) {}
  }, []);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        restaurantId,
        cartLoaded,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
        activeOrderId,
        saveActiveOrder,
        clearActiveOrder,
      }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
