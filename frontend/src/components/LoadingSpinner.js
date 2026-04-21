import React, {useRef, useEffect} from 'react';
import {View, Animated, StyleSheet, Text, Easing} from 'react-native';
import {COLORS, FONTS, SIZES} from '../utils/theme';

const LoadingSpinner = ({message = 'Loading...'}) => {
  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dotOpacity1 = useRef(new Animated.Value(0.3)).current;
  const dotOpacity2 = useRef(new Animated.Value(0.3)).current;
  const dotOpacity3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();

    // Spin animation
    const spin = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
        easing: Easing.linear,
      }),
    );
    spin.start();

    // Dot wave
    const dotAnim = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            delay,
            useNativeDriver: false,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: false,
          }),
        ]),
      );
    dotAnim(dotOpacity1, 0).start();
    dotAnim(dotOpacity2, 150).start();
    dotAnim(dotOpacity3, 300).start();
  }, []);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.spinnerWrap,
          {opacity, transform: [{scale}]},
        ]}>
        <Animated.View style={[styles.spinner, {transform: [{rotate}]}]}>
          <View style={styles.spinnerDot} />
        </Animated.View>
        <Text style={styles.emoji}>🍔</Text>
      </Animated.View>
      <View style={styles.dotsRow}>
        <Animated.View style={[styles.dot, {opacity: dotOpacity1}]} />
        <Animated.View style={[styles.dot, {opacity: dotOpacity2}]} />
        <Animated.View style={[styles.dot, {opacity: dotOpacity3}]} />
      </View>
      <Animated.Text style={[styles.message, {opacity}]}>{message}</Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  spinnerWrap: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  spinner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.lightGrey,
    borderTopColor: COLORS.primary,
    position: 'absolute',
  },
  spinnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    top: -2,
    alignSelf: 'center',
  },
  emoji: {
    fontSize: 32,
  },
  dotsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginHorizontal: 4,
  },
  message: {
    fontSize: SIZES.sm,
    color: COLORS.textLight,
    ...FONTS.medium,
  },
});

export default LoadingSpinner;
