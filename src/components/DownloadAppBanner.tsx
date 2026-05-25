import { useEffect, useState } from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Download, X } from "lucide-react-native";

import { APP_STORE_URL, PLAY_STORE_URL } from "../config";
import { colors, radius, shadows, spacing, typography } from "../theme";

const DISMISSED_KEY = "viandas.download_banner_dismissed";

type MobileOS = "ios" | "android" | "other";

function detectMobileOS(): MobileOS {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

export function DownloadAppBanner() {
  const [visible, setVisible] = useState(false);
  const [os, setOs] = useState<MobileOS>("other");

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const detected = detectMobileOS();
    if (detected === "other") return;
    let cancelled = false;
    AsyncStorage.getItem(DISMISSED_KEY).then((value) => {
      if (cancelled) return;
      if (!value) {
        setOs(detected);
        setVisible(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!visible) return null;

  const storeUrl = os === "ios" ? APP_STORE_URL : PLAY_STORE_URL;

  const onDismiss = () => {
    setVisible(false);
    AsyncStorage.setItem(DISMISSED_KEY, "1");
  };

  return (
    <View style={styles.root}>
      <View style={styles.iconBubble}>
        <Download color={colors.brandRed} size={18} strokeWidth={2} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Descargá Viandas</Text>
        <Text style={styles.subtitle}>
          Mejor experiencia y notificaciones de tu pedido.
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => Linking.openURL(storeUrl)}
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.ctaText}>Instalar</Text>
      </Pressable>
      <Pressable
        accessibilityLabel="Cerrar"
        hitSlop={10}
        onPress={onDismiss}
        style={({ pressed }) => [styles.close, pressed && { opacity: 0.6 }]}
      >
        <X color={colors.muted} size={16} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    margin: spacing.md,
    padding: spacing.sm,
    ...shadows.sm,
  },
  iconBubble: {
    alignItems: "center",
    backgroundColor: colors.redSoft,
    borderRadius: radius.pill,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  subtitle: {
    ...typography.caption,
    color: colors.muted,
  },
  cta: {
    backgroundColor: colors.brandRed,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  ctaText: {
    ...typography.captionStrong,
    color: colors.onBrand,
  },
  close: {
    alignItems: "center",
    height: 28,
    justifyContent: "center",
    width: 28,
  },
});
