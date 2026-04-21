import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform, useWindowDimensions} from 'react-native';
import {COLORS, FONTS, SIZES, SHADOWS} from '../utils/theme';
import KhushiBitesLogo from './KhushiBitesLogo';

const isWeb = Platform.OS === 'web';

const AppHeader = ({title, navigation, showBack = true, rightComponent}) => {
  const [backHovered, setBackHovered] = useState(false);
  const {width} = useWindowDimensions();
  const statusBarTop = !isWeb && Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

  const isCompact = width < 980;
  const isPhone = width < 640;
  const isNarrowPhone = width < 390;

  const showBackLabel = !isNarrowPhone;
  const showPageTitle = !!title && (!isNarrowPhone || !showBack);
  const logoSize = isNarrowPhone ? 30 : isPhone ? 34 : isCompact ? 40 : 50;

  const leftWidth = showBack
    ? isNarrowPhone
      ? 54
      : isPhone
        ? 84
        : 120
    : isPhone
      ? 12
      : 120;

  const rightWidth = rightComponent
    ? isNarrowPhone
      ? 64
      : isPhone
        ? 86
        : 120
    : isPhone
      ? 12
      : 120;

  const backHoverProps = isWeb ? {
    onMouseEnter: () => setBackHovered(true),
    onMouseLeave: () => setBackHovered(false),
  } : {};

  return (
    <>
      <StatusBar backgroundColor={COLORS.navBg} barStyle="light-content" translucent={false} />
      <View style={[styles.container, statusBarTop > 0 && {paddingTop: statusBarTop}] }>
        <View style={[styles.inner, isCompact && styles.innerCompact, isPhone && styles.innerPhone]}>
          {/* Left — back button */}
          <View style={[styles.left, {minWidth: leftWidth}]}>
            {showBack && navigation && (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={[
                  styles.backBtn,
                  isPhone && styles.backBtnPhone,
                  backHovered && styles.backBtnHovered,
                ]}
                activeOpacity={0.7}
                {...backHoverProps}>
                <Text style={[styles.backArrow, isPhone && styles.backArrowPhone, backHovered && styles.backArrowHov]}>←</Text>
                {showBackLabel && (
                  <Text style={[styles.backLabel, isPhone && styles.backLabelPhone, backHovered && styles.backLabelHov]}>Back</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Center — KhushiBites brand + page title */}
          <View style={[styles.center, isPhone && styles.centerPhone]}>
            <View style={[styles.brandRow, isPhone && styles.brandRowPhone]}>
              <View style={[styles.logoWrap, isPhone && styles.logoWrapPhone]}>
                <KhushiBitesLogo size={logoSize} />
              </View>
              <View style={styles.brandTextWrap}>
                <Text
                  style={[styles.brandName, isCompact && styles.brandNameCompact, isPhone && styles.brandNamePhone]}
                  numberOfLines={1}>
                  <Text style={styles.brandOrange}>Khushi</Text>
                  <Text style={styles.brandRed}>Bites</Text>
                </Text>
                {showPageTitle ? (
                  <Text style={[styles.pageTitle, isPhone && styles.pageTitlePhone]} numberOfLines={1}>
                    {title}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* Right */}
          <View style={[styles.right, {minWidth: rightWidth}]}>{rightComponent || null}</View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.navBg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(249,115,22,0.42)',
    ...(isWeb ? {
      position: 'sticky',
      top: 0,
      zIndex: 100,
    } : {}),
  },
  inner: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    height: 76,
  },
  innerCompact: {
    paddingHorizontal: 16,
    height: 70,
  },
  innerPhone: {
    paddingHorizontal: 10,
    height: 64,
  },
  left: {
    minWidth: 120,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: 'rgba(249,115,22,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.42)',
  },
  backBtnPhone: {
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  backBtnHovered: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  backArrow: {
    fontSize: 18,
    color: COLORS.primary,
    ...FONTS.bold,
  },
  backArrowPhone: {
    fontSize: 16,
  },
  backArrowHov: {
    color: '#FFFFFF',
  },
  backLabel: {
    fontSize: 13,
    color: COLORS.primary,
    ...FONTS.bold,
    marginLeft: 6,
  },
  backLabelPhone: {
    fontSize: 12,
    marginLeft: 4,
  },
  backLabelHov: {
    color: '#FFFFFF',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  centerPhone: {
    alignItems: 'flex-start',
    paddingHorizontal: 6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    maxWidth: '100%',
  },
  brandRowPhone: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 14,
  },
  logoWrap: {
    marginRight: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(249,115,22,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.28)',
    padding: 3,
  },
  logoWrapPhone: {
    marginRight: 6,
    padding: 2,
  },
  brandTextWrap: {
    alignItems: 'flex-start',
    minWidth: 0,
    flexShrink: 1,
  },
  brandName: {
    fontSize: 25,
    lineHeight: 27,
    letterSpacing: -0.5,
    fontWeight: '900',
  },
  brandNameCompact: {
    fontSize: 21,
    lineHeight: 23,
  },
  brandNamePhone: {
    fontSize: 17,
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  brandOrange: {
    color: '#F97316',
  },
  brandRed: {
    color: '#DC2626',
  },
  pageTitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.64)',
    ...FONTS.medium,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginTop: 0,
  },
  pageTitlePhone: {
    fontSize: 9,
    letterSpacing: 0.8,
  },
  right: {
    minWidth: 120,
    alignItems: 'flex-end',
  },
});

export default AppHeader;
