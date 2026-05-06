import type { ReactNode } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { colors, spacing, typography } from "../theme";

type InputProps = TextInputProps & {
  error?: string | null;
  label: string;
  rightAccessory?: ReactNode;
};

export function Input({ error, label, rightAccessory, style, ...props }: InputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputFrame, error ? styles.inputError : null]}>
        <TextInput
          placeholderTextColor={colors.placeholder}
          style={[styles.input, style]}
          {...props}
        />
        {!!rightAccessory && <View style={styles.accessory}>{rightAccessory}</View>}
      </View>
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
    color: colors.ink,
  },
  inputFrame: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  input: {
    ...typography.body,
    color: colors.ink,
    flex: 1,
    minHeight: 52,
    paddingVertical: 0,
  },
  inputError: {
    borderColor: colors.brandRed,
  },
  accessory: {
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    ...typography.caption,
    color: colors.brandRed,
  },
});
