import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import AppHeader from '../../components/AppHeader';
import {useCart} from '../../context/CartContext';
import {placeOrder, getRestaurant} from '../../services/apiService';
import {COLORS, FONTS, SIZES, SHADOWS} from '../../utils/theme';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

// Web-safe alert helper
const showAlert = (title, message, buttons) => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 0) {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed && buttons.length > 1) {
        buttons[1]?.onPress?.();
      } else if (buttons.length === 1) {
        buttons[0]?.onPress?.();
      }
    } else {
      window.alert(`${title}\n\n${message}`);
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

const CartItemRow = ({item, index, updateQuantity, removeFromCart}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {toValue: 1, duration: 300, delay: index * 40, useNativeDriver: false}),
      Animated.timing(translateY, {toValue: 0, duration: 300, delay: index * 40, useNativeDriver: false}),
    ]).start();
  }, []);

  const lineTotal = (item.price * item.quantity).toFixed(2);

  return (
    <Animated.View style={[styles.cartItem, {opacity, transform: [{translateY}]}]}>
      {/* Item initial */}
      <View style={styles.itemAvatar}>
        <Text style={styles.itemAvatarText}>{item.name?.charAt(0)?.toUpperCase()}</Text>
      </View>

      {/* Name + price */}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemUnitPrice}>Rs. {item.price.toFixed(2)} / each</Text>
      </View>

      {/* Quantity controls */}
      <View style={styles.qtyGroup}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => updateQuantity(item.id, item.quantity - 1)}>
          <Text style={styles.qtyBtnText}>&#8722;</Text>
        </TouchableOpacity>
        <View style={styles.qtyDisplay}>
          <Text style={styles.qtyText}>{item.quantity}</Text>
        </View>
        <TouchableOpacity
          style={[styles.qtyBtn, styles.qtyBtnPlus]}
          onPress={() => updateQuantity(item.id, item.quantity + 1)}>
          <Text style={[styles.qtyBtnText, {color: '#FFF'}]}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Line total */}
      <Text style={styles.lineTotal}>Rs. {lineTotal}</Text>

      {/* Remove */}
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() => removeFromCart(item.id)}>
        <Text style={styles.removeBtnText}>&#10005;</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const CartScreen = ({navigation}) => {
  const {cartItems, restaurantId, updateQuantity, removeFromCart, clearCart, getTotal,
         activeOrderId, saveActiveOrder, clearActiveOrder} = useCart();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [deliveryPricing, setDeliveryPricing] = useState([]);
  const [selectedDeliveryFee, setSelectedDeliveryFee] = useState(0);
  const scrollRef = useRef(null);

  // Fetch restaurant delivery pricing
  useEffect(() => {
    if (restaurantId) {
      getRestaurant(restaurantId)
        .then(res => {
          const pricing = res.data.delivery_pricing || [];
          setDeliveryPricing(pricing);
          if (pricing.length > 0) {
            setSelectedDeliveryFee(pricing[0].charge || 0);
          }
        })
        .catch(() => {});
    }
  }, [restaurantId]);

  const handleProceedToCheckout = () => {
    setShowCheckout(true);
    // Scroll to bottom after form renders
    setTimeout(() => {
      scrollRef.current?.scrollToEnd?.({animated: true});
    }, 200);
  };

  const handlePlaceOrder = async () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      showAlert('Missing Info', 'Please fill in your name, phone, and delivery address.');
      return;
    }
    setLoading(true);
    try {
      const orderData = {
        restaurant_id: restaurantId,
        items: cartItems.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        customer_address: address.trim(),
      };
      const res = await placeOrder(orderData);
      await saveActiveOrder(res.data.id);
      clearCart();
      showAlert('Order Placed!', 'Your order has been submitted successfully.');
      navigation.navigate('OrderStatus', {orderId: res.data.id});
    } catch (e) {
      showAlert('Error', 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <View style={styles.container}>
        <AppHeader title="Cart" navigation={navigation} />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Text style={styles.emptyIcon}>&#128722;</Text>
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyDesc}>Add items from a restaurant to get started</Text>

          {/* Show track order if a previous order exists */}
          {activeOrderId && (
            <TouchableOpacity
              style={styles.trackOrderBtn}
              onPress={() => navigation.navigate('OrderStatus', {orderId: activeOrderId})}>
              <Text style={styles.trackOrderEmoji}>📦</Text>
              <View style={{flex: 1}}>
                <Text style={styles.trackOrderTitle}>You have an active order</Text>
                <Text style={styles.trackOrderSub}>Tap to track your order status</Text>
              </View>
              <Text style={styles.trackOrderArrow}>›</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => navigation.navigate('RestaurantList')}>
            <Text style={styles.browseBtnText}>Browse Restaurants</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const subtotal = getTotal();
  const grandTotal = subtotal + selectedDeliveryFee;

  return (
    <View style={styles.container}>
      <AppHeader title="Cart" navigation={navigation} />
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>

          {/* ── Cart Items Section ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Order Items</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartItems.length}</Text>
              </View>
            </View>
            <View style={styles.itemsList}>
              {cartItems.map((item, index) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  updateQuantity={updateQuantity}
                  removeFromCart={removeFromCart}
                />
              ))}
            </View>
          </View>

          {/* ── Order Summary ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.summaryCard}>
              {/* Subtotal */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>Rs. {subtotal.toFixed(2)}</Text>
              </View>

              {/* Delivery Fee */}
              {deliveryPricing.length > 0 ? (
                <View style={styles.deliverySection}>
                  <Text style={styles.deliverySectionLabel}>Delivery Distance</Text>
                  {deliveryPricing.map((tier, idx) => {
                    const isSelected = selectedDeliveryFee === tier.charge;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.deliveryTier, isSelected && styles.deliveryTierActive]}
                        onPress={() => setSelectedDeliveryFee(tier.charge)}>
                        <View style={[styles.radio, isSelected && styles.radioActive]}>
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                        <Text style={[styles.deliveryTierText, isSelected && styles.deliveryTierTextActive]}>
                          Up to {tier.max_distance_km} km
                        </Text>
                        <Text style={[styles.deliveryTierPrice, isSelected && styles.deliveryTierPriceActive]}>
                          Rs. {tier.charge?.toFixed(2)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery</Text>
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeText}>FREE</Text>
                  </View>
                </View>
              )}

              <View style={styles.summaryDivider} />

              {/* Grand Total */}
              <View style={styles.summaryRow}>
                <Text style={styles.grandLabel}>Total</Text>
                <Text style={styles.grandValue}>Rs. {grandTotal.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* ── Checkout Section ── */}
          {showCheckout ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Details</Text>
              <View style={styles.formCard}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor="#A8A29E"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 0300-1234567"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholderTextColor="#A8A29E"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Delivery Address</Text>
                  <TextInput
                    style={[styles.input, styles.addressInput]}
                    placeholder="Enter your full delivery address"
                    value={address}
                    onChangeText={setAddress}
                    multiline
                    numberOfLines={3}
                    placeholderTextColor="#A8A29E"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.placeOrderBtn, loading && styles.btnDisabled]}
                  onPress={handlePlaceOrder}
                  disabled={loading}
                  activeOpacity={0.85}>
                  <Text style={styles.placeOrderText}>
                    {loading ? 'Placing Order...' : 'Place Order'}
                  </Text>
                  {!loading && <Text style={styles.placeOrderArrow}>&#8594;</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={handleProceedToCheckout}
              activeOpacity={0.85}>
              <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
              <Text style={styles.checkoutBtnArrow}>&#8594;</Text>
            </TouchableOpacity>
          )}

          <View style={{height: 40}} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFFAF5'},

  scrollContent: {
    padding: 24,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },

  /* ── Section ── */
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    ...FONTS.bold,
    color: '#1C0A00',
    letterSpacing: -0.3,
  },
  badge: {
    backgroundColor: '#1C0A00',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  badgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    ...FONTS.bold,
  },

  /* ── Cart Item ── */
  itemsList: {
    gap: 10,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.small,
  },
  itemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1C0A00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemAvatarText: {
    fontSize: 16,
    color: '#FFFFFF',
    ...FONTS.bold,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    ...FONTS.semiBold,
    color: '#1C0A00',
    marginBottom: 2,
  },
  itemUnitPrice: {
    fontSize: 12,
    color: '#A8A29E',
    ...FONTS.regular,
  },
  qtyGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginRight: 14,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qtyBtnPlus: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  qtyBtnText: {
    fontSize: 16,
    color: '#57534E',
    ...FONTS.bold,
  },
  qtyDisplay: {
    paddingHorizontal: 14,
  },
  qtyText: {
    fontSize: 15,
    ...FONTS.bold,
    color: '#1C0A00',
  },
  lineTotal: {
    fontSize: 14,
    ...FONTS.bold,
    color: '#1C0A00',
    minWidth: 80,
    textAlign: 'right',
    marginRight: 10,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    fontSize: 11,
    color: '#EF4444',
    ...FONTS.bold,
  },

  /* ── Summary Card ── */
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.small,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#78716C',
    ...FONTS.regular,
  },
  summaryValue: {
    fontSize: 14,
    color: '#1C0A00',
    ...FONTS.semiBold,
  },
  freeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  freeText: {
    fontSize: 12,
    color: '#16A34A',
    ...FONTS.bold,
    letterSpacing: 0.5,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  grandLabel: {
    fontSize: 16,
    ...FONTS.bold,
    color: '#1C0A00',
  },
  grandValue: {
    fontSize: 22,
    ...FONTS.bold,
    color: COLORS.primary,
    letterSpacing: -0.5,
  },

  /* ── Delivery Tiers ── */
  deliverySection: {
    marginTop: 10,
    marginBottom: 4,
  },
  deliverySectionLabel: {
    fontSize: 12,
    color: '#A8A29E',
    ...FONTS.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  deliveryTier: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#FFFAF5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deliveryTierActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderColor: COLORS.primary,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#D6D3D1',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  deliveryTierText: {
    flex: 1,
    fontSize: 13,
    color: '#57534E',
    ...FONTS.medium,
  },
  deliveryTierTextActive: {
    color: '#1C0A00',
    ...FONTS.semiBold,
  },
  deliveryTierPrice: {
    fontSize: 13,
    color: '#78716C',
    ...FONTS.semiBold,
  },
  deliveryTierPriceActive: {
    color: COLORS.primary,
    ...FONTS.bold,
  },

  /* ── Checkout Button ── */
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C0A00',
    paddingVertical: 16,
    borderRadius: 12,
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    } : {}),
    ...SHADOWS.medium,
  },
  checkoutBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    ...FONTS.semiBold,
    letterSpacing: 0.3,
  },
  checkoutBtnArrow: {
    fontSize: 18,
    color: '#FFFFFF',
    marginLeft: 10,
    ...FONTS.bold,
  },

  /* ── Delivery Form ── */
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.small,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    color: '#78716C',
    ...FONTS.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFAF5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1C0A00',
    ...FONTS.regular,
    ...(Platform.OS === 'web' ? {outlineStyle: 'none'} : {}),
  },
  addressInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  placeOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    } : {}),
    ...SHADOWS.medium,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  placeOrderText: {
    fontSize: 16,
    color: '#FFFFFF',
    ...FONTS.semiBold,
    letterSpacing: 0.3,
  },
  placeOrderArrow: {
    fontSize: 18,
    color: '#FFFFFF',
    marginLeft: 10,
    ...FONTS.bold,
  },

  /* ── Empty State ── */
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 20,
    ...FONTS.bold,
    color: '#1C0A00',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#78716C',
    ...FONTS.regular,
    marginBottom: 24,
  },
  browseBtn: {
    backgroundColor: '#1C0A00',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
  },
  browseBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    ...FONTS.semiBold,
  },
  trackOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft || '#e8f4ea',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    maxWidth: 360,
  },
  trackOrderEmoji: {fontSize: 28, marginRight: 12},
  trackOrderTitle: {
    fontSize: SIZES.md,
    ...FONTS.bold,
    color: COLORS.primary,
    marginBottom: 2,
  },
  trackOrderSub: {fontSize: SIZES.sm, color: COLORS.textLight, ...FONTS.medium},
  trackOrderArrow: {fontSize: 26, color: COLORS.primary, fontWeight: '300'},
});

export default CartScreen;
