import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Animated,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import AppHeader from '../../components/AppHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  getOrders,
  updateOrderStatus,
  assignRiderToOrder,
  getRiders,
  getRestaurants,
  deleteOrder,
  createOrder,
} from '../../services/apiService';
import {COLORS, FONTS, SIZES, SHADOWS} from '../../utils/theme';

/* ── Rider Picker Modal (web-compatible fixed overlay) ─────── */
const RiderPickerModal = ({visible, riders, onSelect, onCancel, assigning, assignedRider, onGoToRiders, ridersLoading, ridersError}) => {
  if (!visible) return null;

  // position:'fixed' is a web-only CSS value — React Native for Web passes it through
  // This guarantees the overlay covers the full viewport regardless of parent containers
  const overlayStyle = Platform.OS === 'web'
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
      }
    : modalStyles.overlay;

  return (
    <View style={overlayStyle}>
      {/* Backdrop tap to cancel */}
      <TouchableOpacity style={modalStyles.backdrop} onPress={onCancel} activeOpacity={1} />

      <View style={modalStyles.sheet}>
        {/* Header */}
        <View style={modalStyles.header}>
          <Text style={modalStyles.headerEmoji}>🏍️</Text>
          <Text style={modalStyles.title}>Assign Rider</Text>
          <Text style={modalStyles.subtitle}>Select a rider for this order</Text>
        </View>

        {/* Body states */}
        {assignedRider ? (
          <View style={modalStyles.successBox}>
            <Text style={modalStyles.successEmoji}>✅</Text>
            <Text style={modalStyles.successTitle}>Rider Assigned!</Text>
            <Text style={modalStyles.successName}>{assignedRider}</Text>
          </View>
        ) : ridersLoading ? (
          <View style={modalStyles.emptyBox}>
            <Text style={modalStyles.emptyEmoji}>⏳</Text>
            <Text style={modalStyles.emptyMsg}>Loading riders...</Text>
          </View>
        ) : ridersError ? (
          <View style={modalStyles.emptyBox}>
            <Text style={modalStyles.emptyEmoji}>🔐</Text>
            <Text style={modalStyles.emptyMsg}>Session expired</Text>
            <Text style={modalStyles.emptySubMsg}>Please sign in again to continue.</Text>
            <TouchableOpacity style={modalStyles.goToRidersBtn} onPress={onCancel} activeOpacity={0.8}>
              <Text style={modalStyles.goToRidersBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : riders.length === 0 ? (
          <View style={modalStyles.emptyBox}>
            <Text style={modalStyles.emptyEmoji}>🏍️</Text>
            <Text style={modalStyles.emptyMsg}>No riders found.</Text>
            <Text style={modalStyles.emptySubMsg}>You need to add riders before you can assign them to orders.</Text>
            <TouchableOpacity style={modalStyles.goToRidersBtn} onPress={onGoToRiders} activeOpacity={0.8}>
              <Text style={modalStyles.goToRidersBtnText}>➕ Add Riders Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={modalStyles.riderList} showsVerticalScrollIndicator={false}>
            {riders.map(rider => (
              <TouchableOpacity
                key={rider.id}
                style={[modalStyles.riderRow, assigning && modalStyles.riderRowDisabled]}
                onPress={() => !assigning && onSelect(rider)}
                activeOpacity={0.7}>
                <View style={modalStyles.riderAvatar}>
                  <Text style={modalStyles.riderAvatarText}>
                    {rider.name?.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={modalStyles.riderMeta}>
                  <Text style={modalStyles.riderName}>{rider.name}</Text>
                  <Text style={modalStyles.riderPhone}>📞 {rider.phone}</Text>
                </View>
                {assigning ? (
                  <Text style={modalStyles.loadingDot}>⏳</Text>
                ) : (
                  <Text style={modalStyles.chevron}>›</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Cancel */}
        {!assignedRider && (
          <TouchableOpacity style={modalStyles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
            <Text style={modalStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

/* ── Simple notification toast ──────────────────────────────── */
const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  }
};

const AnimatedOrderCard = ({item, index, riders, onConfirm, onPreparing, onAssignRider, onRiderLeft, onDelete}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(25)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {toValue: 1, duration: 400, delay: index * 70, useNativeDriver: false}),
      Animated.timing(translateY, {toValue: 0, duration: 400, delay: index * 70, useNativeDriver: false}),
    ]).start();
  }, []);

  const status = item.status || {};

  const getStatusInfo = () => {
    if (status.delivered) return {text: 'Delivered', color: COLORS.primary, icon: '🎉'};
    if (status.rider_left) return {text: 'On the Way', color: COLORS.secondary, icon: '🏍️'};
    if (status.preparing) return {text: 'Preparing', color: COLORS.warning, icon: '🍳'};
    if (status.confirmed) return {text: 'Confirmed', color: COLORS.success, icon: '✅'};
    return {text: 'Pending', color: COLORS.textMuted, icon: '⏳'};
  };

  const statusInfo = getStatusInfo();

  return (
    <Animated.View style={[styles.card, {opacity, transform: [{translateY}]}]}>
        <View style={styles.cardHeader}>
          <View style={styles.orderIdWrap}>
            <Text style={styles.orderId}>#{item.id?.slice(-6).toUpperCase()}</Text>
          </View>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete && onDelete(item.id)}>
            <Text style={styles.deleteText}>🗑️</Text>
          </TouchableOpacity>
          <View style={[styles.badge, {backgroundColor: statusInfo.color}]}>
            <Text style={styles.badgeText}>{statusInfo.icon} {statusInfo.text}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          {item.restaurant_name && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🏪</Text>
              <Text style={styles.infoText}>{item.restaurant_name}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>👤</Text>
            <Text style={styles.infoText}>{item.customer_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📞</Text>
            <Text style={styles.infoTextLight}>{item.customer_phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoTextLight} numberOfLines={1}>{item.customer_address}</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardFooter}>
          <Text style={styles.total}>Rs. {item.total_amount?.toFixed(2)}</Text>
          <Text style={styles.itemCount}>{item.items?.length || 0} items</Text>
        </View>

        {item.rider_id && (
          <View style={styles.riderBadge}>
            <Text style={styles.riderText}>🏍️ {item.rider_name || `Rider #${item.rider_id?.slice(-6)}`}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {!status.confirmed && (
            <TouchableOpacity
              style={[styles.actionBtn, {backgroundColor: COLORS.success}]}
              onPress={() => onConfirm(item.id)}
              activeOpacity={0.7}>
              <Text style={styles.actionText}>✓ Confirm</Text>
            </TouchableOpacity>
          )}
          {status.confirmed && !status.preparing && (
            <TouchableOpacity
              style={[styles.actionBtn, {backgroundColor: COLORS.warning}]}
              onPress={() => onPreparing(item.id)}
              activeOpacity={0.7}>
              <Text style={styles.actionText}>🍳 Preparing</Text>
            </TouchableOpacity>
          )}
          {!item.rider_id && status.confirmed && (
            <TouchableOpacity
              style={[styles.actionBtn, {backgroundColor: COLORS.secondary}]}
              onPress={() => onAssignRider(item.id)}
              activeOpacity={0.7}>
              <Text style={styles.actionText}>🏍️ Assign Rider</Text>
            </TouchableOpacity>
          )}
          {status.preparing && !status.rider_left && item.rider_id && (
            <TouchableOpacity
              style={[styles.actionBtn, {backgroundColor: COLORS.primary}]}
              onPress={() => onRiderLeft(item.id)}
              activeOpacity={0.7}>
              <Text style={styles.actionText}>🚀 Rider Left</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
  );
};

const AdminOrdersScreen = ({navigation}) => {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [ridersLoading, setRidersLoading] = useState(false);
  const [ridersError, setRidersError] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [filterRestaurant, setFilterRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [newOrderModalVisible, setNewOrderModalVisible] = useState(false);
  const [newOrder, setNewOrder] = useState({
    restaurant_id: '',
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    items_json: '',
  });

  // Rider modal state
  const [riderModalVisible, setRiderModalVisible] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [assignedRiderName, setAssignedRiderName] = useState(null);

  const fetchData = async () => {
    try {
      const ordersRes = await getOrders();
      setOrders(ordersRes.data || []);
      setAuthError(false);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        setAuthError(true);
      }
      console.error('Failed to load orders:', e?.response?.data || e.message);
    }
    try {
      const ridersRes = await getRiders();
      setRiders(ridersRes.data || []);
    } catch (e) {
      console.error('Failed to load riders:', e?.response?.data || e.message);
    }
    try {
      const restRes = await getRestaurants();
      setRestaurants(restRes.data || []);
    } catch (e) {
      console.error('Failed to load restaurants:', e?.response?.data || e.message);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const fetchRiders = async () => {
    setRidersLoading(true);
    setRidersError(false);
    try {
      const res = await getRiders();
      setRiders(res.data || []);
    } catch (e) {
      console.error('Failed to fetch riders:', e?.response?.data || e.message);
      setRidersError(true);
    } finally {
      setRidersLoading(false);
    }
  };

  const handleDeleteOrder = async orderId => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Delete this order? This cannot be undone.')
      : await new Promise(resolve => {
          Alert.alert(
            'Confirm',
            'Delete this order? This cannot be undone.',
            [
              {text: 'Cancel', style: 'cancel', onPress: () => resolve(false)},
              {text: 'Delete', style: 'destructive', onPress: () => resolve(true)},
            ],
            {cancelable: true}
          );
        });
    if (!confirmed) return;
    try {
      await deleteOrder(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      showAlert('Deleted', 'Order has been deleted.');
    } catch (e) {
      showAlert('Error', 'Failed to delete order.');
      console.error(e);
    }
  };

  const filteredOrders = filterRestaurant
    ? orders.filter(o => o.restaurant_id === filterRestaurant)
    : orders;

  useEffect(() => {
    fetchData();
    // Auto-refresh every 3 seconds to sync order status changes (e.g., delivery updates)
    const refreshInterval = setInterval(() => {
      fetchData();
    }, 3000);
    return () => clearInterval(refreshInterval);
  }, []);

  const handleConfirm = async orderId => {
    try {
      await updateOrderStatus(orderId, {confirmed: true});
      fetchData();
    } catch (e) {
      showAlert('Error', 'Failed to confirm order.');
    }
  };

  const handlePreparing = async orderId => {
    try {
      await updateOrderStatus(orderId, {preparing: true});
      fetchData();
    } catch (e) {
      showAlert('Error', 'Failed to update.');
    }
  };

  const handleAssignRider = orderId => {
    setPendingOrderId(orderId);
    setAssignedRiderName(null);
    setAssigning(false);
    setRiderModalVisible(true); // open modal immediately
    fetchRiders();              // load riders in background
  };

  const handleSelectRider = async rider => {
    setAssigning(true);
    try {
      await assignRiderToOrder(pendingOrderId, rider.id);
      setAssignedRiderName(rider.name);
      fetchData();
      // Auto-close after showing success
      setTimeout(() => {
        setRiderModalVisible(false);
        setAssignedRiderName(null);
        setPendingOrderId(null);
      }, 1800);
    } catch (e) {
      setRiderModalVisible(false);
      showAlert('Error', 'Failed to assign rider. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const handleCloseRiderModal = () => {
    if (!assigning) {
      setRiderModalVisible(false);
      setPendingOrderId(null);
      setAssignedRiderName(null);
    }
  };

  const handleRiderLeft = async orderId => {
    try {
      await updateOrderStatus(orderId, {rider_left: true});
      fetchData();
    } catch (e) {
      showAlert('Error', 'Failed to update.');
    }
  };

  if (loading) return <LoadingSpinner />;

  if (authError) {
    return (
      <View style={styles.container}>
        <AppHeader title="All Orders" navigation={navigation} />
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32}}>
          <Text style={{fontSize: 48, marginBottom: 16}}>🔐</Text>
          <Text style={{fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 8, textAlign: 'center'}}>Session Expired</Text>
          <Text style={{fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: 24}}>Your login session has expired. Please sign in again.</Text>
          <TouchableOpacity
            style={{backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12}}
            onPress={() => navigation.navigate('Login')}>
            <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 16}}>Sign In Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="All Orders" navigation={navigation} />


      {/* Restaurant Filter */}
      {restaurants.length > 0 && (
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterChip, !filterRestaurant && styles.filterChipActive]}
            onPress={() => setFilterRestaurant(null)}>
            <Text style={[styles.filterText, !filterRestaurant && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          {restaurants.map(r => (
            <TouchableOpacity
              key={r.id}
              style={[styles.filterChip, filterRestaurant === r.id && styles.filterChipActive]}
              onPress={() => setFilterRestaurant(r.id)}>
              <Text style={[styles.filterText, filterRestaurant === r.id && styles.filterTextActive]}
                numberOfLines={1}>{r.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.addButton, {margin: SIZES.padding}]}
        onPress={() => setNewOrderModalVisible(true)}
        activeOpacity={0.7}>
        <Text style={[styles.addButtonText, {fontSize: SIZES.base}]}>➕ New Order</Text>
      </TouchableOpacity>
      <FlatList
        data={filteredOrders}
        keyExtractor={item => item.id}
        renderItem={({item, index}) => (
          <AnimatedOrderCard
            item={item}
            index={index}
            riders={riders}
            onConfirm={handleConfirm}
            onPreparing={handlePreparing}
            onAssignRider={handleAssignRider}
            onRiderLeft={handleRiderLeft}
            onDelete={handleDeleteOrder}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(); }}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>No orders yet</Text>
          </View>
        }
      />


      {/* Rider picker — inline absolute overlay, works on web */}
      <RiderPickerModal
        visible={riderModalVisible}
        riders={riders}
        ridersLoading={ridersLoading}
        ridersError={ridersError}
        onSelect={handleSelectRider}
        onCancel={handleCloseRiderModal}
        assigning={assigning}
        assignedRider={assignedRiderName}
        onGoToRiders={() => {
          setRiderModalVisible(false);
          navigation.navigate('AdminRiders');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SIZES.padding,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.lightGrey,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  filterText: {fontSize: SIZES.sm, color: COLORS.textLight, ...FONTS.medium},
  filterTextActive: {color: COLORS.primary, ...FONTS.bold},
  list: {padding: SIZES.padding, paddingTop: 8},
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 16,
    marginBottom: 14,
    ...SHADOWS.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderIdWrap: {
    backgroundColor: COLORS.lightGrey,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  orderId: {fontSize: SIZES.sm, ...FONTS.bold, color: COLORS.text},
  deleteBtn: {padding: 4, marginLeft: 6},
  deleteText: {fontSize: SIZES.base, color: COLORS.danger},
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  badgeText: {fontSize: SIZES.xs, color: COLORS.white, ...FONTS.bold},
  infoSection: {marginBottom: 8},
  infoRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 4},
  infoIcon: {fontSize: 13, marginRight: 8},
  infoText: {fontSize: SIZES.md, color: COLORS.text, ...FONTS.semiBold, flex: 1},
  infoTextLight: {fontSize: SIZES.sm, color: COLORS.textLight, flex: 1},
  cardDivider: {height: 1, backgroundColor: COLORS.border, marginVertical: 8},
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  total: {fontSize: SIZES.base, color: COLORS.primary, ...FONTS.bold},
  itemCount: {fontSize: SIZES.sm, color: COLORS.textMuted, ...FONTS.medium},
  riderBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.secondarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 8,
  },
  riderText: {fontSize: SIZES.xs, color: COLORS.secondary, ...FONTS.semiBold},
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  actionText: {color: COLORS.white, fontSize: SIZES.xs, ...FONTS.bold},
  empty: {flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80},
  emptyEmoji: {fontSize: 60, marginBottom: 12},
  emptyText: {fontSize: SIZES.base, color: COLORS.textMuted, ...FONTS.semiBold},
});

/* ── Modal Styles ───────────────────────────────────────────── */
const modalStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 9999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: COLORS.cardBg || '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    overflow: 'hidden',
    zIndex: 1000,
    ...SHADOWS.large,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 24,
    alignItems: 'center',
  },
  headerEmoji: {fontSize: 36, marginBottom: 6},
  title: {fontSize: SIZES.xl, ...FONTS.bold, color: '#fff', marginBottom: 4},
  subtitle: {fontSize: SIZES.sm, color: 'rgba(255,255,255,0.8)', ...FONTS.medium},
  riderList: {maxHeight: 280},
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#eee',
  },
  riderRowDisabled: {opacity: 0.5},
  riderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primarySoft || '#e8f4ea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  riderAvatarText: {fontSize: SIZES.lg, ...FONTS.bold, color: COLORS.primary},
  riderMeta: {flex: 1},
  riderName: {fontSize: SIZES.md, ...FONTS.bold, color: COLORS.text, marginBottom: 2},
  riderPhone: {fontSize: SIZES.sm, color: COLORS.textLight},
  chevron: {fontSize: 22, color: COLORS.textMuted, fontWeight: '300'},
  loadingDot: {fontSize: 18},
  cancelBtn: {
    margin: 16,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border || '#ddd',
    alignItems: 'center',
  },
  cancelText: {fontSize: SIZES.md, ...FONTS.semiBold, color: COLORS.textLight},
  successBox: {
    padding: 32,
    alignItems: 'center',
  },
  successEmoji: {fontSize: 48, marginBottom: 10},
  successTitle: {fontSize: SIZES.lg, ...FONTS.bold, color: COLORS.success, marginBottom: 4},
  successName: {fontSize: SIZES.base, color: COLORS.text, ...FONTS.semiBold},
  emptyBox: {padding: 32, alignItems: 'center'},
  emptyEmoji: {fontSize: 40, marginBottom: 8},
  emptyMsg: {fontSize: SIZES.md, color: COLORS.text, ...FONTS.bold, marginBottom: 6},
  emptySubMsg: {fontSize: SIZES.sm, color: COLORS.textMuted, ...FONTS.regular, textAlign: 'center', marginBottom: 20},
  goToRidersBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  goToRidersBtnText: {color: '#fff', ...FONTS.bold, fontSize: SIZES.base},
});

export default AdminOrdersScreen;
