import { Alert, Linking, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle2, MessageCircle, Send } from "lucide-react-native";

import { getApiErrorMessage } from "../../../src/api/client";
import { menusApi } from "../../../src/api/menus";
import { Button } from "../../../src/components/Button";
import { Card } from "../../../src/components/Card";
import { Hero } from "../../../src/components/Hero";
import { Skeleton } from "../../../src/components/Skeleton";
import { ErrorState } from "../../../src/components/StateViews";
import { colors, radius, spacing, typography } from "../../../src/theme";

export default function MenuShareScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  const menuQuery = useQuery({
    enabled: !!id,
    queryFn: () => menusApi.get(id!),
    queryKey: ["menu", id],
  });

  const shareQuery = useQuery({
    enabled: !!id,
    queryFn: () => menusApi.shareMessage(id!),
    queryKey: ["menu", id, "share"],
  });

  if (!id) {
    return (
      <ErrorState
        message="Falta el id del menú."
        onAction={() => router.replace("/menus")}
        title="Sin menú"
      />
    );
  }

  if (menuQuery.isError || shareQuery.isError) {
    return (
      <ErrorState
        message={getApiErrorMessage(menuQuery.error ?? shareQuery.error)}
        onAction={() => router.replace("/menus")}
        title="No pudimos cargar el mensaje"
      />
    );
  }

  const isLoading = menuQuery.isLoading || shareQuery.isLoading;
  const menu = menuQuery.data;
  const share = shareQuery.data;
  const message = share?.whatsappText || share?.publicUrl || "";

  const shareWith = async (companyName?: string) => {
    if (!message.trim()) {
      Alert.alert("Sin mensaje", "El backend no devolvió texto para compartir.");
      return;
    }
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    try {
      await Linking.openURL(whatsappUrl);
      return;
    } catch {
      // fallback below
    }
    try {
      await Share.share(
        { message },
        { dialogTitle: companyName ? `Enviar a ${companyName}` : undefined },
      );
    } catch {
      Alert.alert("No pudimos compartir", message);
    }
  };

  return (
    <View style={styles.root}>
      <Hero
        tone="ink"
        eyebrow="Menú publicado"
        onBack={() => router.replace("/menus")}
        rightAccessory={
          <View style={styles.heroIcon}>
            <CheckCircle2 color={colors.onBrand} size={26} strokeWidth={1.8} />
          </View>
        }
        subtitle="Copiá el mensaje y mandalo a cada grupo de WhatsApp."
        title="Listo para compartir"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.skeletonGroup}>
            <Skeleton.Card height={180} />
            <Skeleton.Card height={140} />
          </View>
        ) : (
          <>
            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <MessageCircle color={colors.brandRed} size={20} strokeWidth={1.8} />
                <Text style={styles.sectionTitle}>Mensaje</Text>
              </View>
              <View style={styles.messageBox}>
                <Text selectable style={styles.messageText}>
                  {message}
                </Text>
              </View>
              <Button icon={Send} onPress={() => shareWith()} title="Compartir mensaje" />
            </Card>

            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <MessageCircle color={colors.brandRed} size={20} strokeWidth={1.8} />
                <Text style={styles.sectionTitle}>
                  Empresas ({menu?.companies.length ?? 0})
                </Text>
              </View>
              <Text style={styles.help}>
                Tocá una empresa para abrir su grupo y mandar el mensaje.
              </Text>
              <View style={styles.companyList}>
                {menu?.companies.map((company) => (
                  <View key={company.id} style={styles.companyRow}>
                    <View style={styles.companyText}>
                      <Text style={styles.companyName}>{company.name}</Text>
                      <Text style={styles.companySlug}>{company.slug}</Text>
                    </View>
                    <Button
                      icon={Send}
                      onPress={() => shareWith(company.name)}
                      size="small"
                      title="Enviar"
                      variant="secondary"
                    />
                  </View>
                ))}
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  skeletonGroup: {
    gap: spacing.md,
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: radius.lg,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.ink,
  },
  messageBox: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    maxHeight: 240,
    padding: spacing.md,
  },
  messageText: {
    ...typography.body,
    color: colors.ink,
  },
  help: {
    ...typography.caption,
    color: colors.muted,
  },
  companyList: {
    gap: spacing.sm,
  },
  companyRow: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  companyText: {
    flex: 1,
  },
  companyName: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  companySlug: {
    ...typography.caption,
    color: colors.muted,
  },
});
