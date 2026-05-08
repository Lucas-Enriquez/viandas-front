import { PropsWithChildren } from "react";
import { Animated, Pressable, StyleSheet, ViewStyle } from "react-native";

import { colors, radius, shadows, spacing } from "../theme";
import { usePressAnimation } from "../hooks/usePressAnimation";

type CardVariant = "elevated" | "flat" | "warm" | "outlined";

type CardProps = PropsWithChildren<{
  style?: ViewStyle;
  variant?: CardVariant;
  onPress?: () => void;
}>;

export function Card({ children, style, variant = "elevated", onPress }: CardProps) {
  const variantStyle = variantStyles[variant];

  if (onPress) {
    return <PressableCard variantStyle={variantStyle} style={style} onPress={onPress}>{children}</PressableCard>;
  }

  return (
    <Animated.View style={[styles.base, variantStyle, style]}>
      {children}
    </Animated.View>
  );
}

function PressableCard({
  children,
  variantStyle,
  style,
  onPress,
}: PropsWithChildren<{ variantStyle: ViewStyle; style?: ViewStyle; onPress: () => void }>) {
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation(0.98);

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.base, variantStyle, animatedStyle, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    padding: spacing.md,
  },
});

const variantStyles: Record<CardVariant, ViewStyle> = {
  elevated: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    ...shadows.md,
  },
  flat: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  warm: {
    backgroundColor: colors.surfaceWarm,
    ...shadows.sm,
  },
  outlined: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1.5,
  },
};
