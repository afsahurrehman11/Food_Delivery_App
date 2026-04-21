import React, {useRef} from 'react';
import {Animated, TouchableWithoutFeedback, StyleSheet} from 'react-native';
import {SHADOWS} from '../utils/theme';

const AnimatedCard = ({children, style, onPress, delay = 0}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 450,
        delay,
        useNativeDriver: false,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 450,
        delay,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
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

  const content = (
    <Animated.View
      style={[
        styles.card,
        style,
        {
          opacity,
          transform: [{translateY}, {scale}],
        },
      ]}>
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableWithoutFeedback
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}>
        {content}
      </TouchableWithoutFeedback>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    ...SHADOWS.medium,
  },
});

export default AnimatedCard;
