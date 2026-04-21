import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

/**
 * Maps React Navigation screen names to React Router paths.
 */
const ROUTE_MAP = {
  Splash: '/',
  RestaurantList: '/restaurants',
  Menu: '/menu',
  Cart: '/cart',
  OrderStatus: '/order-status',
  Login: '/login',
  AdminDashboard: '/admin',
  AdminRestaurants: '/admin/restaurants',
  AdminOrders: '/admin/orders',
  AdminRiders: '/admin/riders',
  AdminPayments: '/admin/payments',
  AdminCommissions: '/admin/commissions',
  AdminRestaurantDetail: '/admin/restaurant',
  AdminRestaurantPayments: '/admin/payments/restaurant',
  AdminRestaurantCommissions: '/admin/commissions/restaurant',
  RiderDashboard: '/rider',
  RiderOrderDetail: '/rider/order',
};

/**
 * Build a path from a screen name and optional params.
 */
function buildPath(screenName, params) {
  const base = ROUTE_MAP[screenName] || '/';

  // Screens that take a dynamic segment
  if (screenName === 'Menu' && params?.restaurantId) {
    return `/menu/${params.restaurantId}`;
  }
  if (screenName === 'OrderStatus' && params?.orderId) {
    return `/order-status/${params.orderId}`;
  }
  if (screenName === 'AdminRestaurantDetail' && params?.restaurantId) {
    return `/admin/restaurant/${params.restaurantId}`;
  }
  if (screenName === 'AdminRestaurantPayments' && params?.restaurantId) {
    return `/admin/payments/restaurant/${params.restaurantId}`;
  }
  if (screenName === 'AdminRestaurantCommissions' && params?.restaurantId) {
    return `/admin/commissions/restaurant/${params.restaurantId}`;
  }
  if (screenName === 'RiderOrderDetail' && params?.orderId) {
    return `/rider/order/${params.orderId}`;
  }

  return base;
}

/**
 * HOC that wraps a React-Navigation-style screen component so it receives
 * `navigation` and `route` props that work with React Router.
 */
export function withWebNavigation(ScreenComponent) {
  return function WebNavigationWrapper(props) {
    const navigate = useNavigate();
    const params = useParams();
    const location = useLocation();

    // Build a React-Navigation-compatible `navigation` object
    const navigation = {
      navigate: (screenName, screenParams) => {
        const path = buildPath(screenName, screenParams);
        // Pass extra params via location state
        navigate(path, { state: screenParams });
      },
      goBack: () => navigate(-1),
      reset: ({ routes }) => {
        if (routes && routes.length > 0) {
          const last = routes[routes.length - 1];
          const path = buildPath(last.name, last.params);
          navigate(path, { replace: true, state: last.params });
        }
      },
    };

    // Build a React-Navigation-compatible `route` object
    const route = {
      params: {
        ...params,
        ...(location.state || {}),
      },
    };

    return <ScreenComponent {...props} navigation={navigation} route={route} />;
  };
}
