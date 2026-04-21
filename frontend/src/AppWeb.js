import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { withWebNavigation } from './utils/webNavigation';

// Customer screens
import SplashScreen from './pages/customer/SplashScreen';
import RestaurantListScreen from './pages/customer/RestaurantListScreen';
import MenuScreen from './pages/customer/MenuScreen';
import CartScreen from './pages/customer/CartScreen';
import OrderStatusScreen from './pages/customer/OrderStatusScreen';

// Auth
import LoginScreen from './pages/auth/LoginScreen';

// Admin screens
import AdminDashboardScreen from './pages/admin/AdminDashboardScreen';
import AdminRestaurantsScreen from './pages/admin/AdminRestaurantsScreen';
import AdminOrdersScreen from './pages/admin/AdminOrdersScreen';
import AdminRidersScreen from './pages/admin/AdminRidersScreen';
import AdminPaymentsScreen from './pages/admin/AdminPaymentsScreen';
import AdminRestaurantDetailScreen from './pages/admin/AdminRestaurantDetailScreen';
import AdminCommissionsScreen from './pages/admin/AdminCommissionsScreen';
import AdminRestaurantPaymentsScreen from './pages/admin/AdminRestaurantPaymentsScreen';
import AdminRestaurantCommissionsScreen from './pages/admin/AdminRestaurantCommissionsScreen';

// Rider screens
import RiderDashboardScreen from './pages/rider/RiderDashboardScreen';
import RiderOrderDetailScreen from './pages/rider/RiderOrderDetailScreen';
import { useParams } from 'react-router-dom';

// QR Code redirect component
const QRRedirect = () => {
  const { restaurantId } = useParams();
  return <Navigate to={`/menu/${restaurantId}`} replace />;
};

// Wrap all screens with the web navigation adapter
const Splash = withWebNavigation(SplashScreen);
const RestaurantList = withWebNavigation(RestaurantListScreen);
const Menu = withWebNavigation(MenuScreen);
const Cart = withWebNavigation(CartScreen);
const OrderStatus = withWebNavigation(OrderStatusScreen);
const Login = withWebNavigation(LoginScreen);
const AdminDashboard = withWebNavigation(AdminDashboardScreen);
const AdminRestaurants = withWebNavigation(AdminRestaurantsScreen);
const AdminOrders = withWebNavigation(AdminOrdersScreen);
const AdminRiders = withWebNavigation(AdminRidersScreen);
const AdminPayments = withWebNavigation(AdminPaymentsScreen);
const AdminRestaurantDetail = withWebNavigation(AdminRestaurantDetailScreen);
const AdminCommissions = withWebNavigation(AdminCommissionsScreen);
const AdminRestaurantPayments = withWebNavigation(AdminRestaurantPaymentsScreen);
const AdminRestaurantCommissions = withWebNavigation(AdminRestaurantCommissionsScreen);
const RiderDashboard = withWebNavigation(RiderDashboardScreen);
const RiderOrderDetail = withWebNavigation(RiderOrderDetailScreen);

const AppWeb = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Customer */}
            <Route path="/" element={<Splash />} />
            <Route path="/restaurants" element={<RestaurantList />} />
            <Route path="/menu/:restaurantId" element={<Menu />} />
            {/* QR code redirect: /restaurant/:id/menu → /menu/:id */}
            <Route path="/restaurant/:restaurantId/menu" element={<QRRedirect />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/order-status/:orderId" element={<OrderStatus />} />

            {/* Auth */}
            <Route path="/login" element={<Login />} />

            {/* Admin */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/restaurants" element={<AdminRestaurants />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/riders" element={<AdminRiders />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/commissions" element={<AdminCommissions />} />
            <Route path="/admin/payments/restaurant/:restaurantId" element={<AdminRestaurantPayments />} />
            <Route path="/admin/commissions/restaurant/:restaurantId" element={<AdminRestaurantCommissions />} />
            <Route path="/admin/restaurant/:restaurantId" element={<AdminRestaurantDetail />} />

            {/* Rider */}
            <Route path="/rider" element={<RiderDashboard />} />
            <Route path="/rider/order/:orderId" element={<RiderOrderDetail />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
};

export default AppWeb;
