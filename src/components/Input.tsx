import { useState, useRef, type ReactNode } from "react";
import { Animated, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

type InputProps = TextInputProps & {
  error?: string | null;
  label: string;
  rightAccessory?: ReactNode;
};

export function Input({
  error,
  label,
  rightAccessory,
  style,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const animatedBorderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.brandRed],
  });

  const borderColor = error ? colors.brandRed : animatedBorderColor;
  const borderWidth = focused || !!error ? 2 : 1;
  const backgroundColor = error ? colors.redSofter : colors.surface;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View style={[styles.inputFrame, { borderColor, borderWidth, backgroundColor }]}>
        <TextInput
          placeholderTextColor={colors.placeholder}
          style={[styles.input, style]}
          onFocus={(e) => {
            setFocused(true);
            Animated.timing(focusAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            Animated.timing(focusAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
            onBlur?.(e);
          }}
          {...props}
        />
        {!!rightAccessory && <View style={styles.accessory}>{rightAccessory}</View>}
      </Animated.View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    ...typography.captionStrong,
    color: colors.inkSoft,
    textTransform: "uppercase",
  },
  inputFrame: {
    alignItems: "center",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 56,
    paddingHorizontal: spacing.md,
  },
  input: {
    ...typography.body,
    color: colors.ink,
    flex: 1,
    minHeight: 56,
    paddingVertical: 0,
  },
  accessory: {
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    ...typography.caption,
    color: colors.brandRed,
    fontWeight: "600",
  },
});
