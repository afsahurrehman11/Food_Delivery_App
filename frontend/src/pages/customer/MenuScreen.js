import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  StyleSheet,
  RefreshControl,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import AppHeader from '../../components/AppHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import {getMenuItems, getMenuItemImageUrl, getRestaurant} from '../../services/apiService';
import {useCart} from '../../context/CartContext';
import {COLORS, FONTS, SIZES, SHADOWS} from '../../utils/theme';

const GRID_GAP = 20;
const getScreenWidth = () => Dimensions.get('window').width;
const getCardWidth = (screenW) => {
  const w = screenW || getScreenWidth();
  if (Platform.OS === 'web') {
    if (w >= 1280) return `calc(25% - ${GRID_GAP * 3 / 4}px)`;
    if (w >= 960)  return `calc(33.333% - ${GRID_GAP * 2 / 3}px)`;
    if (w >= 640)  return `calc(50% - ${GRID_GAP / 2}px)`;
  }
  return '100%';
};

const MenuItemCard = ({item, index, onAddToCart, screenWidth}) => {
  const [hovered, setHovered] = useState(false);
  const addBtnScale = useRef(new Animated.Value(1)).current;

  const handleAdd = () => {
    Animated.sequence([
      Animated.timing(addBtnScale, {
        toValue: 1.15,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.spring(addBtnScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: false,
      }),
    ]).start();
    onAddToCart(item);
  };

  const webHoverProps = Platform.OS === 'web' ? {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  } : {};

  return (
    <View style={[styles.cardWrapper, {width: getCardWidth(screenWidth)}]} {...webHoverProps}>
      <View
        style={[
          styles.card,
          hovered && styles.cardHovered,
        ]}>
        {/* Image Section */}
        <View style={styles.imageContainer}>
          {item.has_image ? (
            <Image
              source={{uri: getMenuItemImageUrl(item.id)}}
              style={styles.dishImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.dishImage, styles.placeholderImage]}>
              <View style={styles.placeholderInner}>
                <Text style={styles.placeholderIcon}>&#127860;</Text>
                <Text style={styles.placeholderText}>No Photo</Text>
              </View>
            </View>
          )}
          {/* Category tag */}
          {item.category ? (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{item.category}</Text>
            </View>
          ) : null}
          {/* Hover overlay on image */}
          {hovered && (
            <View style={styles.imageOverlay}>
              <Text style={styles.imageOverlayText}>View Details</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.cardBody}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
          ) : (
            <Text style={styles.itemDescEmpty}>Freshly prepared dish</Text>
          )}

          {/* Footer: Price + Add button */}
          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.priceValue}>Rs. {item.price.toFixed(2)}</Text>
            </View>
            <TouchableWithoutFeedback onPress={handleAdd}>
              <Animated.View
                style={[
                  styles.addBtn,
                  hovered && styles.addBtnHovered,
                  {transform: [{scale: addBtnScale}]},
                ]}>
                <Text style={styles.addBtnPlus}>+</Text>
                <Text style={styles.addBtnLabel}>Add</Text>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      </View>
    </View>
  );
};

