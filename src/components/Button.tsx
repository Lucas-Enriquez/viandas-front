import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { colors, radius, shadows, spacing, typography } from "../theme";
import { usePressAnimation } from "../hooks/usePressAnimation";

type ButtonVariant = "primary" | "secondary" | "ghost" | "accent" | "success";
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

  const isOnBrand = variant === "primary" || variant === "accent" || variant === "success";
  const iconColor = isOnBrand ? colors.onBrand : colors.brandRed;
  const labelStyle = isOnBrand ? styles.labelOnBrand : styles.labelAlt;
  const shadowStyle =
    variant === "primary" ? shadows.brand :
    variant === "success" ? shadows.success :
    variant === "accent"  ? shadows.md : null;

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
          <Icon color={iconColor} size={size === "small" ? 16 : 20} strokeWidth={1.8} />
        ) : null}
        <Text style={[styles.label, size === "small" && styles.labelSmall, labelStyle]}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: spacing.lg,
  },
  medium: {
    minHeight: 54,
  },
  small: {
    borderRadius: radius.md,
    minHeight: 34,
    paddingHorizontal: spacing.sm,
  },
  primary: {
    backgroundColor: colors.brandRed,
  },
  accent: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.surfaceMuted,
  },
  ghost: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  success: {
    backgroundColor: colors.success,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    ...typography.button,
  },
  labelSmall: {
    fontSize: 13,
    fontWeight: "600" as const,
    letterSpacing: 0,
  },
  labelOnBrand: {
    color: colors.onBrand,
  },
  labelAlt: {
    color: colors.brandRed,
  },
});
