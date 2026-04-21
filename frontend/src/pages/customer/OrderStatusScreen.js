import React, {useEffect, useState, useRef} from 'react';
import {View, Text, StyleSheet, RefreshControl, ScrollView, Animated, TouchableOpacity} from 'react-native';
import AppHeader from '../../components/AppHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import {getOrder} from '../../services/apiService';
import {useCart} from '../../context/CartContext';
import {COLORS, FONTS, SIZES, SHADOWS} from '../../utils/theme';

const AnimatedStage = ({stage, index, total}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-20)).current;
  const dotScale = useRef(new Animated.Value(0.5)).current;
  const lineHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay: index * 150,
        useNativeDriver: false,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 400,
        delay: index * 150,
        useNativeDriver: false,
      }),
      Animated.spring(dotScale, {
        toValue: 1,
        delay: index * 150 + 100,
        friction: 4,
        useNativeDriver: false,
      }),
    ]).start();

    if (index < total - 1) {
      Animated.timing(lineHeight, {
        toValue: 1,
        duration: 300,
        delay: index * 150 + 200,
        useNativeDriver: false,
      }).start();
    }
  }, []);

  return (
    <Animated.View style={[styles.stageRow, {opacity, transform: [{translateX}]}]}>
      <View style={styles.stageLeft}>
        <Animated.View
          style={[
            styles.stageDot,
            stage.done && styles.stageDotActive,
            {transform: [{scale: dotScale}]},
          ]}>
          <Text style={styles.stageIcon}>{stage.icon}</Text>
        </Animated.View>
        {index < total - 1 && (
          <Animated.View
            style={[
              styles.stageLine,
              stage.done && styles.stageLineActive,
              {flexGrow: lineHeight},
            ]}
          />
        )}
      </View>
      <View style={styles.stageInfo}>
        <Text
          style={[
            styles.stageLabel,
            stage.done && styles.stageLabelActive,
          ]}>
          {stage.label}
        </Text>
        <Text style={styles.stageTime}>{stage.time}</Text>
      </View>
      {stage.done && (
        <View style={styles.checkBadge}>
          <Text style={styles.checkText}>✓</Text>
        </View>
      )}
    </Animated.View>
  );
};

