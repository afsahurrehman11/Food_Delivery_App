import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  Platform,
  Image,
} from 'react-native';
import AppHeader from '../../components/AppHeader';
import AppButton from '../../components/AppButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import {getOrder, updateOrderStatus, uploadPaymentReceipt} from '../../services/apiService';
import {useAuth} from '../../context/AuthContext';
import {COLORS, FONTS, SIZES, SHADOWS} from '../../utils/theme';

/* Web-safe alert helper */
const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const AnimatedSection = ({children, delay = 0, style}) => {
  return (
    <View style={style}>
      {children}
    </View>
  );
};

const RiderOrderDetailScreen = ({route, navigation}) => {
  const {orderId} = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showingReceipt, setShowingReceipt] = useState(false);
  const [receiptImage, setReceiptImage] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const successScale = useRef(new Animated.Value(1)).current;
  const {user} = useAuth();

  const fetchOrder = async () => {
    try {
      const res = await getOrder(orderId);
      setOrder(res.data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Poll every 5 seconds so status stays in sync with backend
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusUpdate = async statusField => {
    setUpdating(true);
    try {
      const res = await updateOrderStatus(orderId, {[statusField]: true});
      setOrder(res.data);
      // Pulse animation on success
      Animated.sequence([
        Animated.spring(successScale, {toValue: 1.05, friction: 3, useNativeDriver: false}),
        Animated.spring(successScale, {toValue: 1, friction: 5, useNativeDriver: false}),
      ]).start();
      showAlert('Success', 'Order status updated!');
    } catch (e) {
      showAlert('Error', 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleUploadReceipt = () => {
    // Ensure current user is a rider and we have a token
    if (!user || user.role !== 'rider') {
      showAlert('Not Authorized', 'You must be logged in as a rider to upload a receipt. Please log in using the Rider option.');
      console.warn('Upload blocked: current user is not rider', user);
      return;
    }
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            setUploadingReceipt(true);
            const base64 = event.target.result.split(',')[1]; // Remove data:image/... prefix
            
            // Upload receipt and automatically create payment record
            console.log('Uploading receipt for order', orderId, 'by user', user?.id || user?.user_id || user?.name);
            const response = await uploadPaymentReceipt(orderId, base64);
            
            setReceiptImage(base64);
            setShowingReceipt(true);
            showAlert('✅ Success!', 'Payment record created automatically in admin view with receipt proof.');
          } catch (e) {
            showAlert('Error', 'Failed to upload receipt. Please try again.');
            console.error(e);
          } finally {
            setUploadingReceipt(false);
          }
        };
        reader.readAsDataURL(file);
      };
      input.click();
    } else {
      showAlert('Receipt', 'Please capture payment receipt screenshot and upload it.');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!order) {
    return (
      <View style={styles.container}>
        <AppHeader title="Order Detail" navigation={navigation} />
        <View style={styles.center}>
          <Text style={{fontSize: 50, marginBottom: 12}}>📋</Text>
          <Text style={styles.errorText}>Order not found</Text>
        </View>
      </View>
    );
  }

  const status = order.status || {};

  const getStatusInfo = () => {
    if (status.rider_left) return {text: 'On the Way', color: COLORS.secondary, icon: '🏍️'};
    if (status.preparing) return {text: 'Preparing', color: COLORS.warning, icon: '🍳'};
    if (status.confirmed) return {text: 'Confirmed', color: COLORS.success, icon: '✅'};
    return {text: 'Pending', color: COLORS.textMuted, icon: '⏳'};
  };

  const statusInfo = getStatusInfo();

  return (
    <View style={styles.container}>
      <AppHeader
        title={`Order #${orderId.slice(-6).toUpperCase()}`}
        navigation={navigation}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Header */}
        <AnimatedSection delay={0} style={styles.statusCard}>
          <Text style={styles.statusEmoji}>{statusInfo.icon}</Text>
          <View style={[styles.statusPill, {backgroundColor: statusInfo.color}]}>
            <Text style={styles.statusText}>{statusInfo.text}</Text>
          </View>
        </AnimatedSection>

        {/* Customer Info */}
        <AnimatedSection delay={100} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>👤</Text>
            <Text style={styles.sectionTitle}>Customer</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{order.customer_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{order.customer_phone}</Text>
          </View>
          <View style={[styles.infoRow, {borderBottomWidth: 0}]}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={[styles.infoValue, {flex: 1, textAlign: 'right'}]}>
              {order.customer_address}
            </Text>
          </View>
        </AnimatedSection>

        {/* Restaurant */}
        {order.restaurant_name && (
          <AnimatedSection delay={200} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🏪</Text>
              <Text style={styles.sectionTitle}>Restaurant</Text>
            </View>
            <Text style={styles.restaurantName}>{order.restaurant_name}</Text>
          </AnimatedSection>
        )}

        {/* Items */}
        <AnimatedSection delay={300} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🛍️</Text>
            <Text style={styles.sectionTitle}>Order Items</Text>
          </View>
          {order.items?.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <View style={styles.qtyBadge}>
                <Text style={styles.qtyText}>{item.quantity}x</Text>
              </View>
              <Text style={styles.itemText}>Item</Text>
              <Text style={styles.itemPrice}>
                Rs. {(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>
              Rs. {order.total_amount?.toFixed(2)}
            </Text>
          </View>
        </AnimatedSection>

        {/* Status Actions */}
        <Animated.View style={{transform: [{scale: successScale}]}}>
          <AnimatedSection delay={400} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🚀</Text>
              <Text style={styles.sectionTitle}>Update Status</Text>
            </View>
            {!status.confirmed && (
              <AppButton
                title="✓  Mark as Confirmed"
                onPress={() => handleStatusUpdate('confirmed')}
                loading={updating}
                variant="secondary"
                style={{marginBottom: 10}}
              />
            )}
            {status.confirmed && !status.preparing && (
              <AppButton
                title="🍳  Mark as Preparing"
                onPress={() => handleStatusUpdate('preparing')}
                loading={updating}
                variant="secondary"
                style={{marginBottom: 10}}
              />
            )}
            {status.preparing && !status.rider_left && (
              <AppButton
                title="🏍️  Mark as Rider Left"
                onPress={() => handleStatusUpdate('rider_left')}
                loading={updating}
                style={{marginBottom: 10}}
              />
            )}
            {status.rider_left && !status.delivered && (
              <AppButton
                title="✅  Mark as Delivered"
                onPress={() => handleStatusUpdate('delivered')}
                loading={updating}
                style={{marginBottom: 10}}
              />
            )}
            {status.delivered && (
              <>
                <View style={styles.completedBanner}>
                  <Text style={styles.completedEmoji}>🎉</Text>
                  <Text style={styles.completedText}>Order Delivered!</Text>
                </View>
                <AppButton
                  title="📸  Upload Payment Receipt"
                  onPress={handleUploadReceipt}
                  loading={uploadingReceipt}
                  variant="secondary"
                  style={{marginTop: 12}}
                />
                {receiptImage && showingReceipt && (
                  <View style={styles.receiptPreview}>
                    <Text style={styles.receiptLabel}>📷 Receipt Proof:</Text>
                    <Image
                      source={{uri: `data:image/jpeg;base64,${receiptImage}`}}
                      style={styles.receiptImage}
                    />
                  </View>
                )}
              </>
            )}
          </AnimatedSection>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  content: {padding: SIZES.padding, paddingBottom: 30},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  errorText: {fontSize: SIZES.base, color: COLORS.danger, ...FONTS.semiBold},
  statusCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 20,
    marginBottom: 14,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  statusEmoji: {fontSize: 40, marginBottom: 10},
  statusPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {color: COLORS.white, ...FONTS.bold, fontSize: SIZES.sm},
  section: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 18,
    marginBottom: 14,
    ...SHADOWS.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionIcon: {fontSize: 18, marginRight: 8},
  sectionTitle: {
    fontSize: SIZES.base,
    ...FONTS.bold,
    color: COLORS.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {fontSize: SIZES.sm, color: COLORS.textMuted, ...FONTS.medium},
  infoValue: {fontSize: SIZES.sm, color: COLORS.text, ...FONTS.semiBold},
  restaurantName: {fontSize: SIZES.md, color: COLORS.text, ...FONTS.semiBold},
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  qtyBadge: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 10,
  },
  qtyText: {fontSize: SIZES.xs, color: COLORS.primary, ...FONTS.bold},
  itemText: {fontSize: SIZES.md, color: COLORS.text, flex: 1},
  itemPrice: {fontSize: SIZES.md, color: COLORS.text, ...FONTS.semiBold},
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
    marginTop: 4,
  },
  totalLabel: {fontSize: SIZES.base, ...FONTS.bold, color: COLORS.text},
  totalValue: {fontSize: SIZES.lg, ...FONTS.bold, color: COLORS.primary},
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.successLight,
    borderRadius: SIZES.radius,
    padding: 14,
  },
  completedEmoji: {fontSize: 20, marginRight: 8},
  completedText: {
    fontSize: SIZES.base,
    color: COLORS.success,
    ...FONTS.bold,
  },
  receiptPreview: {
    marginTop: 14,
    padding: 12,
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  receiptLabel: {fontSize: SIZES.sm, ...FONTS.bold, color: COLORS.text, marginBottom: 10},
  receiptImage: {width: '100%', height: 200, borderRadius: 8, resizeMode: 'contain'},
});

export default RiderOrderDetailScreen;
