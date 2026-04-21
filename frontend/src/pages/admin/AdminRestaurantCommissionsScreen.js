import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import AppHeader from '../../components/AppHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import {getOrders, getRestaurants, deleteOrder, createPayment, getRestaurantPayments, getInvoiceUrl} from '../../services/apiService';
import {COLORS, FONTS, SIZES, SHADOWS} from '../../utils/theme';

const showAlert = (title, message) => {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
};

const CommissionCard = ({item, index, commissionRate, onDelete}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {toValue: 1, duration: 400, delay: index * 70, useNativeDriver: false}),
      Animated.timing(translateY, {toValue: 0, duration: 400, delay: index * 70, useNativeDriver: false}),
    ]).start();
  }, []);

  const totalAmount = item.total_amount || 0;
  const commissionAmount = (totalAmount * commissionRate) / 100;
  const netAmount = totalAmount - commissionAmount;
  const items = item.items || [];

  return (
    <Animated.View style={[styles.card, {opacity, transform: [{translateY}]}]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderId}>Order #{item.id?.slice(-6).toUpperCase()}</Text>
          <Text style={styles.orderDate}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}</Text>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete && onDelete(item.id)} activeOpacity={0.7}>
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* Items */}
      {items.length > 0 && (
        <>
          <View style={styles.itemsSection}>
            <Text style={styles.itemsTitle}>📦 Items ({items.length})</Text>
            {items.map((orderItem, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemName}>{orderItem.name || 'Unknown Item'}</Text>
                <Text style={styles.itemMeta}>×{orderItem.quantity || 1}  Rs. {(orderItem.price || 0).toFixed(2)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.divider} />
        </>
      )}

      {/* Commission details */}
      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Amount</Text>
          <Text style={styles.detailValue}>Rs. {totalAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Commission Rate</Text>
          <Text style={styles.rateValue}>{commissionRate.toFixed(1)}%</Text>
        </View>
        <View style={[styles.detailRow, styles.commissionRow]}>
          <Text style={styles.detailLabel}>Commission</Text>
          <Text style={styles.commissionValue}>Rs. {commissionAmount.toFixed(2)}</Text>
        </View>
        <View style={[styles.detailRow, styles.netRow]}>
          <Text style={styles.detailLabel}>Net (Restaurant)</Text>
          <Text style={styles.netValue}>Rs. {netAmount.toFixed(2)}</Text>
        </View>
      </View>

      {/* Commission badge */}
      <View style={styles.commissionCard}>
        <Text style={styles.commissionIcon}>💎</Text>
        <Text style={styles.commissionBadgeAmount}>Rs. {commissionAmount.toFixed(2)}</Text>
        <Text style={styles.commissionBadgeLabel}>Commission Earned</Text>
      </View>
    </Animated.View>
  );
};

const AdminRestaurantCommissionsScreen = ({navigation, route}) => {
  const restaurantId = route?.params?.restaurantId;
  const restaurantName = route?.params?.restaurantName || 'Restaurant';

  const [orders, setOrders] = useState([]);
  const [commissionRate, setCommissionRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [existingPayments, setExistingPayments] = useState([]);

  // Pay modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payError, setPayError] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const handleInvoice = async () => {
    setInvoiceLoading(true);
    try {
      const url = await getInvoiceUrl(restaurantId);
      if (Platform.OS === 'web') window.open(url, '_blank');
    } catch (e) {
      showAlert('Error', 'Failed to generate invoice.');
    } finally {
      setInvoiceLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setError(null);
      const [ordersRes, restRes, paymentsRes] = await Promise.all([
        getOrders(),
        getRestaurants(),
        getRestaurantPayments(restaurantId),
      ]);
      const allOrders = ordersRes?.data || [];
      const allRests = restRes?.data || [];

      const restaurant = allRests.find(r => r.id === restaurantId);
      setCommissionRate(restaurant?.commission_rate || 0);
      setOrders(allOrders.filter(o => o.restaurant_id === restaurantId));
      setExistingPayments(paymentsRes?.data || []);
    } catch (e) {
      setError('Failed to load commissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [restaurantId]);

  const handlePay = async () => {
    const amt = parseFloat(payAmount);
    const netDue = totalRevenue - totalCommission;
    const alreadyPaid = existingPayments.reduce((s, p) => s + (p.paid_amount || 0), 0);
    const remaining = netDue - alreadyPaid;

    if (!payAmount || isNaN(amt) || amt <= 0) {
      setPayError('Please enter a valid amount.');
      return;
    }
    if (amt > remaining) {
      setPayError(`Amount cannot exceed remaining balance of Rs. ${remaining.toFixed(2)}`);
      return;
    }
    setPayError('');
    setPayLoading(true);
    try {
      await createPayment({
        restaurant_id: restaurantId,
        total_amount: totalRevenue,
        commission: totalCommission,
        paid_amount: amt,
        orders_included: orders.map(o => o.id),
      });
      setShowPayModal(false);
      setPayAmount('');
      await fetchData();
      if (Platform.OS === 'web') window.alert(`Success\n\nRs. ${amt.toFixed(2)} recorded as paid to ${restaurantName}.`);
    } catch (e) {
      setPayError('Failed to save payment. Please try again.');
    } finally {
      setPayLoading(false);
    }
  };

  const handleDelete = async orderId => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Delete this order? This cannot be undone.')
      : true;
    if (!confirmed) return;
    try {
      await deleteOrder(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (e) {
      showAlert('Error', 'Failed to delete order.');
    }
  };

  if (loading) return <LoadingSpinner />;

  const totalCommission = orders.reduce((s, o) => {
    return s + ((o.total_amount || 0) * commissionRate) / 100;
  }, 0);
  const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const netAmount = totalRevenue - totalCommission;
  const alreadyPaid = existingPayments.reduce((s, p) => s + (p.paid_amount || 0), 0);
  const remaining = Math.max(0, netAmount - alreadyPaid);

  return (
    <View style={styles.container}>
      <AppHeader title={restaurantName} navigation={navigation} showBack />

      {/* Invoice download button */}
      <TouchableOpacity
        style={styles.invoiceBtn}
        onPress={handleInvoice}
        disabled={invoiceLoading}
        activeOpacity={0.8}>
        <Text style={styles.invoiceBtnText}>{invoiceLoading ? '⏳ Generating...' : '📄 Download Invoice'}</Text>
      </TouchableOpacity>

      {/* 3 Summary Cards */}
      <View style={styles.summaryRow}>
        {/* Card 1: Total Amount */}
        <View style={[styles.summaryCard, {borderTopColor: COLORS.secondary}]}>
          <Text style={styles.summaryCardIcon}>💰</Text>
          <Text style={styles.summaryCardLabel}>Total Amount</Text>
          <Text style={[styles.summaryCardValue, {color: COLORS.secondary}]}>Rs. {totalRevenue.toFixed(2)}</Text>
        </View>

        {/* Card 2: Commission Rate + Amount */}
        <View style={[styles.summaryCard, {borderTopColor: COLORS.primary}]}>
          <Text style={styles.summaryCardIcon}>💎</Text>
          <Text style={styles.summaryCardLabel}>Commission</Text>
          <Text style={[styles.summaryCardValue, {color: COLORS.primary}]}>Rs. {totalCommission.toFixed(2)}</Text>
          <View style={styles.rateBadge}>
            <Text style={styles.rateBadgeText}>{commissionRate.toFixed(1)}%</Text>
          </View>
        </View>

        {/* Card 3: Net Amount + Pay button */}
        <View style={[styles.summaryCard, {borderTopColor: remaining > 0 ? COLORS.danger : COLORS.success}]}>
          <Text style={styles.summaryCardIcon}>🏦</Text>
          <Text style={styles.summaryCardLabel}>Net Amount</Text>
          <Text style={[styles.summaryCardValue, {color: remaining > 0 ? COLORS.success : COLORS.success}]}>
            {remaining > 0 ? `Rs. ${remaining.toFixed(2)}` : '✅ Fully Paid'}
          </Text>
          {remaining > 0 ? (
            <TouchableOpacity
              style={styles.payBtn}
              onPress={() => { setPayAmount(''); setPayError(''); setShowPayModal(true); }}
              activeOpacity={0.8}>
              <Text style={styles.payBtnText}>💵 Pay</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.payBtn, {backgroundColor: COLORS.success}]}>
              <Text style={styles.payBtnText}>✅ Done</Text>
            </View>
          )}
        </View>
      </View>

      {/* Payment status bar */}
      <View style={styles.payStatusBar}>
        <View style={styles.payStatusItem}>
          <Text style={styles.payStatusLabel}>Already Paid</Text>
          <Text style={[styles.payStatusValue, {color: COLORS.success}]}>Rs. {alreadyPaid.toFixed(2)}</Text>
        </View>
        <View style={styles.payStatusDivider} />
        <View style={styles.payStatusItem}>
          <Text style={styles.payStatusLabel}>Remaining</Text>
          <Text style={[styles.payStatusValue, {color: remaining > 0 ? COLORS.danger : COLORS.success}]}>
            {remaining > 0 ? `Rs. ${remaining.toFixed(2)}` : '✅ Fully Paid'}
          </Text>
        </View>
      </View>

      {/* Pay Modal */}
      <Modal
        visible={showPayModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPayModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior="padding">
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>💵 Pay Restaurant</Text>
            <Text style={styles.modalSubtitle}>{restaurantName}</Text>

            <View style={styles.modalDivider} />

            {/* Info rows */}
            <View style={styles.modalInfoRow}>
              <Text style={styles.modalInfoLabel}>Net Amount Due</Text>
              <Text style={styles.modalInfoValue}>Rs. {netAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.modalInfoRow}>
              <Text style={styles.modalInfoLabel}>Already Paid</Text>
              <Text style={[styles.modalInfoValue, {color: COLORS.success}]}>Rs. {alreadyPaid.toFixed(2)}</Text>
            </View>
            <View style={[styles.modalInfoRow, styles.modalInfoHighlight]}>
              <Text style={[styles.modalInfoLabel, {color: COLORS.text, ...FONTS.bold}]}>Remaining Balance</Text>
              <Text style={[styles.modalInfoValue, {color: remaining > 0 ? COLORS.danger : COLORS.success, ...FONTS.bold}]}>
                Rs. {remaining.toFixed(2)}
              </Text>
            </View>

            <View style={styles.modalDivider} />

            <Text style={styles.inputLabel}>Amount to Pay (max Rs. {remaining.toFixed(2)})</Text>
            <TextInput
              style={[styles.modalInput, payError ? styles.modalInputError : null]}
              value={payAmount}
              onChangeText={t => { setPayAmount(t); setPayError(''); }}
              keyboardType="numeric"
              placeholder={`Enter amount ≤ Rs. ${remaining.toFixed(2)}`}
              placeholderTextColor={COLORS.textMuted}
              autoFocus
            />
            {payError ? <Text style={styles.payErrorText}>{payError}</Text> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setShowPayModal(false)}
                disabled={payLoading}
                activeOpacity={0.7}>
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmPayBtn, payLoading && {opacity: 0.6}]}
                onPress={handlePay}
                disabled={payLoading}
                activeOpacity={0.8}>
                <Text style={styles.confirmPayBtnText}>{payLoading ? 'Saving...' : '✅ Confirm Payment'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={{color: COLORS.danger, ...FONTS.medium}}>{error}</Text>
        </View>
      )}

      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({item, index}) => (
          <CommissionCard
            item={item}
            index={index}
            commissionRate={commissionRate}
            onDelete={handleDelete}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{fontSize: 60, marginBottom: 12}}>💎</Text>
            <Text style={styles.emptyText}>No orders for this restaurant</Text>
          </View>
        }
      />
    </View>
  );
};

export default AdminRestaurantCommissionsScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  list: {padding: SIZES.padding, paddingTop: 8},
  invoiceBtn: {
    alignSelf: 'flex-end',
    marginHorizontal: SIZES.padding,
    marginTop: 10,
    marginBottom: 2,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  invoiceBtnText: {fontSize: SIZES.sm, color: COLORS.white, ...FONTS.bold},
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.padding,
    paddingBottom: 4,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 3,
    ...SHADOWS.medium,
  },
  summaryCardIcon: {fontSize: 22, marginBottom: 4},
  summaryCardLabel: {fontSize: SIZES.xs, color: COLORS.textMuted, ...FONTS.medium, marginBottom: 4, textAlign: 'center'},
  summaryCardValue: {fontSize: SIZES.sm, ...FONTS.bold, textAlign: 'center'},
  rateBadge: {
    marginTop: 5,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rateBadgeText: {fontSize: SIZES.xs, color: COLORS.primary, ...FONTS.bold},
  payBtn: {
    marginTop: 8,
    backgroundColor: COLORS.success,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  payBtnText: {fontSize: SIZES.xs, color: COLORS.white, ...FONTS.bold},
  remainingBox: {
    marginTop: 5,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  remainingLabel: {fontSize: 9, color: COLORS.textMuted, ...FONTS.medium},
  remainingValue: {fontSize: SIZES.sm, ...FONTS.bold},
  payStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    marginHorizontal: SIZES.padding,
    marginTop: 10,
    marginBottom: 4,
    borderRadius: SIZES.radius,
    paddingVertical: 10,
    paddingHorizontal: 16,
    ...SHADOWS.light,
  },
  payStatusItem: {flex: 1, alignItems: 'center'},
  payStatusLabel: {fontSize: SIZES.xs, color: COLORS.textMuted, ...FONTS.medium, marginBottom: 2},
  payStatusValue: {fontSize: SIZES.sm, ...FONTS.bold},
  payStatusDivider: {width: 1, height: 28, backgroundColor: COLORS.border},
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 24,
    width: '100%',
    maxWidth: 460,
    ...SHADOWS.large,
  },
  modalTitle: {fontSize: SIZES.lg, ...FONTS.bold, color: COLORS.text, marginBottom: 2},
  modalSubtitle: {fontSize: SIZES.sm, color: COLORS.textMuted, ...FONTS.medium, marginBottom: 12},
  modalDivider: {height: 1, backgroundColor: COLORS.border, marginVertical: 12},
  modalInfoRow: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5},
  modalInfoHighlight: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  modalInfoLabel: {fontSize: SIZES.sm, color: COLORS.textLight},
  modalInfoValue: {fontSize: SIZES.sm, ...FONTS.bold, color: COLORS.text},
  inputLabel: {fontSize: SIZES.sm, color: COLORS.textLight, ...FONTS.medium, marginBottom: 6},
  modalInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: SIZES.md,
    color: COLORS.text,
    marginBottom: 4,
  },
  modalInputError: {borderColor: COLORS.danger},
  payErrorText: {fontSize: SIZES.xs, color: COLORS.danger, ...FONTS.medium, marginBottom: 4},
  modalActions: {flexDirection: 'row', gap: 10, marginTop: 16},
  cancelModalBtn: {
    flex: 1,
    padding: 12,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelModalBtnText: {fontSize: SIZES.sm, color: COLORS.textLight, ...FONTS.semiBold},
  confirmPayBtn: {
    flex: 2,
    padding: 12,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.success,
    alignItems: 'center',
  },
  confirmPayBtnText: {fontSize: SIZES.sm, color: COLORS.white, ...FONTS.bold},
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.medium,
  },
  cardHeader: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8},
  orderId: {fontSize: SIZES.sm, ...FONTS.bold, color: COLORS.text},
  orderDate: {fontSize: SIZES.xs, color: COLORS.textMuted, ...FONTS.regular, marginTop: 2},
  deleteBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.dangerLight,
    justifyContent: 'center', alignItems: 'center',
  },
  deleteIcon: {fontSize: 16},
  divider: {height: 1, backgroundColor: COLORS.border, marginBottom: 10},
  itemsSection: {marginBottom: 10},
  itemsTitle: {fontSize: SIZES.xs, ...FONTS.bold, color: COLORS.textMuted, marginBottom: 6},
  itemRow: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4},
  itemName: {flex: 1, fontSize: SIZES.sm, color: COLORS.text, ...FONTS.medium},
  itemMeta: {fontSize: SIZES.sm, color: COLORS.textLight, ...FONTS.medium},
  detailsSection: {marginBottom: 12},
  detailRow: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5},
  detailLabel: {fontSize: SIZES.sm, color: COLORS.textLight},
  detailValue: {fontSize: SIZES.sm, ...FONTS.bold, color: COLORS.text},
  rateValue: {fontSize: SIZES.sm, ...FONTS.bold, color: COLORS.warning},
  commissionRow: {borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8, marginTop: 4},
  commissionValue: {fontSize: SIZES.base, ...FONTS.bold, color: COLORS.primary},
  netRow: {paddingTop: 6},
  netValue: {fontSize: SIZES.sm, ...FONTS.bold, color: COLORS.success},
  commissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft,
    borderRadius: SIZES.radius,
    padding: 10,
    gap: 8,
  },
  commissionIcon: {fontSize: 20},
  commissionBadgeAmount: {fontSize: SIZES.base, ...FONTS.bold, color: COLORS.primary, flex: 1},
  commissionBadgeLabel: {fontSize: SIZES.xs, color: COLORS.primary, ...FONTS.medium},
  errorBanner: {
    margin: SIZES.padding,
    padding: 12,
    backgroundColor: COLORS.dangerLight,
    borderRadius: SIZES.radius,
  },
  empty: {flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80},
  emptyText: {fontSize: SIZES.base, color: COLORS.textMuted, ...FONTS.semiBold},
});
