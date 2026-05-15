import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft } from "lucide-react-native";

import { colors, radius, spacing, typography } from "../theme";

type HeroTone = "brand" | "ink" | "surface";

type HeroProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  rightAccessory?: ReactNode;
  leftAccessory?: ReactNode;
  /** When true, renders a circular back button on the left (calls onBack). */
  onBack?: () => void;
  children?: ReactNode;
  tone?: HeroTone;
  /** Smaller padding + smaller title — used for forms / detail screens. */
  compact?: boolean;
  style?: ViewStyle;
};

/**
 * Full-bleed hero with rounded bottom corners. Owns the safe-area top inset
 * (the navigator header should be hidden where this is used).
 */
export function Hero({
  eyebrow,
  title,
  subtitle,
  rightAccessory,
  leftAccessory,
  onBack,
  children,
  tone = "brand",
  compact = false,
  style,
}: HeroProps) {
  const isLight = tone === "surface";
  const onColor = isLight ? colors.ink : colors.onBrand;
  const onSoftColor = isLight ? colors.muted : "rgba(255, 255, 255, 0.85)";
  const eyebrowColor = tone === "brand" ? "rgba(255, 255, 255, 0.7)" : colors.brandRed;

  const titleStyle = compact ? styles.titleCompact : styles.title;
  const contentStyle = compact ? styles.contentCompact : styles.content;

  const backButton = onBack ? (
    <Pressable
      accessibilityLabel="Volver"
      hitSlop={10}
      onPress={onBack}
      style={({ pressed }) => [
        styles.backButton,
        isLight ? styles.backButtonLight : styles.backButtonDark,
        pressed && styles.backButtonPressed,
      ]}
    >
      <ArrowLeft color={isLight ? colors.ink : colors.onBrand} size={20} strokeWidth={2.4} />
    </Pressable>
  ) : null;

  const left = backButton ?? leftAccessory;

  return (
    <View style={[styles.outer, toneStyles[tone], style]}>
      <StatusBar style={isLight ? "dark" : "light"} />
      <SafeAreaView edges={["top"]}>
        <View style={contentStyle}>
          <View style={styles.row}>
            {left && <View style={styles.left}>{left}</View>}
            <View style={styles.copy}>
              {eyebrow && (
                <Text style={[styles.eyebrow, { color: eyebrowColor }]}>{eyebrow}</Text>
              )}
              <Text numberOfLines={2} style={[titleStyle, { color: onColor }]}>
                {title}
              </Text>
              {subtitle && (
                <Text style={[styles.subtitle, { color: onSoftColor }]}>{subtitle}</Text>
              )}
            </View>
            {rightAccessory && <View style={styles.right}>{rightAccessory}</View>}
          </View>
          {children && <View style={styles.children}>{children}</View>}
        </View>
      </SafeAreaView>
    </View>
  );
}

const toneStyles = StyleSheet.create({
  brand: {
    backgroundColor: colors.brandRed,
  },
  ink: {
    backgroundColor: colors.ink,
  },
  surface: {
    backgroundColor: colors.surface,
  },
});

const styles = StyleSheet.create({
  outer: {
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    overflow: "hidden",
  },
  content: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  contentCompact: {
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  left: {
    paddingTop: 2,
  },
  right: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  eyebrow: {
    ...typography.captionStrong,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 34,
  },
  titleCompact: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  subtitle: {
    ...typography.body,
    marginTop: 2,
  },
  children: {
    marginTop: spacing.md,
  },
  backButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  backButtonDark: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  backButtonLight: {
    backgroundColor: colors.surfaceMuted,
  },
  backButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
});
