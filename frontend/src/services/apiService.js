import api from './api';

// ---------- Auth ----------
export const adminRegister = (username, password) => {
  return api.post('/auth/admin/register', {username, password});
};

export const adminLogin = (username, password) => {
  return api.post('/auth/admin/login', {username, password});
};

export const riderLogin = (phone, password) => {
  return api.post('/auth/rider/login', {phone, password});
};

// ---------- Restaurants ----------
export const getRestaurants = () => {
  return api.get('/restaurants/');
};

export const getRestaurant = id => {
  return api.get(`/restaurants/${id}`);
};

export const getRestaurantImageUrl = id => `${api.defaults.baseURL}/restaurants/${id}/image`;

export const createRestaurant = data => {
  return api.post('/restaurants/', data);
};

export const updateRestaurant = (id, data) => {
  return api.put(`/restaurants/${id}`, data);
};

export const deleteRestaurant = id => {
  return api.delete(`/restaurants/${id}`);
};

// ---------- Menu Items ----------
export const getMenuItems = restaurantId => {
  return api.get(`/menu/restaurant/${restaurantId}`);
};

export const getMenuItem = id => {
  return api.get(`/menu/${id}`);
};

export const getMenuItemImageUrl = id => `${api.defaults.baseURL}/menu/${id}/image`;

export const createMenuItem = formData => {
  return api.post('/menu/', formData, {
    headers: {'Content-Type': 'multipart/form-data'},
  });
};

export const updateMenuItem = (id, formData) => {
  return api.put(`/menu/${id}`, formData, {
    headers: {'Content-Type': 'multipart/form-data'},
  });
};

export const deleteMenuItem = id => {
  return api.delete(`/menu/${id}`);
};

// ---------- Orders ----------
export const placeOrder = data => {
  return api.post('/orders/', data);
};

export const getOrder = id => {
  return api.get(`/orders/${id}`);
};

export const getOrders = restaurantId => {
  const params = restaurantId ? {restaurant_id: restaurantId} : {};
  return api.get('/orders/', {params});
};

export const getRiderOrders = riderId => {
  return api.get(`/orders/rider/${riderId}`);
};

export const updateOrderStatus = (id, data) => {
  return api.put(`/orders/${id}/status`, data);
};

export const assignRiderToOrder = (orderId, riderId) => {
  return api.put(`/orders/${orderId}/assign-rider`, {rider_id: riderId});
};

export const deleteOrder = id => {
  return api.delete(`/orders/${id}`);
};

// For admin use (same as public endpoint)
export const createOrder = data => {
  return api.post('/orders/', data);
};

// ---------- Riders ----------
export const getRiders = () => {
  return api.get('/riders/');
};

export const getRider = id => {
  return api.get(`/riders/${id}`);
};

export const createRider = data => {
  return api.post('/riders/', data);
};

export const updateRider = (id, data) => {
  return api.put(`/riders/${id}`, data);
};

export const deleteRider = id => {
  return api.delete(`/riders/${id}`);
};

// ---------- Payments ----------
export const getPayments = () => {
  return api.get('/payments/');
};

export const getRestaurantPayments = restaurantId => {
  return api.get(`/payments/restaurant/${restaurantId}`);
};

export const createPayment = data => {
  return api.post('/payments/', data);
};

export const updatePayment = (id, data) => {
  return api.put(`/payments/${id}`, data);
};

export const deletePayment = (id) => {
  return api.delete(`/payments/${id}`);
};

export const uploadPaymentReceipt = (orderId, base64Image) => {
  return api.post('/payments/upload-receipt-from-order', {
    order_id: orderId,
    receipt_image: base64Image,
  });
};

export const getInvoiceUrl = async restaurantId => {
  let token = null;
  if (typeof window !== 'undefined' && window.sessionStorage) {
    token = sessionStorage.getItem('session_access_token');
  } else {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    token = await AsyncStorage.getItem('session_access_token');
  }
  return `${api.defaults.baseURL}/payments/restaurant/${restaurantId}/invoice?token=${token}`;
};

// ---------- Dashboard ----------
export const getDashboardStats = () => {
  return api.get('/dashboard/stats');
};
