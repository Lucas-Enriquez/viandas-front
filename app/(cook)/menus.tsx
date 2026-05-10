import { useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  ChevronRight,
  Clock,
  Copy,
  Globe2,
  ImageOff,
  MessageCircle,
  Plus,
  RefreshCw,
  Send,
  Utensils,
} from "lucide-react-native";

import { getApiErrorMessage } from "../../src/api/client";
import { menusApi } from "../../src/api/menus";
import { useAuth } from "../../src/auth/AuthContext";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { Hero } from "../../src/components/Hero";
import { Skeleton } from "../../src/components/Skeleton";
import { EmptyState, ErrorState } from "../../src/components/StateViews";
import { StatusPill } from "../../src/components/StatusPill";
import { useToast } from "../../src/providers/ToastProvider";
import { colors, radius, shadows, spacing, typography } from "../../src/theme";
import type { MenuResponse, MenuScope } from "../../src/types";
import { formatMenuDate, todayYmd } from "../../src/utils/date";
import { formatMoney } from "../../src/utils/format";

export default function MenusScreen() {
  const [scope, setScope] = useState<MenuScope>("GLOBAL");
  const date = todayYmd();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const toast = useToast();
  const firstName = session?.user.name?.split(" ")[0] ?? "Cocina";

  const menusQuery = useQuery({
    queryFn: () => menusApi.list({ date }),
    queryKey: ["menus", date],
  });

  const publishMutation = useMutation({
    mutationFn: menusApi.publish,
    onError: (error) => {
      toast.show({
        title: "No pudimos publicar el menú",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: async (share) => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      await shareMenu(share.whatsappText || share.publicUrl);
    },
  });

  const shareMutation = useMutation({
    mutationFn: menusApi.shareMessage,
    onError: (error) => {
      toast.show({
        title: "No pudimos obtener el link",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: async (share) => {
      await shareMenu(share.whatsappText || share.publicUrl);
    },
  });

  const cloneMutation = useMutation({
    mutationFn: async () => {
      const yesterday = todayYmd(new Date(Date.now() - 24 * 60 * 60 * 1000));
      const list = await menusApi.list({ date: yesterday });
      const sourceMenu = list.find((m) => m.scope === "GLOBAL");
      if (!sourceMenu) {
        throw new Error("No hay menú global de ayer para clonar.");
      }
      return menusApi.clone(sourceMenu.id, { date });
    },
    onError: (error) => {
      toast.show({
        title: "No pudimos clonar el menú",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: (cloned) => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      router.push({ pathname: "/menu-create", params: { id: cloned.id } });
    },
  });

  if (menusQuery.isError) {
    return (
      <ErrorState
        actionLabel="Reintentar"
        icon={RefreshCw}
        message={getApiErrorMessage(menusQuery.error)}
        onAction={() => menusQuery.refetch()}
        title="No pudimos cargar los menús"
      />
    );
  }

  const menus = dedupeMenusByScopeAndId(
    (menusQuery.data ?? []).filter((menu) => menu.scope === scope),
  );

  const totalItems = menus.reduce((sum, m) => sum + m.items.length, 0);
  const publishedCount = menus.filter((m) => m.status === "PUBLISHED").length;

  return (
    <View style={styles.root}>
      <Hero
        eyebrow={formatMenuDate(date)}
        title={`Buen día, ${firstName}`}
        subtitle="¿Arrancamos con el menú del día?"
      >
        <View style={styles.statsRow}>
          <StatChip label={String(menus.length)} caption={menus.length === 1 ? "menú" : "menús"} />
          <StatChip label={String(totalItems)} caption="items" />
          <StatChip label={String(publishedCount)} caption="publicados" />
        </View>
      </Hero>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            colors={[colors.brandRed]}
            onRefresh={() => menusQuery.refetch()}
            refreshing={menusQuery.isFetching && !menusQuery.isLoading}
            tintColor={colors.brandRed}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.segmented}>
          {(["GLOBAL", "COMPANY"] as MenuScope[]).map((option) => (
            <Pressable
              key={option}
              onPress={() => setScope(option)}
              style={[styles.segment, scope === option && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, scope === option && styles.segmentTextActive]}>
                {option === "GLOBAL" ? "Global" : "Por empresa"}
              </Text>
            </Pressable>
          ))}
        </View>

        {scope === "GLOBAL" && (
          <Pressable
            disabled={cloneMutation.isPending}
            onPress={() => cloneMutation.mutate()}
            style={({ pressed }) => [styles.primaryAction, pressed && styles.actionPressed]}
          >
            <View style={styles.primaryActionIcon}>
              <Copy color={colors.onBrand} size={26} strokeWidth={2.4} />
            </View>
            <View style={styles.primaryActionCopy}>
              <Text style={styles.primaryActionTitle}>Clonar menú de ayer</Text>
              <Text style={styles.primaryActionMeta}>
                Empezá con la misma base y ajustá precios o stock.
              </Text>
            </View>
            <ChevronRight color={colors.onBrand} size={20} strokeWidth={2.4} />
          </Pressable>
        )}

        <View style={styles.actionGrid}>
          <ActionTile
            icon={Plus}
            onPress={() => router.push({ pathname: "/menu-create", params: { scope } })}
            subtitle={scope === "GLOBAL" ? "Empezá vacío" : "Por empresa"}
            title="Crear menú"
          />
          <ActionTile
            icon={MessageCircle}
            onPress={() => {
              const lastPublished = menus.find((m) => m.status === "PUBLISHED");
              if (!lastPublished) {
                Alert.alert("Sin publicar", "Todavía no publicaste un menú hoy.");
                return;
              }
              shareMutation.mutate(lastPublished.id);
            }}
            subtitle="Último publicado"
            title="Compartir"
          />
        </View>

        <View style={styles.todayHeader}>
          <Text style={styles.todayLabel}>Hoy</Text>
          <Text style={styles.todayHint}>{menus.length} resultado{menus.length === 1 ? "" : "s"}</Text>
        </View>

        {menusQuery.isLoading ? (
          <View style={styles.list}>
            <Skeleton.Card height={140} />
            <Skeleton.Card height={140} />
            <Skeleton.Card height={140} />
          </View>
        ) : menus.length === 0 ? (
          <EmptyState
            icon={Utensils}
            message={
              scope === "GLOBAL"
                ? "No hay menús globales para hoy."
                : "No hay menús por empresa para hoy."
            }
            title="Sin menús"
          />
        ) : (
          <View style={styles.list}>
            {menus.map((menu) => (
              <MenuCard
                key={`${menu.scope}-${menu.id}`}
                menu={menu}
                onPublish={() => publishMutation.mutate(menu.id)}
                onShare={() => shareMutation.mutate(menu.id)}
                publishing={publishMutation.isPending}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatChip({ label, caption }: { label: string; caption: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statValue}>{label}</Text>
      <Text style={styles.statCaption}>{caption}</Text>
    </View>
  );
}

function ActionTile({
  icon: Icon,
  onPress,
  subtitle,
  title,
}: {
  icon: typeof Plus;
  onPress: () => void;
  subtitle: string;
  title: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionTile, pressed && styles.actionPressed]}
    >
      <View style={styles.actionTileIcon}>
        <Icon color={colors.brandRed} size={22} strokeWidth={2.4} />
      </View>
      <Text style={styles.actionTileTitle}>{title}</Text>
      <Text style={styles.actionTileSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

function MenuCard({
  menu,
  onPublish,
  onShare,
  publishing,
}: {
  menu: MenuResponse;
  onPublish: () => void;
  onShare: () => void;
  publishing: boolean;
}) {
  const previewItems = menu.items.slice(0, 3);
  const companyLabel =
    menu.scope === "GLOBAL"
      ? `${menu.companies.length} empresas`
      : menu.companyName ?? "Empresa sin nombre";

  return (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.menuInfo}>
          <View style={styles.scopeRow}>
            {menu.scope === "GLOBAL" && <Globe2 color={colors.brandRed} size={17} />}
            <Text style={styles.cardTitle}>{companyLabel}</Text>
          </View>
          <View style={styles.metaRow}>
            <Clock color={colors.muted} size={16} strokeWidth={2.4} />
            <Text style={styles.metaText}>Cierra {menu.orderClosesAt}</Text>
          </View>
        </View>
        <StatusPill
          label={menu.status === "PUBLISHED" ? "Publicado" : "Borrador"}
          tone={menu.status === "PUBLISHED" ? "success" : "warning"}
        />
      </View>

      {previewItems.length > 0 && (
        <View style={styles.itemGrid}>
          {previewItems.map((item, index) => (
            <View key={`${menu.id}-${item.id}-${index}`} style={styles.item}>
              {item.photoUrl ? (
                <Image source={{ uri: item.photoUrl }} style={styles.itemImage} />
              ) : (
                <View style={styles.itemImageFallback}>
                  <ImageOff color={colors.muted} size={18} strokeWidth={2.4} />
                </View>
              )}
              <View style={styles.itemCopy}>
                <Text numberOfLines={1} style={styles.itemName}>
                  {item.name}
                </Text>
                <Text style={styles.itemMeta}>{formatMoney(item.price)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.cardActions}>
        {menu.status === "DRAFT" ? (
          <Button
            icon={Send}
            loading={publishing}
            onPress={onPublish}
            size="small"
            title="Publicar"
          />
        ) : (
          <Button
            icon={MessageCircle}
            onPress={onShare}
            size="small"
            title="Compartir"
            variant="secondary"
          />
        )}
      </View>
    </Card>
  );
}

function dedupeMenusByScopeAndId(menus: MenuResponse[]) {
  const seen = new Set<string>();
  return menus.filter((menu) => {
    const key = `${menu.scope}-${menu.id}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function shareMenu(message: string) {
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
    await Share.share({ message });
  } catch {
    Alert.alert("No pudimos compartir", message);
  }
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
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statChip: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: radius.lg,
    flex: 1,
    gap: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statValue: {
    color: colors.onBrand,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  statCaption: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "600",
  },
  segmented: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
  },
  segment: {
    alignItems: "center",
    borderRadius: radius.pill,
    flex: 1,
    justifyContent: "center",
    minHeight: 40,
  },
  segmentActive: {
    backgroundColor: colors.brandRed,
  },
  segmentText: {
    ...typography.captionStrong,
    color: colors.muted,
  },
  segmentTextActive: {
    color: colors.onBrand,
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: colors.brandRed,
    borderRadius: radius.xl,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.brand,
  },
  primaryActionIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: radius.md,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  primaryActionCopy: {
    flex: 1,
    gap: 2,
  },
  primaryActionTitle: {
    color: colors.onBrand,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  primaryActionMeta: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    lineHeight: 18,
  },
  actionPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  actionGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionTile: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  actionTileIcon: {
    alignItems: "center",
    backgroundColor: colors.redSoft,
    borderRadius: radius.md,
    height: 40,
    justifyContent: "center",
    marginBottom: spacing.xs,
    width: 40,
  },
  actionTileTitle: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  actionTileSubtitle: {
    ...typography.caption,
    color: colors.muted,
  },
  todayHeader: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  todayLabel: {
    ...typography.h2,
    color: colors.ink,
  },
  todayHint: {
    ...typography.caption,
    color: colors.muted,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.md,
  },
  cardActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  cardTitle: {
    ...typography.h2,
    color: colors.ink,
  },
  item: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  itemCopy: {
    flex: 1,
  },
  itemGrid: {
    gap: spacing.sm,
  },
  itemImage: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    height: 48,
    width: 48,
  },
  itemImageFallback: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  itemMeta: {
    ...typography.caption,
    color: colors.muted,
  },
  itemName: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  menuInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  metaText: {
    ...typography.caption,
    color: colors.muted,
  },
  scopeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
});
