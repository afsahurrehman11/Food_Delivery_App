import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Platform,
  TextInput,
  Image,
} from 'react-native';
import AppHeader from '../../components/AppHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import {getRestaurants, getRestaurantImageUrl} from '../../services/apiService';
import {useCart} from '../../context/CartContext';
import {COLORS, FONTS, SIZES, SHADOWS} from '../../utils/theme';

const CUISINE_ICONS = ['P', 'B', 'K', 'S', 'G', 'M', 'T', 'R', 'C', 'D'];
const ACCENT_COLORS = [
  '#2E1800', '#44403C', '#57534E', '#1E3A5F',
  '#1B4332', '#3C1642', '#4A2545', '#2D3436',
  '#192A56', '#2C3E50',
];

const GAP = 20;
const getScreenWidth = () => Dimensions.get('window').width;
const getCardWidth = (screenW) => {
  const w = screenW || getScreenWidth();
  if (Platform.OS === 'web') {
    if (w >= 1280) return `calc(25% - ${GAP * 3 / 4}px)`;
    if (w >= 960)  return `calc(33.333% - ${GAP * 2 / 3}px)`;
    if (w >= 640)  return `calc(50% - ${GAP / 2}px)`;
  }
  return '100%';
};

const RestaurantCard = ({item, index, onPress, screenWidth}) => {
  const [hovered, setHovered] = useState(false);

  const initial = item.name?.charAt(0)?.toUpperCase() || CUISINE_ICONS[index % CUISINE_ICONS.length];
  const accentColor = ACCENT_COLORS[index % ACCENT_COLORS.length];

  const webHoverProps = Platform.OS === 'web' ? {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  } : {};

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.cardWrapper, {width: getCardWidth(screenWidth)}]}
      {...webHoverProps}>
      <View
        style={[
          styles.card,
          hovered && styles.cardHovered,
        ]}>
        {/* Top accent line */}
        <View style={[styles.accentLine, {backgroundColor: COLORS.primary}]} />

        {/* Restaurant Image Area */}
        <View style={styles.imageContainer}>
          {item.has_image ? (
            <Image source={{uri: getRestaurantImageUrl(item.id)}} style={styles.restaurantImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderIcon}>🍽️</Text>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
        </View>

        <View style={styles.cardInner}>
          {/* Left: Avatar */}
          <View style={[styles.avatar, {backgroundColor: accentColor}]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>

          {/* Right: Content */}
          <View style={styles.cardContent}>
            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>&#x2022;</Text>
              <Text style={styles.metaLabel}>Location</Text>
            </View>
            <Text style={styles.metaValue} numberOfLines={1}>{item.address}</Text>

            {item.phone ? (
              <>
                <View style={[styles.metaRow, {marginTop: 6}]}>
                  <Text style={styles.metaIcon}>&#x2022;</Text>
                  <Text style={styles.metaLabel}>Contact</Text>
                </View>
                <Text style={styles.metaValue}>{item.phone}</Text>
              </>
            ) : null}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Open Now</Text>
          </View>
          <View style={[styles.viewBtn, hovered && styles.viewBtnHovered]}>
            <Text style={[styles.viewBtnText, hovered && styles.viewBtnTextHovered]}>
              View Menu
            </Text>
            <Text style={[styles.viewBtnArrow, hovered && styles.viewBtnTextHovered]}>
              &#8594;
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const RestaurantListScreen = ({navigation}) => {
  const {activeOrderId, clearActiveOrder, getItemCount, cartItems} = useCart();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [screenWidth, setScreenWidth] = useState(getScreenWidth());

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({window}) => {
      setScreenWidth(window.width);
    });
    return () => sub?.remove?.();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const res = await getRestaurants();
      // Deduplicate by name (case-insensitive) — keeps first occurrence
      const seen = new Set();
      const unique = (res.data || []).filter(r => {
        const key = (r.name || '').toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setRestaurants(unique);
    } catch (e) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRestaurants();
  };

  const filteredRestaurants = restaurants.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.address && r.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <AppHeader
        title="Restaurants"
        navigation={navigation}
        showBack={true}
      />

      {/* Search & Stats Bar */}
      <View style={styles.toolbar}>
        <View style={styles.toolbarInner}>
          <View style={styles.toolbarLeft}>
            <Text style={styles.toolbarTitle}>Browse Restaurants</Text>
            <Text style={styles.toolbarCount}>
              {restaurants.length} available
            </Text>
          </View>

          <View style={styles.searchBox}>
            <Text style={styles.searchIconText}>&#128269;</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or location..."
              placeholderTextColor="#A8A29E"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>&#10005;</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* ── Persistent Banners ── */}

      {/* Track active order */}
      {activeOrderId && (
        <View style={styles.bannerContainer}>
          <TouchableOpacity
            style={styles.trackBanner}
            onPress={() => navigation.navigate('OrderStatus', {orderId: activeOrderId})}
            activeOpacity={0.85}>
            <Text style={styles.bannerEmoji}>📦</Text>
            <View style={{flex: 1}}>
              <Text style={styles.bannerTitle}>Order in progress</Text>
              <Text style={styles.bannerSub}>Tap to track your order status</Text>
            </View>
            <Text style={styles.bannerArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={clearActiveOrder}
            activeOpacity={0.7}>
            <Text style={styles.dismissText}>×</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Cart reminder if items in cart but no active order */}
      {!activeOrderId && cartItems.length > 0 && (
        <TouchableOpacity
          style={styles.cartBanner}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.85}>
          <Text style={styles.bannerEmoji}>🛒</Text>
          <View style={{flex: 1}}>
            <Text style={styles.bannerTitle}>
              {getItemCount()} item{getItemCount() !== 1 ? 's' : ''} in your cart
            </Text>
            <Text style={styles.bannerSub}>Tap to review and checkout</Text>
          </View>
          <Text style={styles.bannerArrow}>›</Text>
        </TouchableOpacity>
      )}

      {filteredRestaurants.length === 0 && searchQuery.length > 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <Text style={styles.emptyIcon}>&#128269;</Text>
          </View>
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptyDesc}>
            No restaurants match "{searchQuery}"
          </Text>
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.emptyBtn}>
            <Text style={styles.emptyBtnText}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      ) : filteredRestaurants.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <Text style={styles.emptyIcon}>&#127860;</Text>
          </View>
          <Text style={styles.emptyTitle}>No restaurants yet</Text>
          <Text style={styles.emptyDesc}>
            Pull down to refresh and check again
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }>
          {searchQuery.length > 0 && (
            <Text style={styles.resultsLabel}>
              Showing {filteredRestaurants.length} result{filteredRestaurants.length !== 1 ? 's' : ''}
            </Text>
          )}

          <View style={styles.grid}>
            {filteredRestaurants.map((item, index) => (
              <RestaurantCard
                key={item.id}
                item={item}
                index={index}
                screenWidth={screenWidth}
                onPress={() =>
                  navigation.navigate('Menu', {
                    restaurantId: item.id,
                    restaurantName: item.name,
                  })
                }
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFAF5',
  },

  /* ── Toolbar ── */
  toolbar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  toolbarInner: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    alignItems: Platform.OS === 'web' ? 'center' : 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 14,
  },
  toolbarLeft: {
  },
  toolbarTitle: {
    fontSize: 20,
    ...FONTS.bold,
    color: '#2E1800',
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  toolbarCount: {
    fontSize: 13,
    color: '#57534E',
    ...FONTS.regular,
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'web' ? 10 : 8,
    minWidth: Platform.OS === 'web' ? 280 : undefined,
    flex: Platform.OS === 'web' ? 1 : undefined,
    maxWidth: Platform.OS === 'web' ? 400 : undefined,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIconText: {
    fontSize: 14,
    marginRight: 10,
    opacity: 0.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2E1800',
    ...FONTS.regular,
    ...(Platform.OS === 'web' ? {outlineStyle: 'none'} : {}),
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D6D3D1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  clearBtnText: {
    fontSize: 10,
    color: '#57534E',
    ...FONTS.bold,
  },

  /* ── Grid ── */
  scrollContent: {
    padding: 24,
    maxWidth: 1328,
    width: '100%',
    alignSelf: 'center',
  },
  resultsLabel: {
    fontSize: 13,
    color: '#78716C',
    ...FONTS.medium,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },

  /* ── Card ── */
  cardWrapper: {
    marginBottom: Platform.OS === 'web' ? 0 : 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...(Platform.OS === 'web' ? {
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
    } : {}),
    ...SHADOWS.small,
  },
  cardHovered: {
    borderColor: COLORS.primary,
    ...(Platform.OS === 'web' ? {
      transform: [{translateY: -6}],
      boxShadow: '0px 8px 24px rgba(249,115,22,0.15)',
      elevation: 12,
    } : {}),
  },
  accentLine: {
    height: 3,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  placeholderIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  placeholderText: {
    fontSize: 12,
    color: '#A8A29E',
    ...FONTS.medium,
  },
  cardInner: {
    flexDirection: 'row',
    padding: 18,
    paddingBottom: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 20,
    color: '#FFFFFF',
    ...FONTS.bold,
    letterSpacing: 0.5,
  },
  cardContent: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    ...FONTS.semiBold,
    color: '#1C0A00',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 8,
    color: COLORS.primary,
    marginRight: 6,
  },
  metaLabel: {
    fontSize: 11,
    color: '#A8A29E',
    ...FONTS.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metaValue: {
    fontSize: 13,
    color: '#57534E',
    ...FONTS.regular,
    marginLeft: 14,
    marginTop: 1,
  },

  /* ── Footer ── */
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFBFC',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#16A34A',
    ...FONTS.medium,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...(Platform.OS === 'web' ? {
      transition: 'all 0.2s ease',
    } : {}),
  },
  viewBtnHovered: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  viewBtnText: {
    fontSize: 12,
    color: '#57534E',
    ...FONTS.semiBold,
    letterSpacing: 0.2,
  },
  viewBtnTextHovered: {
    color: '#FFFFFF',
  },
  viewBtnArrow: {
    fontSize: 13,
    color: '#57534E',
    marginLeft: 6,
  },

  /* ── Empty ── */
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 18,
    ...FONTS.semiBold,
    color: '#1C0A00',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#78716C',
    ...FONTS.regular,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  emptyBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    ...FONTS.semiBold,
  },

  /* ── Banner styles ── */
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SIZES.padding,
    marginBottom: 8,
    gap: 6,
  },
  trackBanner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft || '#e6f4ea',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  cartBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    borderWidth: 1.5,
    borderColor: COLORS.warning || '#F59E0B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: SIZES.padding,
    marginBottom: 8,
    gap: 10,
  },
  bannerEmoji: {fontSize: 24},
  bannerTitle: {
    fontSize: SIZES.sm,
    ...FONTS.bold,
    color: COLORS.text,
    marginBottom: 1,
  },
  bannerSub: {fontSize: SIZES.xs, color: COLORS.textLight, ...FONTS.medium},
  bannerArrow: {fontSize: 24, color: COLORS.textMuted},
  dismissBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightGrey || '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {fontSize: 16, color: COLORS.textMuted, fontWeight: '600'},
});

export default RestaurantListScreen;