const MenuScreen = ({route, navigation}) => {
  const {restaurantId, restaurantName} = route.params;
  const [menuItems, setMenuItems] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const {addToCart, getItemCount} = useCart();
  const floatingAnim = useRef(new Animated.Value(0)).current;
  const [screenWidth, setScreenWidth] = useState(getScreenWidth());

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({window}) => {
      setScreenWidth(window.width);
    });
    return () => sub?.remove?.();
  }, []);

  const fetchData = async () => {
    try {
      const [menuRes, restRes] = await Promise.all([
        getMenuItems(restaurantId),
        getRestaurant(restaurantId),
      ]);
      setMenuItems(menuRes.data);
      setRestaurant(restRes.data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (getItemCount() > 0) {
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.spring(floatingAnim, {
          toValue: 1,
          friction: 3,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [getItemCount()]);

  const categories = ['All', ...new Set(menuItems.map(i => i.category))];

  const filteredItems =
    selectedCategory === 'All'
      ? menuItems
      : menuItems.filter(i => i.category === selectedCategory);

  const handleAddToCart = item => {
    addToCart(item, restaurantId);
  };

  if (loading) return <LoadingSpinner />;

  const cartCount = getItemCount();

  return (
    <View style={styles.container}>
      <AppHeader
        title={restaurantName}
        navigation={navigation}
        rightComponent={
          <TouchableOpacity
            onPress={() => navigation.navigate('Cart')}
            style={styles.cartHeaderBtn}>
            <Text style={styles.cartIcon}>&#128722;</Text>
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />

      {/* Restaurant Info Bar */}
      {restaurant && (
        <View style={styles.restBar}>
          <View style={styles.restBarInner}>
            <View style={styles.restInfoItem}>
              <Text style={styles.restInfoIcon}>&#128205;</Text>
              <Text style={styles.restInfoText}>{restaurant.address}</Text>
            </View>
            {restaurant.phone ? (
              <View style={styles.restInfoItem}>
                <Text style={styles.restInfoIcon}>&#128222;</Text>
                <Text style={styles.restInfoText}>{restaurant.phone}</Text>
              </View>
            ) : null}
            <View style={styles.restInfoItem}>
              <View style={styles.openDot} />
              <Text style={styles.openText}>Open Now</Text>
            </View>
          </View>
        </View>
      )}

      {/* Category Filter Tabs */}
      <View style={styles.categoryBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}>
          {categories.map(cat => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}>
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {cat}
                </Text>
                {isActive && <View style={styles.categoryDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={styles.itemCount}>
          <Text style={styles.itemCountText}>{filteredItems.length} items</Text>
        </View>
      </View>

      {/* Menu Grid */}
      {filteredItems.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconWrap}>
            <Text style={styles.emptyIcon}>&#127860;</Text>
          </View>
          <Text style={styles.emptyTitle}>No items found</Text>
          <Text style={styles.emptyDesc}>Try selecting a different category</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {filteredItems.map((item, index) => (
              <MenuItemCard
                key={item.id}
                item={item}
                index={index}
                screenWidth={screenWidth}
                onAddToCart={handleAddToCart}
              />
            ))}
          </View>
        </ScrollView>
      )}

      {/* Floating Cart */}
      {cartCount > 0 && (
        <Animated.View
          style={[
            styles.floatingCartWrap,
            {
              opacity: floatingAnim,
              transform: [
                {
                  translateY: floatingAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [60, 0],
                  }),
                },
              ],
            },
          ]}>
          <TouchableWithoutFeedback onPress={() => navigation.navigate('Cart')}>
            <View style={styles.floatingCart}>
              <View style={styles.floatingCartLeft}>
                <View style={styles.floatingCartBadge}>
                  <Text style={styles.floatingCartBadgeText}>{cartCount}</Text>
                </View>
                <Text style={styles.floatingCartText}>View Cart</Text>
              </View>
              <Text style={styles.floatingCartArrow}>&#8594;</Text>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFFAF5'},

  /* ── Restaurant Info Bar ── */
  restBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  restBarInner: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 24,
  },
  restInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restInfoIcon: {
    fontSize: 14,
    marginRight: 6,
    opacity: 0.6,
  },
  restInfoText: {
    fontSize: 13,
    color: '#57534E',
    ...FONTS.regular,
  },
  openDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  openText: {
    fontSize: 13,
    color: '#16A34A',
    ...FONTS.medium,
  },

  /* ── Category Bar ── */
  categoryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 0,
    paddingLeft: 24,
    paddingRight: 16,
  },
  categoryScroll: {
    paddingVertical: 14,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: 'transparent',
    position: 'relative',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? {
      transition: 'all 0.25s ease',
      cursor: 'pointer',
    } : {}),
  },
  categoryChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  categoryText: {
    fontSize: 14,
    color: '#78716C',
    ...FONTS.semiBold,
  },
  categoryTextActive: {
    color: COLORS.primary,
    ...FONTS.bold,
  },
  categoryDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.primary,
    marginTop: 5,
  },
  itemCount: {
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    marginLeft: 'auto',
  },
  itemCountText: {
    fontSize: 12,
    color: '#A8A29E',
    ...FONTS.medium,
  },

  /* ── Grid ── */
  gridContainer: {
    padding: 28,
    paddingBottom: 100,
    maxWidth: 1328,
    width: '100%',
    alignSelf: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },

  /* ── Card ── */
  cardWrapper: {
    marginBottom: 0,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0,
    borderColor: 'transparent',
    boxShadow: '0px 4px 12px rgba(15,23,42,0.08)',
    elevation: 3,
    ...(Platform.OS === 'web' ? {
      transition: 'all 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)',
      cursor: 'pointer',
      boxShadow: '0 2px 12px rgba(15, 23, 42, 0.08)',
    } : {}),
  },
  cardHovered: {
    ...(Platform.OS === 'web' ? {
      transform: [{translateY: -12}],
      boxShadow: '0 12px 32px rgba(16, 185, 129, 0.2), 0 0 0 1px rgba(16, 185, 129, 0.2)',
      elevation: 8,
    } : {}),
  },

  /* ── Card Body ── */
  cardBody: {
    padding: 12,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },

  /* ── Image ── */
  imageContainer: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#FFFAF5',
  },
  dishImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#FFFAF5',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderInner: {
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 48,
    opacity: 0.25,
  },
  placeholderText: {
    fontSize: 13,
    color: '#D6D3D1',
    ...FONTS.medium,
    marginTop: 8,
    fontWeight: '500',
  },
  categoryTag: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: '#1C0A00',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 0,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.3)',
    } : {}),
  },
  categoryTagText: {
    fontSize: 12,
    color: '#FFFFFF',
    ...FONTS.bold,
    letterSpacing: 0.5,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'none',
    } : {}),
  },
  imageOverlayText: {
    color: 'transparent',
    fontSize: 15,
    ...FONTS.bold,
    letterSpacing: 0.5,
  },
  itemName: {
    fontSize: 15,
    ...FONTS.bold,
    color: '#1C0A00',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  itemDesc: {
    fontSize: 11,
    color: '#78828F',
    ...FONTS.regular,
    lineHeight: 16,
    marginBottom: 10,
    flex: 1,
  },
  itemDescEmpty: {
    fontSize: 12,
    color: '#A0A9B4',
    ...FONTS.regular,
    fontStyle: 'italic',
    marginBottom: 12,
    flex: 1,
  },

  /* ── Card Footer ── */
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 'auto',
    borderTopWidth: 0,
  },
  priceLabel: {
    fontSize: 9,
    color: '#9BA8B4',
    ...FONTS.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  priceValue: {
    fontSize: 19,
    color: COLORS.primary,
    ...FONTS.bold,
    letterSpacing: -0.3,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 0,
    ...(Platform.OS === 'web' ? {
      transition: 'all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
      cursor: 'pointer',
      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.2)',
    } : {}),
  },
  addBtnHovered: {
    ...(Platform.OS === 'web' ? {
      transform: [{scale: 1.08}],
      boxShadow: '0 6px 16px rgba(16, 185, 129, 0.35)',
    } : {}),
  },
  addBtnPlus: {
    fontSize: 16,
    color: '#FFFFFF',
    ...FONTS.bold,
    marginRight: 4,
  },
  addBtnLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    ...FONTS.bold,
    letterSpacing: 0.3,
  },

  /* ── Cart Header ── */
  cartHeaderBtn: {
    position: 'relative',
  },
  cartIcon: {
    fontSize: 20,
    color: COLORS.white,
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: COLORS.white,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: 10,
    color: COLORS.primary,
    ...FONTS.bold,
  },

  /* ── Empty ── */
  emptyWrap: {
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
    marginBottom: 16,
  },
  emptyIcon: {fontSize: 32},
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
  },

  /* ── Floating Cart ── */
  floatingCartWrap: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    maxWidth: 480,
    alignSelf: 'center',
  },
  floatingCart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1C0A00',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    ...SHADOWS.large,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingCartBadge: {
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  floatingCartBadgeText: {
    fontSize: 13,
    color: '#FFFFFF',
    ...FONTS.bold,
  },
  floatingCartText: {
    color: '#FFFFFF',
    fontSize: 15,
    ...FONTS.semiBold,
    letterSpacing: 0.3,
  },
  floatingCartArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    ...FONTS.bold,
  },
});

export default MenuScreen;
