import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

type StatusPillTone = "neutral" | "success" | "warning" | "accent" | "brand";

type StatusPillProps = {
  label: string;
  tone?: StatusPillTone;
};

export function StatusPill({ label, tone = "neutral" }: StatusPillProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return (
    <Animated.View style={[styles.pill, styles[tone], { opacity }]}>
      <Text style={[styles.label, styles[`${tone}Label`]]}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  neutral: { backgroundColor: colors.surfaceMuted },
  success: { backgroundColor: colors.successSoft },
  warning: { backgroundColor: colors.yellowSoft },
  accent:  { backgroundColor: colors.accentSoft },
  brand:   { backgroundColor: colors.redSoft },
  label: { ...typography.captionStrong },
  neutralLabel: { color: colors.muted },
  successLabel: { color: colors.success },
  warningLabel: { color: colors.warning },
  accentLabel:  { color: colors.warning },
  brandLabel:   { color: colors.brandRed },
});
