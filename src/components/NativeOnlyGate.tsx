import { Image, Linking, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogOut, Smartphone } from "lucide-react-native";

import { useAuth } from "../auth/AuthContext";
import { APP_STORE_URL, PLAY_STORE_URL } from "../config";
import { colors, radius, spacing, typography } from "../theme";
import { Button } from "./Button";
import { Card } from "./Card";

const logoSource = require("../../assets/logo.png");

function detectMobileOS(): "ios" | "android" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

export function NativeOnlyGate() {
  const os = detectMobileOS();
  const { session, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <Image
          accessibilityLabel="Viandas"
          resizeMode="contain"
          source={logoSource}
          style={styles.logo}
        />
        <Card style={styles.card}>
          <View style={styles.iconBubble}>
            <Smartphone color={colors.brandRed} size={28} strokeWidth={1.8} />
          </View>
          <Text style={styles.title}>Esta sección solo está en la app</Text>
          <Text style={styles.subtitle}>
            La gestión de menús, pedidos y reparto necesita la app nativa para
            funcionar bien (ubicación, notificaciones, mapas).
          </Text>
          <View style={styles.actions}>
            {os !== "ios" && (
              <Button
                onPress={() => Linking.openURL(PLAY_STORE_URL)}
                title="Descargar para Android"
              />
            )}
            {os !== "android" && (
              <Button
                onPress={() => Linking.openURL(APP_STORE_URL)}
                title="Descargar para iPhone"
                variant={os === "ios" ? "primary" : "secondary"}
              />
            )}
            {session && (
              <Button
                icon={LogOut}
                onPress={() => {
                  void signOut();
                }}
                title="Cerrar sesión"
                variant="ghost"
              />
            )}
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    alignItems: "center",
    flex: 1,
    gap: spacing.xl,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  logo: {
    height: 88,
    width: 88,
  },
  card: {
    alignItems: "center",
    gap: spacing.md,
    maxWidth: 420,
    padding: spacing.xl,
    width: "100%",
  },
  iconBubble: {
    alignItems: "center",
    backgroundColor: colors.redSoft,
    borderRadius: radius.pill,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  title: {
    ...typography.h1,
    color: colors.ink,
    textAlign: "center",
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    textAlign: "center",
  },
  actions: {
    alignSelf: "stretch",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
