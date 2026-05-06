import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { colors, spacing, typography } from "../theme";

type ButtonVariant = "primary" | "secondary" | "ghost";
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
  const iconColor = variant === "primary" ? colors.onBrand : colors.brandRed;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} size="small" />
      ) : Icon ? (
        <Icon color={iconColor} size={size === "small" ? 17 : 20} strokeWidth={2.5} />
      ) : null}
      <Text style={[styles.label, variant === "primary" ? styles.labelPrimary : styles.labelAlt]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: 8,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  medium: {
    minHeight: 52,
  },
  small: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  primary: {
    backgroundColor: colors.brandRed,
  },
  secondary: {
    backgroundColor: colors.redSoft,
    borderColor: colors.redBorder,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.58,
  },
  label: {
    ...typography.button,
  },
  labelPrimary: {
    color: colors.onBrand,
  },
  labelAlt: {
    color: colors.brandRed,
  },
});
