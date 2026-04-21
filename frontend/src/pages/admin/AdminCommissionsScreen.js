import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import AppHeader from '../../components/AppHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import {useAuth} from '../../context/AuthContext';
import {getOrders, getRestaurants} from '../../services/apiService';
import {COLORS, FONTS, SIZES, SHADOWS} from '../../utils/theme';

const AnimatedRestaurantCard = ({restaurant, orders, commissionRate, index, onPress}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {toValue: 1, duration: 400, delay: index * 80, useNativeDriver: false}),
      Animated.timing(translateY, {toValue: 0, duration: 400, delay: index * 80, useNativeDriver: false}),
    ]).start();
  }, []);

  const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const totalCommission = (totalRevenue * (commissionRate || 0)) / 100;
  const count = orders.length;

  return (
    <Animated.View style={{opacity, transform: [{translateY}]}}>
      <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
        <View style={styles.cardTop}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🏪</Text>
          </View>
          <View style={{flex: 1, marginLeft: 12}}>
            <Text style={styles.restName}>{restaurant.name}</Text>
            <Text style={styles.restSub}>{count} order{count !== 1 ? 's' : ''} · {(commissionRate || 0).toFixed(1)}% commission</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Total Revenue</Text>
            <Text style={styles.statValue}>Rs. {totalRevenue.toFixed(2)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Commission Earned</Text>
            <Text style={[styles.statValue, {color: COLORS.primary}]}>Rs. {totalCommission.toFixed(2)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const AdminCommissionsScreen = ({navigation}) => {
  const {user, loading: authLoading} = useAuth();
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [ordersRes, restRes] = await Promise.all([getOrders(), getRestaurants()]);
      setOrders(ordersRes?.data || []);
      setRestaurants(restRes?.data || []);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to load data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      navigation.navigate('Login');
      return;
    }
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [authLoading, user]);

  if (authLoading || loading) return <LoadingSpinner />;

  if (error) {
    return (
      <View style={styles.container}>
        <AppHeader title="Commissions" navigation={navigation} />
        <View style={styles.empty}>
          <Text style={{fontSize: 50, marginBottom: 12}}>🔒</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity
            style={{marginTop: 16, padding: 12, backgroundColor: COLORS.primary, borderRadius: SIZES.radius}}
            onPress={() => navigation.navigate('Login')}>
            <Text style={{color: COLORS.white, ...FONTS.bold}}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const ordersByRestaurant = {};
  orders.forEach(o => {
    const rid = o.restaurant_id || 'unknown';
    if (!ordersByRestaurant[rid]) ordersByRestaurant[rid] = [];
    ordersByRestaurant[rid].push(o);
  });

  const restaurantsWithOrders = restaurants.filter(r => ordersByRestaurant[r.id]?.length > 0);

  const totalCommission = restaurants.reduce((s, r) => {
    const rOrders = ordersByRestaurant[r.id] || [];
    const rev = rOrders.reduce((rs, o) => rs + (o.total_amount || 0), 0);
    return s + (rev * (r.commission_rate || 0)) / 100;
  }, 0);

  return (
    <View style={styles.container}>
      <AppHeader title="Commissions" navigation={navigation} />

      <View style={styles.summaryBanner}>
        <Text style={styles.summaryText}>
          💎  Rs. {totalCommission.toFixed(2)} total commission across {restaurantsWithOrders.length} restaurant{restaurantsWithOrders.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={restaurantsWithOrders}
        keyExtractor={r => r.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({item: restaurant, index}) => (
          <AnimatedRestaurantCard
            restaurant={restaurant}
            orders={ordersByRestaurant[restaurant.id] || []}
            commissionRate={restaurant.commission_rate}
            index={index}
            onPress={() => navigation.navigate('AdminRestaurantCommissions', {
              restaurantId: restaurant.id,
              restaurantName: restaurant.name,
            })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{fontSize: 60, marginBottom: 12}}>💎</Text>
            <Text style={styles.emptyText}>No commission records yet</Text>
          </View>
        }
      />
    </View>
  );
};

export default AdminCommissionsScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  list: {padding: SIZES.padding, paddingTop: 8},
  summaryBanner: {
    marginHorizontal: SIZES.padding,
    marginTop: SIZES.padding,
    marginBottom: 4,
    backgroundColor: COLORS.primarySoft,
    borderRadius: SIZES.radius,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  summaryText: {fontSize: SIZES.sm, color: COLORS.primary, ...FONTS.semiBold},
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 16,
    marginBottom: 14,
    ...SHADOWS.medium,
  },
  cardTop: {flexDirection: 'row', alignItems: 'center'},
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center', alignItems: 'center',
  },
  iconText: {fontSize: 22},
  restName: {fontSize: SIZES.base, ...FONTS.bold, color: COLORS.text},
  restSub: {fontSize: SIZES.xs, color: COLORS.textMuted, ...FONTS.medium, marginTop: 2},
  chevron: {fontSize: 26, color: COLORS.primary, ...FONTS.bold, marginLeft: 8},
  divider: {height: 1, backgroundColor: COLORS.border, marginVertical: 12},
  statsRow: {flexDirection: 'row', alignItems: 'center'},
  stat: {flex: 1, alignItems: 'center'},
  statDivider: {width: 1, height: 32, backgroundColor: COLORS.border},
  statLabel: {fontSize: SIZES.xs, color: COLORS.textMuted, ...FONTS.medium, marginBottom: 2},
  statValue: {fontSize: SIZES.md, ...FONTS.bold, color: COLORS.text},
  empty: {flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80},
  emptyText: {fontSize: SIZES.base, color: COLORS.textMuted, ...FONTS.semiBold},
});
