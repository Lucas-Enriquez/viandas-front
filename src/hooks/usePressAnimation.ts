import { useRef } from "react";
import { Animated } from "react-native";

export function usePressAnimation(scaleTo = 0.96) {
  const scale = useRef(new Animated.Value(1)).current;
  const animatedStyle = { transform: [{ scale }] };

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 22,
      bounciness: 0,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 3,
    }).start();
  };

  return { animatedStyle, onPressIn, onPressOut };
}
