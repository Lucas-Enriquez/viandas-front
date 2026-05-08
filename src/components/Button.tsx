import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { colors, radius, shadows, spacing, typography } from "../theme";
import { usePressAnimation } from "../hooks/usePressAnimation";

type ButtonVariant = "primary" | "secondary" | "ghost" | "accent";
type ButtonSize = "medium" | "small";

type ButtonProps = {
  disabled?: boolean;
  icon?: LucideIcon;
  loading?: boolean;
  onPress?: () => void;
  size?: ButtonSize;
  style?: ViewStyle;
  title: string;
  variant?: ButtonVariant;
};

export function Button({
  disabled,
  icon: Icon,
  loading,
  onPress,
  size = "medium",
  style,
  title,
  variant = "primary",
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation(0.96);

  const iconColor =
    variant === "primary" || variant === "accent" ? colors.onBrand : colors.brandRed;
  const labelStyle =
    variant === "primary" || variant === "accent" ? styles.labelOnBrand : styles.labelAlt;
  const shadowStyle = variant === "primary" ? shadows.brand : variant === "accent" ? shadows.md : null;

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        accessibilityRole="button"
        disabled={isDisabled}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.base, styles[variant], styles[size], shadowStyle, isDisabled && styles.disabled]}
      >
        {loading ? (
          <ActivityIndicator color={iconColor} size="small" />
        ) : Icon ? (
          <Icon color={iconColor} size={size === "small" ? 17 : 20} strokeWidth={2.5} />
        ) : null}
        <Text style={[styles.label, labelStyle]}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: spacing.lg,
  },
  medium: {
    minHeight: 54,
  },
  small: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  primary: {
    backgroundColor: colors.brandRed,
  },
  accent: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.redSoft,
    borderColor: colors.brandRedLight,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    ...typography.button,
  },
  labelOnBrand: {
    color: colors.onBrand,
  },
  labelAlt: {
    color: colors.brandRed,
  },
});
