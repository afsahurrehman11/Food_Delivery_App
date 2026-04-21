import React, {useRef, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import {COLORS, FONTS, SIZES, SHADOWS} from '../../utils/theme';
import KhushiBitesLogo from '../../components/KhushiBitesLogo';

const isWeb = Platform.OS === 'web';

/* ─── Feature card data ─── */
const FEATURES = [
  {icon: '⚡', title: 'Lightning Fast', desc: 'Get your food delivered in under 30 minutes'},
  {icon: '🛡️', title: 'Secure Payments', desc: 'Multiple payment methods with full encryption'},
  {icon: '⭐', title: 'Top Restaurants', desc: 'Curated selection of the finest local eateries'},
];

/* ─── Stats data ─── */
const STATS = [
  {value: '500+', label: 'Restaurants'},
  {value: '50K+', label: 'Happy Customers'},
  {value: '15min', label: 'Avg Delivery'},
  {value: '4.9', label: 'App Rating'},
];

const SplashScreen = ({navigation}) => {
  const {width: windowWidth} = useWindowDimensions();
  const [browseHovered, setBrowseHovered] = useState(false);
  const [loginHovered, setLoginHovered] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState(-1);
  const statusBarTop = !isWeb && Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

  const isPhone = !isWeb && windowWidth < 430;
  const isNarrowPhone = !isWeb && windowWidth < 372;
  const isDesktop = isWeb && windowWidth >= 768;

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(40)).current;
  const subtitleFade = useRef(new Animated.Value(0)).current;
  const btnFade = useRef(new Animated.Value(0)).current;
  const btnSlide = useRef(new Animated.Value(30)).current;
  const statsFade = useRef(new Animated.Value(0)).current;
  const featuresFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.parallel([
        Animated.timing(fadeIn, {toValue: 1, duration: 600, useNativeDriver: false}),
        Animated.timing(heroSlide, {toValue: 0, duration: 600, useNativeDriver: false}),
      ]),
      Animated.timing(subtitleFade, {toValue: 1, duration: 500, useNativeDriver: false}),
      Animated.parallel([
        Animated.timing(btnFade, {toValue: 1, duration: 500, useNativeDriver: false}),
        Animated.timing(btnSlide, {toValue: 0, duration: 500, useNativeDriver: false}),
      ]),
      Animated.timing(statsFade, {toValue: 1, duration: 500, useNativeDriver: false}),
      Animated.timing(featuresFade, {toValue: 1, duration: 600, useNativeDriver: false}),
    ]).start();
  }, []);

  const browseHoverProps = isWeb ? {
    onMouseEnter: () => setBrowseHovered(true),
    onMouseLeave: () => setBrowseHovered(false),
  } : {};

  const loginHoverProps = isWeb ? {
    onMouseEnter: () => setLoginHovered(true),
    onMouseLeave: () => setLoginHovered(false),
  } : {};

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={COLORS.secondary} barStyle="light-content" translucent={false} />

      {/* ── Top Navigation Bar ── */}
      <View style={[styles.navbar, statusBarTop > 0 && {paddingTop: statusBarTop}, isPhone && styles.navbarPhone]}>
        <View style={[styles.navInner, isPhone && styles.navInnerPhone]}>
          <View style={[styles.navBrand, isPhone && styles.navBrandPhone]}>
            <KhushiBitesLogo size={isNarrowPhone ? 36 : isPhone ? 40 : 52} />
            <Text style={[styles.navBrandText, isPhone && styles.navBrandTextPhone]} numberOfLines={1}>
              <Text style={[styles.navBrandOrange, isPhone && styles.navBrandTonePhone]}>Khushi</Text>
              <Text style={[styles.navBrandRed, isPhone && styles.navBrandTonePhone]}>Bites</Text>
            </Text>
          </View>
          <View style={[styles.navLinks, isPhone && styles.navLinksPhone]}>
            <TouchableOpacity
              onPress={() => navigation.navigate('RestaurantList')}
              style={[styles.navLink, isPhone && styles.navLinkPhone]}
              {...(isWeb ? {
                onMouseEnter: (e) => { e.currentTarget.style.color = COLORS.primary; },
                onMouseLeave: (e) => { e.currentTarget.style.color = '#A8A29E'; },
              } : {})}>
              <Text style={[styles.navLinkText, isPhone && styles.navLinkTextPhone]} numberOfLines={1}>Restaurants</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={[styles.navLoginBtn, isPhone && styles.navLoginBtnPhone]}
              {...loginHoverProps}>
              <Text style={[styles.navLoginText, isPhone && styles.navLoginTextPhone, loginHovered && styles.navLoginTextHovered]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ── Hero Section ── */}
        <View style={styles.heroSection}>
          {/* Subtle background shapes */}
          <View style={styles.heroBgShape1} />
          <View style={styles.heroBgShape2} />

          <View style={styles.heroContent}>
            {/* ── Big Logo ── */}
            <Animated.View style={[styles.heroLogoWrap, {opacity: fadeIn, transform: [{translateY: heroSlide}]}]}>
              <KhushiBitesLogo size={isWeb ? 360 : isPhone ? 170 : 200} />
            </Animated.View>

            <Animated.View style={{opacity: fadeIn, transform: [{translateY: heroSlide}]}}>
              <View style={styles.heroBadge}>
                <View style={styles.heroBadgeDot} />
                <Text style={styles.heroBadgeText}>😊 Happy Meals, Fast Delivery</Text>
              </View>
            </Animated.View>

            <Animated.Text
              style={[styles.heroTitle, {opacity: fadeIn, transform: [{translateY: heroSlide}]}]}>
              <Text style={styles.heroTitleBrand}>Khushi</Text>
              <Text style={styles.heroTitleBrandRed}>Bites</Text>
              {'\n'}Happy Meals,{' '}
              <Text style={styles.heroTitleAccent}>Fast Delivery</Text>
            </Animated.Text>

            <Animated.Text style={[styles.heroSubtitle, {opacity: subtitleFade}]}>
              Order from the best local restaurants with easy, on-demand{'\n'}
              delivery at your doorstep.
            </Animated.Text>

            {/* CTA Buttons */}
            <Animated.View
              style={[styles.heroBtnRow, {opacity: btnFade, transform: [{translateY: btnSlide}]}]}>
              <TouchableOpacity
                onPress={() => navigation.navigate('RestaurantList')}
                activeOpacity={0.85}
                style={[styles.primaryBtn, browseHovered && styles.primaryBtnHovered]}
                {...browseHoverProps}>
                <Text style={styles.primaryBtnText}>Browse Restaurants</Text>
                <Text style={styles.primaryBtnArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.85}
                style={[styles.secondaryBtn, loginHovered && styles.secondaryBtnHovered]}
                {...loginHoverProps}>
                <Text style={[styles.secondaryBtnText, loginHovered && styles.secondaryBtnTextHov]}>
                  Staff Portal
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* ── Stats Bar ── */}
        <Animated.View style={[styles.statsBar, {opacity: statsFade}]}>
          <View style={styles.statsInner}>
            {STATS.map((s, i) => (
              <View key={i} style={styles.statItem}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Features Section ── */}
        <Animated.View style={[styles.featuresSection, {opacity: featuresFade}]}>
          <Text style={styles.sectionLabel}>WHY CHOOSE US</Text>
          <Text style={styles.sectionTitle}>Built for speed and reliability</Text>

          <View style={styles.featuresGrid}>
            {FEATURES.map((f, i) => {
              const fHoverProps = isWeb ? {
                onMouseEnter: () => setHoveredFeature(i),
                onMouseLeave: () => setHoveredFeature(-1),
              } : {};
              return (
                <View
                  key={i}
                  style={[
                    styles.featureCard,
                    isDesktop && styles.featureCardDesktop,
                    hoveredFeature === i && styles.featureCardHovered,
                  ]}
                  {...fHoverProps}>
                  <View style={[styles.featureIcon, hoveredFeature === i && styles.featureIconHovered]}>
                    <Text style={styles.featureIconText}>{f.icon}</Text>
                  </View>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <View style={styles.footerInner}>
            <View style={styles.footerBrand}>
              <KhushiBitesLogo size={44} />
              <Text style={styles.footerBrandText}>
                <Text style={styles.footerBrandOrange}>Khushi</Text>
                <Text style={styles.footerBrandRed}>Bites</Text>
              </Text>
            </View>
            <Text style={styles.footerCopy}>
              © 2026 KhushiBites. All rights reserved.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const CARD_GAP = 20;
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  /* ── Navbar ── */
  navbar: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 24,
    paddingVertical: 0,
    ...(isWeb ? {position: 'sticky', top: 0, zIndex: 100} : {}),
  },
  navbarPhone: {
    paddingHorizontal: 12,
  },
  navInner: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
  },
  navInnerPhone: {
    height: 58,
  },
  navBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    flexShrink: 1,
  },
  navBrandPhone: {
    maxWidth: '50%',
  },
  navLogoMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accentGold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  navLogoLetter: {
    fontSize: 18,
  },
  navBrandOrange: {
    fontSize: 20,
    color: '#F97316',
    ...FONTS.bold,
    fontWeight: '900',
  },
  navBrandRed: {
    fontSize: 20,
    color: '#DC2626',
    ...FONTS.bold,
    fontWeight: '900',
  },
  navBrandText: {
    fontSize: 20,
    color: '#FFFAF5',
    ...FONTS.bold,
    letterSpacing: -0.5,
    marginLeft: 8,
    minWidth: 0,
    flexShrink: 1,
  },
  navBrandTextPhone: {
    fontSize: 16,
    marginLeft: 5,
  },
  navBrandTonePhone: {
    fontSize: 16,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navLinksPhone: {
    gap: 4,
  },
  navLink: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navLinkPhone: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  navLinkText: {
    fontSize: 14,
    color: '#A8A29E',
    ...FONTS.medium,
    ...(isWeb ? {transition: 'color 0.2s ease'} : {}),
  },
  navLinkTextPhone: {
    fontSize: 12,
  },
  navLoginBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    ...(isWeb ? {transition: 'all 0.2s ease'} : {}),
  },
  navLoginBtnPhone: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  navLoginText: {
    fontSize: 14,
    color: '#D6D3D1',
    ...FONTS.semiBold,
  },
  navLoginTextPhone: {
    fontSize: 13,
  },
  navLoginTextHovered: {
    color: COLORS.primary,
  },

  /* ── Hero ── */
  heroSection: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 24,
    overflow: 'hidden',
    position: 'relative',
    ...(isWeb ? {
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      paddingTop: 16,
    } : {
      paddingTop: 40,
      paddingBottom: 40,
    }),
  },
  heroBgShape1: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(249,115,22,0.07)',
  },
  heroBgShape2: {
    position: 'absolute',
    bottom: -100,
    left: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(220,38,38,0.04)',
  },
  heroContent: {
    maxWidth: 720,
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  heroLogoWrap: {
    marginBottom: -40,
    alignItems: 'center',
    ...(isWeb ? {
      filter: 'drop-shadow(0 8px 24px rgba(249,115,22,0.35))',
    } : {}),
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249,115,22,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.25)',
    marginBottom: 12,
  },
  heroBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },
  heroBadgeText: {
    fontSize: 13,
    color: COLORS.primary,
    ...FONTS.semiBold,
    letterSpacing: 0.3,
  },
  heroTitle: {
    fontSize: isWeb ? 52 : 36,
    color: '#FFFAF5',
    ...FONTS.bold,
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: isWeb ? 56 : 44,
    marginBottom: 32,
  },
  heroTitleBrand: {
    color: '#F97316',
    fontWeight: '900',
  },
  heroTitleBrandRed: {
    color: '#DC2626',
    fontWeight: '900',
  },
  heroTitleAccent: {
    color: COLORS.accentGold,
    fontWeight: '900',
  },
  heroSubtitle: {
    fontSize: isWeb ? 16 : 15,
    color: '#A8A29E',
    ...FONTS.regular,
    textAlign: 'center',
    lineHeight: isWeb ? 24 : 22,
    marginBottom: 24,
    maxWidth: 520,
  },

  /* CTA */
  heroBtnRow: {
    flexDirection: isWeb ? 'row' : 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 64,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 8,
    ...(isWeb ? {
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
    } : {}),
    ...SHADOWS.medium,
  },
  primaryBtnHovered: {
    backgroundColor: COLORS.primaryDark,
    ...(isWeb ? {
      transform: [{translateY: -2}],
      boxShadow: '0px 8px 20px rgba(249,115,22,0.40)',
    } : {}),
  },
  primaryBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    ...FONTS.bold,
    letterSpacing: 0.2,
  },
  primaryBtnArrow: {
    fontSize: 18,
    color: '#FFFFFF',
    ...FONTS.bold,
    marginLeft: 10,
  },
  secondaryBtn: {
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 8,
    ...(isWeb ? {
      transition: 'all 0.25s ease',
      cursor: 'pointer',
    } : {}),
  },
  secondaryBtnHovered: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(249,115,22,0.10)',
  },
  secondaryBtnText: {
    fontSize: 16,
    color: '#A8A29E',
    ...FONTS.semiBold,
  },
  secondaryBtnTextHov: {
    color: COLORS.primary,
  },

  /* ── Stats Bar ── */
  statsBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statsInner: {
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 100,
  },
  statValue: {
    fontSize: 28,
    color: COLORS.secondary,
    ...FONTS.bold,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    color: '#78716C',
    ...FONTS.medium,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  /* ── Features ── */
  featuresSection: {
    paddingVertical: isWeb ? 80 : 50,
    paddingHorizontal: 24,
    backgroundColor: COLORS.background,
  },
  sectionLabel: {
    fontSize: 12,
    color: COLORS.primary,
    ...FONTS.bold,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: isWeb ? 32 : 24,
    color: COLORS.secondary,
    ...FONTS.bold,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 48,
  },
  featuresGrid: {
    maxWidth: 1000,
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: CARD_GAP,
  },
  featureCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...(isWeb ? {
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'default',
      maxWidth: 460,
    } : {}),
  },
  featureCardDesktop: {
    width: `calc(50% - ${CARD_GAP / 2}px)`,
  },
  featureCardHovered: {
    borderColor: COLORS.primary,
    ...(isWeb ? {
      transform: [{translateY: -4}],
      boxShadow: '0px 12px 24px rgba(249,115,22,0.15)',
    } : {}),
  },
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...(isWeb ? {transition: 'background-color 0.3s ease'} : {}),
  },
  featureIconHovered: {
    backgroundColor: COLORS.primary,
  },
  featureIconText: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 18,
    color: COLORS.secondary,
    ...FONTS.semiBold,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  featureDesc: {
    fontSize: 14,
    color: '#78716C',
    ...FONTS.regular,
    lineHeight: 22,
  },

  /* ── Footer ── */
  footer: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  footerInner: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    flexDirection: isWeb ? 'row' : 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerBrandOrange: {
    fontSize: 16,
    color: '#F97316',
    ...FONTS.semiBold,
  },
  footerBrandRed: {
    fontSize: 16,
    color: '#DC2626',
    ...FONTS.semiBold,
  },
  footerBrandText: {
    fontSize: 16,
    color: '#D6D3D1',
    ...FONTS.semiBold,
    marginLeft: 8,
  },
  footerCopy: {
    fontSize: 13,
    color: '#57534E',
    ...FONTS.regular,
  },

  /* ── Scroll ── */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default SplashScreen;
