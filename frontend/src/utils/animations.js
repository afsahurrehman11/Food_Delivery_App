import {useRef, useEffect} from 'react';
import {Animated, Easing} from 'react-native';

/**
 * Hook: fade + slide up entry animation
 */
export const useFadeInUp = (delay = 0, duration = 500) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: false,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: false,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, []);

  return {opacity, transform: [{translateY}]};
};

/**
 * Hook: fade in animation
 */
export const useFadeIn = (delay = 0, duration = 400) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: false,
      easing: Easing.out(Easing.ease),
    }).start();
  }, []);

  return {opacity};
};

/**
 * Hook: scale bounce entry
 */
export const useScaleBounce = (delay = 0, duration = 600) => {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      delay,
      friction: 4,
      tension: 50,
      useNativeDriver: false,
    }).start();
  }, []);

  return {transform: [{scale}]};
};

/**
 * Hook: slide in from left
 */
export const useSlideInLeft = (delay = 0, duration = 400) => {
  const translateX = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: false,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration * 0.6,
        delay,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  return {opacity, transform: [{translateX}]};
};

/**
 * Hook: pulse animation (loop)
 */
export const usePulse = (minScale = 0.95, maxScale = 1.05) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: maxScale,
          duration: 800,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(scale, {
          toValue: minScale,
          duration: 800,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return {transform: [{scale}]};
};

/**
 * Create staggered animation values for lists
 */
export const useStaggeredList = (count, staggerDelay = 80) => {
  const animations = useRef(
    Array.from({length: count}, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(25),
    })),
  ).current;

  useEffect(() => {
    const anims = animations.map((anim, index) =>
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 400,
          delay: index * staggerDelay,
          useNativeDriver: false,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(anim.translateY, {
          toValue: 0,
          duration: 400,
          delay: index * staggerDelay,
          useNativeDriver: false,
          easing: Easing.out(Easing.cubic),
        }),
      ]),
    );
    Animated.parallel(anims).start();
  }, [count]);

  return animations;
};

/**
 * Button press animation (scale down and back)
 */
export const createPressAnimation = () => {
  const scale = new Animated.Value(1);

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      friction: 8,
      tension: 100,
      useNativeDriver: false,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: false,
    }).start();
  };

  return {scale, onPressIn, onPressOut};
};

/**
 * Rotate animation (for loading spinners)
 */
export const useRotation = (duration = 1200) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration,
        useNativeDriver: false,
        easing: Easing.linear,
      }),
    );
    spin.start();
    return () => spin.stop();
  }, []);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return {transform: [{rotate}]};
};

/**
 * Shimmer / wave animation
 */
export const useShimmer = () => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
        easing: Easing.linear,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return {transform: [{translateX}]};
};
