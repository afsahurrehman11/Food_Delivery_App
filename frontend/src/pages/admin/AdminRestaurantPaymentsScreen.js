import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Animated,
  Image,
  Linking,
} from 'react-native';
import AppHeader from '../../components/AppHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  getPayments,
  updatePayment,
  deletePayment,
  getInvoiceUrl,
} from '../../services/apiService';
import {COLORS, FONTS, SIZES, SHADOWS} from '../../utils/theme';

const showAlert = (title, message, buttons) => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) {
        const action = buttons.find(b => b.style === 'destructive' || b.text !== 'Cancel');
        if (action?.onPress) action.onPress();
      }
    } else {
      window.alert(`${title}\n\n${message}`);
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

const PaymentCard = ({item, index, onUpdatePaid, onDelete}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const [editing, setEditing] = useState(false);
  const [newPaid, setNewPaid] = useState(String(item.paid_amount || 0));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {toValue: 1, duration: 400, delay: index * 70, useNativeDriver: false}),
      Animated.timing(translateY, {toValue: 0, duration: 400, delay: index * 70, useNativeDriver: false}),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.card, {opacity, transform: [{translateY}]}]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.dateBox}>
          <Text style={styles.dateText}>{new Date(item.payment_date).toLocaleDateString()}</Text>
        </View>
        <View style={{flex: 1}} />
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete && onDelete(item.id)}
          activeOpacity={0.7}>
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* Customer */}
      {!!(item.customer_name || item.customer_phone) && (
        <View style={styles.customerBox}>
          <Text style={styles.customerTitle}>👤 Customer</Text>
          {item.customer_name ? <Text style={styles.customerText}>Name: {item.customer_name}</Text> : null}
          {item.customer_phone ? <Text style={styles.customerText}>Phone: {item.customer_phone}</Text> : null}
          {item.customer_address ? <Text style={styles.customerText}>Address: {item.customer_address}</Text> : null}
        </View>
      )}

      {/* Amounts */}
      <View style={styles.row}>
        <Text style={styles.label}>Total Amount</Text>
        <Text style={styles.value}>Rs. {(item.total_amount || 0).toFixed(2)}</Text>
      </View>
      <View style={[styles.row, styles.paidRow]}>
        <Text style={styles.label}>Paid to Restaurant</Text>
        <Text style={[styles.value, {color: COLORS.success}]}>Rs. {(item.paid_amount || 0).toFixed(2)}</Text>
      </View>

      {/* Receipt image */}
      {!!item.receipt_image && (
        <View style={styles.receiptBox}>
          <Text style={styles.receiptLabel}>📸 Payment Receipt</Text>
          <Image
            source={{uri: `data:image/jpeg;base64,${item.receipt_image}`}}
            style={styles.receiptImage}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Edit paid amount */}
      {editing ? (
        <View style={styles.editRow}>
          <TextInput
            style={styles.editInput}
            value={newPaid}
            onChangeText={setNewPaid}
            keyboardType="numeric"
            placeholder="New paid amount"
            placeholderTextColor={COLORS.textMuted}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={() => {
            const val = parseFloat(newPaid);
            if (isNaN(val) || val < 0) { showAlert('Error', 'Enter a valid amount.'); return; }
            onUpdatePaid(item.id, val);
            setEditing(false);
          }}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
            <Text style={styles.cancelBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.updateBtn}
          onPress={() => { setNewPaid(String(item.paid_amount || 0)); setEditing(true); }}
          activeOpacity={0.7}>
          <Text style={styles.updateBtnText}>💰 Update Paid Amount</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const AdminRestaurantPaymentsScreen = ({navigation, route}) => {
  const restaurantId = route?.params?.restaurantId;
  const restaurantName = route?.params?.restaurantName || 'Restaurant';

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);
      const res = await getPayments();
      const all = res.data || [];
      setPayments(all.filter(p => p.restaurant_id === restaurantId));
    } catch (e) {
      setError('Failed to load payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [restaurantId]);

  const handleUpdatePaid = async (paymentId, newAmount) => {
    try {
      await updatePayment(paymentId, {paid_amount: newAmount});
      fetchData();
      showAlert('Success', 'Payment updated!');
    } catch (e) {
      showAlert('Error', 'Failed to update payment.');
    }
  };

  const handleDelete = async paymentId => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Delete this payment record? This cannot be undone.')
      : await new Promise(resolve => {
          Alert.alert('Delete', 'Delete this payment? Cannot be undone.', [
            {text: 'Cancel', style: 'cancel', onPress: () => resolve(false)},
            {text: 'Delete', style: 'destructive', onPress: () => resolve(true)},
          ]);
        });
    if (!confirmed) return;
    try {
      await deletePayment(paymentId);
      setPayments(prev => prev.filter(p => p.id !== paymentId));
    } catch (e) {
      showAlert('Error', 'Failed to delete payment.');
    }
  };

  const handleInvoice = async () => {
    try {
      const url = await getInvoiceUrl(restaurantId);
      if (Platform.OS === 'web') window.open(url, '_blank');
      else Linking.openURL(url);
    } catch (e) {
      showAlert('Error', 'Failed to generate invoice.');
    }
  };

  if (loading) return <LoadingSpinner />;

  const totalAmount = payments.reduce((s, p) => s + (p.total_amount || 0), 0);
  const totalPaid = payments.reduce((s, p) => s + (p.paid_amount || 0), 0);

  return (
    <View style={styles.container}>
      <AppHeader title={restaurantName} navigation={navigation} showBack />

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Orders</Text>
          <Text style={styles.summaryValue}>Rs. {totalAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Paid to Restaurant</Text>
          <Text style={[styles.summaryValue, {color: COLORS.success}]}>Rs. {totalPaid.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <TouchableOpacity style={styles.invoiceBtn} onPress={handleInvoice} activeOpacity={0.8}>
          <Text style={styles.invoiceBtnText}>📄 Invoice</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={{color: COLORS.danger, ...FONTS.medium}}>{error}</Text>
        </View>
      )}

      <FlatList
        data={payments}
        keyExtractor={p => p.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({item, index}) => (
          <PaymentCard
            item={item}
            index={index}
            onUpdatePaid={handleUpdatePaid}
            onDelete={handleDelete}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{fontSize: 60, marginBottom: 12}}>💳</Text>
            <Text style={styles.emptyText}>No payments for this restaurant</Text>
          </View>
        }
      />
    </View>
  );
};

export default AdminRestaurantPaymentsScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  list: {padding: SIZES.padding, paddingTop: 8},
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    margin: SIZES.padding,
    marginBottom: 4,
    borderRadius: SIZES.radiusLg,
    padding: 14,
    ...SHADOWS.medium,
  },
  summaryItem: {flex: 1, alignItems: 'center'},
  summaryLabel: {fontSize: SIZES.xs, color: COLORS.textMuted, ...FONTS.medium, marginBottom: 2},
  summaryValue: {fontSize: SIZES.sm, ...FONTS.bold, color: COLORS.text},
  summaryDivider: {width: 1, height: 36, backgroundColor: COLORS.border, marginHorizontal: 6},
  invoiceBtn: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.radius,
    marginLeft: 6,
  },
  invoiceBtnText: {fontSize: SIZES.xs, color: COLORS.primary, ...FONTS.bold},
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.medium,
  },
  cardHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 6},
  dateBox: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: SIZES.radius,
  },
  dateText: {fontSize: SIZES.xs, color: COLORS.primary, ...FONTS.bold},
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {fontSize: 16},
  divider: {height: 1, backgroundColor: COLORS.border, marginBottom: 10},
  customerBox: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    marginBottom: 10,
  },
  customerTitle: {fontSize: SIZES.xs, ...FONTS.bold, color: COLORS.textMuted, marginBottom: 4},
  customerText: {fontSize: SIZES.sm, color: COLORS.text, ...FONTS.medium, marginBottom: 2},
  row: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4},
  paidRow: {marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border},
  label: {fontSize: SIZES.sm, color: COLORS.textLight},
  value: {fontSize: SIZES.sm, ...FONTS.bold, color: COLORS.text},
  receiptBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: COLORS.primarySoft,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  receiptLabel: {fontSize: SIZES.xs, ...FONTS.bold, color: COLORS.text, marginBottom: 8},
  receiptImage: {width: '100%', height: 160, borderRadius: 8},
  editRow: {flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8},
  editInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: SIZES.md,
    color: COLORS.text,
  },
  saveBtn: {backgroundColor: COLORS.success, paddingHorizontal: 14, paddingVertical: 9, borderRadius: SIZES.radius},
  saveBtnText: {color: COLORS.white, ...FONTS.bold, fontSize: SIZES.sm},
  cancelBtn: {backgroundColor: COLORS.dangerLight, paddingHorizontal: 10, paddingVertical: 9, borderRadius: SIZES.radius},
  cancelBtnText: {color: COLORS.danger, ...FONTS.bold, fontSize: SIZES.sm},
  updateBtn: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: COLORS.secondarySoft,
    borderRadius: SIZES.radius,
  },
  updateBtnText: {fontSize: SIZES.xs, color: COLORS.secondary, ...FONTS.bold},
  errorBanner: {
    margin: SIZES.padding,
    padding: 12,
    backgroundColor: COLORS.dangerLight,
    borderRadius: SIZES.radius,
  },
  empty: {flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80},
  emptyText: {fontSize: SIZES.base, color: COLORS.textMuted, ...FONTS.semiBold},
});
