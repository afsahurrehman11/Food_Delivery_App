import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Animated,
} from 'react-native';
import AppHeader from '../../components/AppHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import {useAuth} from '../../context/AuthContext';
import {getRiderOrders} from '../../services/apiService';
import {COLORS, FONTS, SIZES, SHADOWS} from '../../utils/theme';

const AnimatedOrderCard = ({item, index, onPress}) => {
  const getStatusBadge = status => {
    if (status?.rider_left) return {text: 'On the Way', color: COLORS.secondary, icon: '🏍️'};
    if (status?.preparing) return {text: 'Preparing', color: COLORS.warning, icon: '🍳'};
    if (status?.confirmed) return {text: 'Confirmed', color: COLORS.success, icon: '✅'};
    return {text: 'Pending', color: COLORS.textMuted, icon: '⏳'};
  };

  const badge = getStatusBadge(item.status);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}>
      <Animated.View
        style={[styles.card]}>
        <View style={styles.cardHeader}>
          <View style={styles.orderIdWrap}>
            <Text style={styles.orderId}>#{item.id?.slice(-6).toUpperCase()}</Text>
          </View>
          <View style={[styles.badge, {backgroundColor: badge.color}]}>
            <Text style={styles.badgeText}>{badge.icon} {badge.text}</Text>
          </View>
        </View>
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>👤</Text>
            <Text style={styles.customerName}>{item.customer_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📞</Text>
            <Text style={styles.customerPhone}>{item.customer_phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.customerAddress} numberOfLines={2}>{item.customer_address}</Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.total}>
            Rs. {item.total_amount?.toFixed(2)}
          </Text>
          <Text style={styles.itemCount}>
            {item.items?.length || 0} items
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const RiderDashboardScreen = ({navigation}) => {
  const {user, logout} = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const welcomeAnim = useRef(new Animated.Value(0)).current;

  const fetchOrders = useCallback(async () => {
    try {
      const res = await getRiderOrders(user.user_id);
      setOrders(res.data);
    } catch (e) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 45000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleLogout = async () => {
    await logout();
    navigation.reset({index: 0, routes: [{name: 'Splash'}]});
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <AppHeader
        title={`Hi, ${user?.name || 'Rider'} 👋`}
        showBack={false}
        rightComponent={
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        }
      />

      {/* Stats Bar */}
      <Animated.View style={[styles.statsBar, {opacity: welcomeAnim}]}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{orders.length}</Text>
          <Text style={styles.statLabel}>Active Orders</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {orders.filter(o => o.status?.rider_left).length}
          </Text>
          <Text style={styles.statLabel}>On the Way</Text>
        </View>
      </Animated.View>

      {orders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🏍️</Text>
          <Text style={styles.emptyText}>No orders assigned yet</Text>
          <Text style={styles.emptySubtext}>Pull down to refresh</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id}
          renderItem={({item, index}) => (
            <AnimatedOrderCard
              item={item}
              index={index}
              onPress={() => navigation.navigate('RiderOrderDetail', {orderId: item.id})}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchOrders();
              }}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  list: {padding: SIZES.padding, paddingTop: 8},
  statsBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    marginHorizontal: SIZES.padding,
    marginTop: 14,
    marginBottom: 6,
    borderRadius: SIZES.radiusLg,
    padding: 16,
    ...SHADOWS.medium,
  },
  statItem: {flex: 1, alignItems: 'center'},
  statValue: {fontSize: SIZES.xl, ...FONTS.bold, color: COLORS.primary},
  statLabel: {fontSize: SIZES.xs, color: COLORS.textLight, ...FONTS.medium, marginTop: 2},
  statDivider: {width: 1, backgroundColor: COLORS.border, marginHorizontal: 16},
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 18,
    marginBottom: 14,
    ...SHADOWS.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  orderIdWrap: {
    backgroundColor: COLORS.lightGrey,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  orderId: {fontSize: SIZES.sm, ...FONTS.bold, color: COLORS.text},
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  badgeText: {fontSize: SIZES.xs, color: COLORS.white, ...FONTS.bold},
  infoSection: {marginBottom: 10},
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  infoIcon: {fontSize: 14, marginRight: 8, marginTop: 1},
  customerName: {fontSize: SIZES.md, color: COLORS.text, ...FONTS.semiBold, flex: 1},
  customerPhone: {fontSize: SIZES.sm, color: COLORS.textLight, flex: 1},
  customerAddress: {fontSize: SIZES.sm, color: COLORS.textLight, flex: 1},
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  total: {fontSize: SIZES.base, color: COLORS.primary, ...FONTS.bold},
  itemCount: {fontSize: SIZES.sm, color: COLORS.textMuted, ...FONTS.medium},
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  logoutText: {fontSize: SIZES.xs, color: COLORS.white, ...FONTS.semiBold},
  empty: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  emptyEmoji: {fontSize: 70, marginBottom: 16},
  emptyText: {fontSize: SIZES.lg, color: COLORS.text, ...FONTS.bold},
  emptySubtext: {fontSize: SIZES.sm, color: COLORS.textMuted, marginTop: 4},
});

export default RiderDashboardScreen;
