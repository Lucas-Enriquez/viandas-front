import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react-native";

import { colors, radius, shadows, spacing, typography } from "../theme";

export type ToastTone = "success" | "error" | "info";

export type ToastShape = {
  id: string;
  title: string;
  message?: string;
  tone: ToastTone;
};

type ToastProps = ToastShape & {
  onDismiss: (id: string) => void;
};

const TONE_CONFIG = {
  success: {
    bg: colors.success,
    fg: colors.onBrand,
    Icon: CheckCircle2,
  },
  error: {
    bg: colors.brandRedDark,
    fg: colors.onBrand,
    Icon: TriangleAlert,
  },
  info: {
    bg: colors.ink,
    fg: colors.onBrand,
    Icon: Info,
  },
} as const;

export function Toast({ id, title, message, tone, onDismiss }: ToastProps) {
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        speed: 14,
        bounciness: 6,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [translateY, opacity]);

  const config = TONE_CONFIG[tone];
  const Icon = config.Icon;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { backgroundColor: config.bg, opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.iconWrap}>
        <Icon color={config.fg} size={20} strokeWidth={2.4} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: config.fg }]} numberOfLines={2}>
          {title}
        </Text>
        {!!message && (
          <Text style={[styles.message, { color: config.fg }]} numberOfLines={3}>
            {message}
          </Text>
        )}
      </View>
      <Pressable hitSlop={10} onPress={() => onDismiss(id)} style={styles.close}>
        <X color={config.fg} size={16} strokeWidth={2.4} />
      </Pressable>
    </Animated.View>
  );
}

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastShape[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <SafeAreaView edges={["bottom"]} pointerEvents="box-none" style={styles.stack}>
      <View pointerEvents="box-none" style={styles.stackInner}>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  stack: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 1000,
  },
  stackInner: {
    gap: spacing.xs,
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  wrapper: {
    alignItems: "flex-start",
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    ...shadows.lg,
  },
  iconWrap: {
    paddingTop: 2,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.bodyStrong,
  },
  message: {
    ...typography.caption,
    opacity: 0.9,
  },
  close: {
    alignItems: "center",
    height: 28,
    justifyContent: "center",
    width: 28,
  },
});
