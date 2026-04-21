import React, {useRef} from 'react';
import {
  Animated,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Platform,
} from 'react-native';
import {COLORS, FONTS, SIZES, SHADOWS} from '../utils/theme';

const AppButton = ({
  title,
  onPress,
  style,
  textStyle,
  loading = false,
  disabled = false,
  variant = 'primary', // primary | secondary | danger | outline
  icon,
  size = 'default', // compact | default | large
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const bgColor = {
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    danger: COLORS.danger,
    outline: 'transparent',
    success: COLORS.success,
  };

  const txtColor = variant === 'outline' ? COLORS.primary : COLORS.white;

  const paddingMap = {
    compact: {paddingVertical: 10, paddingHorizontal: 16},
    default: {paddingVertical: 15, paddingHorizontal: 28},
    large: {paddingVertical: 18, paddingHorizontal: 36},
  };

  const fontSizeMap = {
    compact: SIZES.sm,
    default: SIZES.base,
    large: SIZES.lg,
  };

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      friction: 8,
      tension: 100,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: false,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.8}>
      <Animated.View
        style={[
          styles.button,
          paddingMap[size],
          {backgroundColor: bgColor[variant] || COLORS.primary},
          variant !== 'outline' && SHADOWS.medium,
          variant === 'outline' && styles.outline,
          disabled && styles.disabled,
          {transform: [{scale}]},
          Platform.OS === 'web' ? {cursor: disabled || loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease'} : {},
          style,
        ]}>
        {loading ? (
          <ActivityIndicator color={txtColor} size="small" />
        ) : (
          <View style={styles.content}>
            {icon && <View style={styles.iconWrap}>{icon}</View>}
            <Text
              style={[
                styles.text,
                {color: txtColor, fontSize: fontSizeMap[size]},
                textStyle,
              ]}>
              {title}
            </Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    marginRight: 8,
  },
  text: {
    ...FONTS.semiBold,
    letterSpacing: 0.3,
  },
  outline: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default AppButton;
