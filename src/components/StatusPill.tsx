import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../theme";

type StatusPillProps = {
  label: string;
  tone?: "neutral" | "success" | "warning";
};

export function StatusPill({ label, tone = "neutral" }: StatusPillProps) {
  return (
    <View style={[styles.pill, styles[tone]]}>
      <Text style={[styles.label, styles[`${tone}Label`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  neutral: {
    backgroundColor: colors.surfaceMuted,
  },
  success: {
    backgroundColor: colors.successSoft,
  },
  warning: {
    backgroundColor: colors.yellowSoft,
  },
  label: {
    ...typography.captionStrong,
  },
  neutralLabel: {
    color: colors.muted,
  },
  successLabel: {
    color: colors.success,
  },
  warningLabel: {
    color: colors.warning,
  },
});
