import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Animated,
  useWindowDimensions,
} from 'react-native';
import AppHeader from '../../components/AppHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import {useAuth} from '../../context/AuthContext';
import {getDashboardStats} from '../../services/apiService';
import {COLORS, FONTS, SIZES, SHADOWS} from '../../utils/theme';

const AnimatedStatCard = ({value, label, accent, background, icon, delay, style}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {toValue: 1, duration: 400, delay, useNativeDriver: false}),
      Animated.timing(translateY, {toValue: 0, duration: 420, delay, useNativeDriver: false}),
      Animated.spring(scale, {toValue: 1, friction: 6, delay, useNativeDriver: false}),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.statCard,
        style,
        {
          backgroundColor: background,
          borderColor: accent,
          opacity,
          transform: [{translateY}, {scale}],
        },
      ]}>
      <View style={[styles.statBadge, {backgroundColor: `${accent}1A`}]}>
        <Text style={styles.statIcon}>{icon}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <View style={[styles.statAccentBar, {backgroundColor: accent}]} />
    </Animated.View>
  );
};

const AnimatedActionCard = ({title, subtitle, icon, accent, accentSoft, delay, onPress, containerStyle}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {toValue: 1, duration: 400, delay, useNativeDriver: false}),
      Animated.timing(translateY, {toValue: 0, duration: 400, delay, useNativeDriver: false}),
    ]).start();
  }, []);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.actionPressable,
        containerStyle,
      ]}
      onPressIn={() => Animated.spring(pressScale, {toValue: 0.97, friction: 8, tension: 120, useNativeDriver: false}).start()}
      onPressOut={() => Animated.spring(pressScale, {toValue: 1, friction: 4, tension: 40, useNativeDriver: false}).start()}>
      <Animated.View style={[styles.actionCard, {opacity, transform: [{translateY}, {scale: pressScale}]}]}>
        <View style={[styles.actionIconWrap, {backgroundColor: accentSoft, borderColor: `${accent}50`}]}>
          <Text style={styles.actionIcon}>{icon}</Text>
        </View>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionMeta}>{subtitle}</Text>
        <View style={[styles.actionArrow, {backgroundColor: accent}]}>
          <Text style={styles.actionArrowText}>›</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const AdminDashboardScreen = ({navigation}) => {
  const {user, logout} = useAuth();
  const {width} = useWindowDimensions();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const sectionAnim = useRef(new Animated.Value(0)).current;
  const sectionLift = useRef(new Animated.Value(18)).current;

  const fetchStats = useCallback(async () => {
    try {
      const res = await getDashboardStats();
      setStats(res.data);
    } catch (e) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    Animated.parallel([
      Animated.timing(sectionAnim, {toValue: 1, duration: 500, delay: 360, useNativeDriver: false}),
      Animated.timing(sectionLift, {toValue: 0, duration: 500, delay: 360, useNativeDriver: false}),
    ]).start();
  }, [fetchStats]);

  const handleLogout = async () => {
    await logout();
    navigation.reset({index: 0, routes: [{name: 'Splash'}]});
  };

  if (loading) return <LoadingSpinner />;

  const adminName = user?.username || 'Admin';
  const isCompact = width < 920;
  const isNarrow = width < 620;
  const statCardWidth = isCompact ? '100%' : '48.8%';
  const actionCardWidth = width >= 1500
    ? '19.2%'
    : width >= 1180
      ? '24.1%'
      : width >= 900
        ? '32.1%'
        : isNarrow
          ? '100%'
          : '48.8%';

  const actions = [
    {
      title: 'Restaurants',
      subtitle: 'Manage partner profiles',
      icon: '🏪',
      screen: 'AdminRestaurants',
      accent: '#F97316',
      accentSoft: 'rgba(249,115,22,0.14)',
    },
    {
      title: 'Orders',
      subtitle: 'Track and update statuses',
      icon: '📋',
      screen: 'AdminOrders',
      accent: '#3B82F6',
      accentSoft: 'rgba(59,130,246,0.14)',
    },
    {
      title: 'Riders',
      subtitle: 'Handle assignments quickly',
      icon: '🏍️',
      screen: 'AdminRiders',
      accent: '#EF4444',
      accentSoft: 'rgba(239,68,68,0.14)',
    },
    {
      title: 'Payments',
      subtitle: 'Review payout activity',
      icon: '💰',
      screen: 'AdminPayments',
      accent: '#16A34A',
      accentSoft: 'rgba(22,163,74,0.14)',
    },
    {
      title: 'Commissions',
      subtitle: 'Monitor earning margins',
      icon: '💎',
      screen: 'AdminCommissions',
      accent: '#EAB308',
      accentSoft: 'rgba(234,179,8,0.16)',
    },
  ];

  const statCards = [
    {
      value: stats?.total_restaurants || 0,
      label: 'Restaurants',
      icon: '🏪',
      accent: '#F97316',
      background: '#FFF5EC',
    },
    {
      value: stats?.total_orders || 0,
      label: 'Total Orders',
      icon: '📋',
      accent: '#3B82F6',
      background: '#EEF5FF',
    },
    {
      value: `Rs. ${(stats?.total_revenue || 0).toFixed(0)}`,
      label: 'Revenue',
      icon: '💵',
      accent: '#DC2626',
      background: '#FFF1F1',
    },
    {
      value: `Rs. ${(stats?.total_commission || 0).toFixed(0)}`,
      label: 'Commission',
      icon: '💎',
      accent: '#CA8A04',
      background: '#FFF9E8',
    },
  ];

  return (
    <View style={styles.container}>
      <AppHeader
        title="Admin Dashboard"
        showBack={false}
        rightComponent={
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchStats(); }}
            colors={[COLORS.primary]}
          />
        }>
        <View style={styles.heroCard}>
          <Text style={styles.heroKicker}>Operations Control</Text>
          <Text style={styles.heroTitle}>Welcome back, {adminName}</Text>
          <Text style={styles.heroSubtitle}>
            Track performance metrics and run day-to-day delivery operations from one place.
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          {statCards.map((item, idx) => (
            <AnimatedStatCard
              key={item.label}
              value={item.value}
              label={item.label}
              icon={item.icon}
              accent={item.accent}
              background={item.background}
              delay={idx * 90}
              style={{width: statCardWidth}}
            />
          ))}
        </View>

        {/* Quick Actions */}
        <Animated.View style={{opacity: sectionAnim, transform: [{translateY: sectionLift}]}}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionHint}>Jump to a module and manage records faster.</Text>
        </Animated.View>
        <View style={styles.actionGrid}>
          {actions.map((action, idx) => (
            <AnimatedActionCard
              key={action.screen}
              title={action.title}
              subtitle={action.subtitle}
              icon={action.icon}
              accent={action.accent}
              accentSoft={action.accentSoft}
              delay={350 + idx * 80}
              containerStyle={{width: actionCardWidth}}
              onPress={() => navigation.navigate(action.screen)}
            />
          ))}
        </View>


      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  content: {
    paddingHorizontal: SIZES.paddingLg,
    paddingTop: SIZES.padding,
    paddingBottom: 36,
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.24)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  logoutText: {
    fontSize: SIZES.sm,
    color: COLORS.white,
    ...FONTS.semiBold,
    letterSpacing: 0.2,
  },
  heroCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusXl,
    paddingHorizontal: 22,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.24)',
    marginBottom: 16,
    ...SHADOWS.large,
  },
  heroKicker: {
    fontSize: SIZES.xs,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: COLORS.primaryDark,
    ...FONTS.semiBold,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: SIZES.xxl,
    color: COLORS.text,
    ...FONTS.bold,
  },
  heroSubtitle: {
    fontSize: SIZES.md,
    color: COLORS.textLight,
    marginTop: 6,
    lineHeight: 21,
    maxWidth: 760,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    borderRadius: SIZES.radiusLg,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    marginBottom: 14,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.medium,
  },
  statBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  statIcon: {fontSize: 24},
  statLabel: {
    fontSize: SIZES.xs,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    ...FONTS.semiBold,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 30,
    color: COLORS.text,
    ...FONTS.bold,
    letterSpacing: -0.6,
  },
  statAccentBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
  },
  sectionTitle: {
    fontSize: 28,
    ...FONTS.bold,
    color: COLORS.text,
    marginBottom: 4,
    marginTop: 2,
    letterSpacing: -0.4,
  },
  sectionHint: {
    fontSize: SIZES.md,
    color: COLORS.textLight,
    marginBottom: 14,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  actionPressable: {
    marginBottom: 14,
  },
  actionCard: {
    width: '100%',
    minHeight: 220,
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(28,10,0,0.08)',
    ...SHADOWS.medium,
  },
  actionIconWrap: {
    width: 74,
    height: 74,
    borderRadius: 22,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionIcon: {
    fontSize: 34,
  },
  actionTitle: {
    fontSize: SIZES.lg,
    ...FONTS.semiBold,
    color: COLORS.text,
    textAlign: 'left',
    marginBottom: 5,
  },
  actionMeta: {
    fontSize: SIZES.sm,
    color: COLORS.textLight,
    marginBottom: 14,
    lineHeight: 18,
  },
  actionArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  actionArrowText: {
    fontSize: 17,
    color: COLORS.white,
    ...FONTS.bold,
    marginTop: -1,
  },
});

export default AdminDashboardScreen;
