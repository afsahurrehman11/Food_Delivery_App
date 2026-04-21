import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AuthProvider} from './context/AuthContext';
import {CartProvider} from './context/CartContext';

// Customer screens
import SplashScreen from './pages/customer/SplashScreen';
import RestaurantListScreen from './pages/customer/RestaurantListScreen';
import MenuScreen from './pages/customer/MenuScreen';
import CartScreen from './pages/customer/CartScreen';
import OrderStatusScreen from './pages/customer/OrderStatusScreen';

// Auth
import LoginScreen from './pages/auth/LoginScreen';

// Rider screens
import RiderDashboardScreen from './pages/rider/RiderDashboardScreen';
import RiderOrderDetailScreen from './pages/rider/RiderOrderDetailScreen';

// Admin screens
import AdminDashboardScreen from './pages/admin/AdminDashboardScreen';
import AdminRestaurantsScreen from './pages/admin/AdminRestaurantsScreen';
import AdminRestaurantDetailScreen from './pages/admin/AdminRestaurantDetailScreen';
import AdminOrdersScreen from './pages/admin/AdminOrdersScreen';
import AdminRidersScreen from './pages/admin/AdminRidersScreen';
import AdminPaymentsScreen from './pages/admin/AdminPaymentsScreen';
import AdminCommissionsScreen from './pages/admin/AdminCommissionsScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}>
            {/* ---- Customer Screens ---- */}
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen
              name="RestaurantList"
              component={RestaurantListScreen}
            />
            <Stack.Screen name="Menu" component={MenuScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="OrderStatus" component={OrderStatusScreen} />

            {/* ---- Auth ---- */}
            <Stack.Screen name="Login" component={LoginScreen} />

            {/* ---- Rider Screens ---- */}
            <Stack.Screen
              name="RiderDashboard"
              component={RiderDashboardScreen}
            />
            <Stack.Screen
              name="RiderOrderDetail"
              component={RiderOrderDetailScreen}
            />

            {/* ---- Admin Screens ---- */}
            <Stack.Screen
              name="AdminDashboard"
              component={AdminDashboardScreen}
            />
            <Stack.Screen
              name="AdminRestaurants"
              component={AdminRestaurantsScreen}
            />
            <Stack.Screen
              name="AdminRestaurantDetail"
              component={AdminRestaurantDetailScreen}
            />
            <Stack.Screen
              name="AdminOrders"
              component={AdminOrdersScreen}
            />
            <Stack.Screen
              name="AdminRiders"
              component={AdminRidersScreen}
            />
            <Stack.Screen
              name="AdminPayments"
              component={AdminPaymentsScreen}
            />
            <Stack.Screen
              name="AdminCommissions"
              component={AdminCommissionsScreen}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