const OrderStatusScreen = ({route, navigation}) => {
  const {orderId} = route.params;
  const {clearActiveOrder} = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;

  const fetchOrder = async () => {
    try {
      const res = await getOrder(orderId);
      setOrder(res.data);
    } catch (e) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Poll every 5 seconds so rider_left and other status changes appear immediately
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, []);

  // Animate header in once order loads
  useEffect(() => {
    if (order) {
      Animated.timing(headerAnim, {toValue: 1, duration: 600, useNativeDriver: false}).start();
    }
  }, [order]);

  // Auto-clear active order when delivered
  useEffect(() => {
    if (order?.status?.rider_left) {
      clearActiveOrder();
    }
  }, [order?.status?.rider_left]);

  const formatTime = dateStr => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  };

  if (loading) return <LoadingSpinner />;
  if (!order) {
    return (
      <View style={styles.container}>
        <AppHeader title="Order Status" navigation={navigation} />
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>😞</Text>
          <Text style={styles.errorText}>Order not found</Text>
        </View>
      </View>
    );
  }

  const status = order.status || {};
  const timestamps = order.timestamps || {};

  const stages = [
    {label: 'Order Placed', done: true, time: formatTime(timestamps.created_at), icon: '📝'},
    {label: 'Confirmed', done: status.confirmed, time: formatTime(timestamps.confirmed_at), icon: '✅'},
    {label: 'Preparing', done: status.preparing, time: formatTime(timestamps.preparing_at), icon: '🍳'},
    {label: 'Rider Left', done: status.rider_left, time: formatTime(timestamps.rider_left_at), icon: '🏍️'},
  ];

  return (
    <View style={styles.container}>
      <AppHeader title="Order Status" navigation={navigation} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchOrder();
            }}
            colors={[COLORS.primary]}
          />
        }>
        {/* Order ID Header */}
        <Animated.View style={[styles.orderHeaderCard, {opacity: headerAnim}]}>
          <Text style={styles.orderEmoji}>📦</Text>
          <Text style={styles.orderIdLabel}>
            Order #{orderId.slice(-6).toUpperCase()}
          </Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>
              {status.rider_left ? '🏍️ On the Way' :
               status.preparing ? '🍳 Preparing' :
               status.confirmed ? '✅ Confirmed' : '⏳ Pending'}
            </Text>
          </View>
        </Animated.View>

        {/* Status Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.sectionTitle}>Tracking</Text>
          <View style={styles.timeline}>
            {stages.map((stage, index) => (
              <AnimatedStage
                key={index}
                stage={stage}
                index={index}
                total={stages.length}
              />
            ))}
          </View>
        </View>

        {/* Rider Info */}
        {order.rider_name && (
          <View style={styles.riderCard}>
            <Text style={styles.sectionTitle}>Your Rider</Text>
            <View style={styles.riderRow}>
              <View style={styles.riderAvatar}>
                <Text style={styles.riderAvatarText}>🏍️</Text>
              </View>
              <View style={styles.riderInfo}>
                <Text style={styles.riderName}>{order.rider_name}</Text>
                <Text style={styles.riderPhone}>📞 {order.rider_phone}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {order.items?.map((item, idx) => (
            <View key={idx} style={styles.summaryItem}>
              <Text style={styles.summaryItemText}>
                {item.quantity}x Item
              </Text>
              <Text style={styles.summaryItemPrice}>
                Rs. {(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={styles.summaryDivider} />
          <View style={styles.summaryTotal}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>
              Rs. {order.total_amount?.toFixed(2)}
            </Text>
          </View>
        </View>


      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  content: {padding: SIZES.padding, paddingBottom: 30},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  errorEmoji: {fontSize: 50, marginBottom: 12},
  errorText: {fontSize: SIZES.base, color: COLORS.danger, ...FONTS.semiBold},
  orderHeaderCard: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: SIZES.radiusLg,
    padding: 24,
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  orderEmoji: {fontSize: 36, marginBottom: 8},
  orderIdLabel: {
    fontSize: SIZES.xl,
    ...FONTS.bold,
    color: COLORS.text,
    marginBottom: 10,
  },
  statusPill: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusPillText: {
    color: COLORS.white,
    fontSize: SIZES.sm,
    ...FONTS.bold,
  },
  timelineCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 20,
    marginBottom: 16,
    ...SHADOWS.medium,
  },
  timeline: {marginTop: 4},
  stageRow: {flexDirection: 'row', alignItems: 'flex-start'},
  stageLeft: {alignItems: 'center', width: 50},
  stageDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  stageDotActive: {
    backgroundColor: COLORS.secondarySoft,
    borderColor: COLORS.secondary,
  },
  stageIcon: {fontSize: 18},
  stageLine: {
    width: 3,
    backgroundColor: COLORS.lightGrey,
    borderRadius: 2,
    minHeight: 30,
  },
  stageLineActive: {backgroundColor: COLORS.secondary},
  stageInfo: {
    marginLeft: 14,
    justifyContent: 'center',
    paddingBottom: 24,
    flex: 1,
  },
  stageLabel: {
    fontSize: SIZES.md,
    color: COLORS.textMuted,
    ...FONTS.medium,
  },
  stageLabelActive: {color: COLORS.text, ...FONTS.bold},
  stageTime: {fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 2},
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  checkText: {color: COLORS.white, fontSize: 12, ...FONTS.bold},
  riderCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 18,
    marginBottom: 16,
    ...SHADOWS.medium,
  },
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riderAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.secondarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  riderAvatarText: {fontSize: 24},
  riderInfo: {flex: 1},
  sectionTitle: {
    fontSize: SIZES.base,
    ...FONTS.bold,
    color: COLORS.text,
    marginBottom: 14,
  },
  riderName: {fontSize: SIZES.md, color: COLORS.text, ...FONTS.bold, marginBottom: 3},
  riderPhone: {fontSize: SIZES.sm, color: COLORS.textLight},
  summaryCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 18,
    ...SHADOWS.medium,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  summaryItemText: {fontSize: SIZES.md, color: COLORS.text},
  summaryItemPrice: {fontSize: SIZES.md, color: COLORS.text, ...FONTS.medium},
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryTotalLabel: {fontSize: SIZES.base, ...FONTS.bold, color: COLORS.text},
  summaryTotalValue: {fontSize: SIZES.lg, ...FONTS.bold, color: COLORS.primary},
});

export default OrderStatusScreen;
