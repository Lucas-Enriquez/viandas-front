import { useState } from "react"; // useState kept for deletingMenuId
import {
  Alert,
  Animated,
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
  CalendarClock,
  Clock,
  Copy,
  Globe2,
  ImageOff,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Utensils,
} from "lucide-react-native";

import { getApiErrorMessage } from "../../../src/api/client";
import { menusApi } from "../../../src/api/menus";
import { rewriteShareMessage } from "../../../src/config";
import { useAuth } from "../../../src/auth/AuthContext";
import { Button } from "../../../src/components/Button";
import { Card } from "../../../src/components/Card";
import { DangerConfirmModal } from "../../../src/components/DangerConfirmModal";
import { Hero } from "../../../src/components/Hero";
import { Skeleton } from "../../../src/components/Skeleton";
import { EmptyState, ErrorState } from "../../../src/components/StateViews";
import { StatusPill } from "../../../src/components/StatusPill";
import { useToast } from "../../../src/providers/ToastProvider";
import { usePressAnimation } from "../../../src/hooks/usePressAnimation";
import { colors, radius, shadows, spacing, typography } from "../../../src/theme";
import type { MenuResponse } from "../../../src/types";
import { formatMenuDate, formatShortDate, todayYmd } from "../../../src/utils/date";
import { formatMoney } from "../../../src/utils/format";

export default function MenusScreen() {
  const date = todayYmd();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const toast = useToast();
  const firstName = session?.user.name?.split(" ")[0] ?? "Cocina";
  const [deletingMenuId, setDeletingMenuId] = useState<string | null>(null);

  const allMenusQuery = useQuery({
    queryFn: () => menusApi.list(),
    queryKey: ["menus", "all"],
  });

  const allMenus = dedupeMenusByScopeAndId(allMenusQuery.data ?? []);
  const todayMenus = allMenus.filter((m) => m.date === date);
  const upcomingMenus = allMenus
    .filter((m) => m.date > date)
    .sort((a, b) => a.date.localeCompare(b.date));
  const latestMenu = allMenus[0];

  const publishMutation = useMutation({
    mutationFn: menusApi.publish,
    onError: (error) => {
      toast.show({
        title: "No pudimos publicar el menú",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: async (raw) => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      const share = rewriteShareMessage(raw);
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
    onSuccess: async (raw) => {
      const share = rewriteShareMessage(raw);
      await shareMenu(share.whatsappText || share.publicUrl);
    },
  });

  const cloneMutation = useMutation({
    mutationFn: async () => {
      const list = allMenusQuery.data ?? (await menusApi.list());
      const sourceMenu = list[0];
      if (!sourceMenu) {
        throw new Error("No hay menús anteriores para clonar.");
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

  const deleteMutation = useMutation({
    mutationFn: (menuId: string) => menusApi.delete(menuId),
    onError: (error) => {
      toast.show({
        title: "No pudimos eliminar el menú",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      setDeletingMenuId(null);
      toast.show({ title: "Menú eliminado", tone: "success" });
    },
  });

  if (allMenusQuery.isError) {
    return (
      <ErrorState
        actionLabel="Reintentar"
        icon={RefreshCw}
        message={getApiErrorMessage(allMenusQuery.error)}
        onAction={() => allMenusQuery.refetch()}
        title="No pudimos cargar los menús"
      />
    );
  }

  const publishedCount = todayMenus.filter((m) => m.status === "PUBLISHED").length;
  const heroSubtitle = allMenusQuery.isLoading
    ? undefined
    : todayMenus.length === 0
    ? upcomingMenus.length > 0
      ? `Sin menús hoy · ${upcomingMenus.length} próximo${upcomingMenus.length === 1 ? "" : "s"}`
      : "Sin menús para hoy todavía"
    : `${todayMenus.length} ${todayMenus.length === 1 ? "menú" : "menús"} · ${publishedCount} publicado${publishedCount !== 1 ? "s" : ""}`;

  return (
    <View style={styles.root}>
      <Hero
        tone="ink"
        eyebrow={formatMenuDate(date)}
        title={`Buen día, ${firstName}`}
        subtitle={heroSubtitle}
        rightAccessory={
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{firstName[0]?.toUpperCase() ?? "C"}</Text>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            colors={[colors.brandRed]}
            onRefresh={() => allMenusQuery.refetch()}
            refreshing={allMenusQuery.isFetching && !allMenusQuery.isLoading}
            tintColor={colors.brandRed}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.actionGrid}>
          <ActionTile
            icon={Plus}
            onPress={() => router.push({ pathname: "/menu-create", params: { scope: "GLOBAL" } })}
            subtitle="Desde cero"
            title="Crear menú"
          />
          <ActionTile
            disabled={cloneMutation.isPending || (!latestMenu && !allMenusQuery.isLoading)}
            icon={Copy}
            onPress={() => cloneMutation.mutate()}
            subtitle={
              allMenusQuery.isLoading
                ? "Buscando último..."
                : latestMenu
                ? `Último — ${formatShortDate(latestMenu.date)}`
                : "Sin menús previos"
            }
            title="Clonar"
          />
        </View>

        <View style={styles.todayHeader}>
          <Text style={styles.todayLabel}>Hoy</Text>
          <Text style={styles.todayHint}>{todayMenus.length} resultado{todayMenus.length === 1 ? "" : "s"}</Text>
        </View>

        {allMenusQuery.isLoading ? (
          <View style={styles.list}>
            <Skeleton.Card height={140} />
            <Skeleton.Card height={140} />
            <Skeleton.Card height={140} />
          </View>
        ) : todayMenus.length === 0 ? (
          <EmptyState
            icon={Utensils}
            message="No creaste ningún menú para hoy todavía."
            title="Sin menús"
          />
        ) : (
          <View style={styles.list}>
            {todayMenus.map((menu) => (
              <MenuCard
                key={`${menu.scope}-${menu.id}`}
                menu={menu}
                onDelete={() => setDeletingMenuId(menu.id)}
                onEdit={() =>
                  router.push({
                    pathname: "/menu-create",
                    params: { id: menu.id, date: menu.date.slice(0, 10) },
                  })
                }
                onPublish={() => publishMutation.mutate(menu.id)}
                onShare={() => shareMutation.mutate(menu.id)}
                publishing={publishMutation.isPending}
              />
            ))}
          </View>
        )}

        {upcomingMenus.length > 0 && (
          <>
            <View style={styles.todayHeader}>
              <Text style={styles.todayLabel}>Próximos</Text>
              <Text style={styles.todayHint}>
                {upcomingMenus.length} {upcomingMenus.length === 1 ? "menú" : "menús"}
              </Text>
            </View>
            <View style={styles.upcomingList}>
              {upcomingMenus.map((menu) => (
                <UpcomingMenuRow
                  key={`${menu.scope}-${menu.id}`}
                  menu={menu}
                  onPress={() =>
                    router.push({
                      pathname: "/menu-create",
                      params: { id: menu.id, date: menu.date.slice(0, 10) },
                    })
                  }
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <DangerConfirmModal
        bullets={["Items del menú", "Pedidos asociados"]}
        description="Esta acción es permanente. Se va a borrar el menú y todo lo que contiene."
        destructiveLabel="Eliminar menú"
        loading={deleteMutation.isPending}
        onCancel={() => setDeletingMenuId(null)}
        onConfirm={() => {
          if (deletingMenuId) deleteMutation.mutate(deletingMenuId);
        }}
        title="¿Eliminar este menú?"
        visible={deletingMenuId !== null}
      />
    </View>
  );
}


function ActionTile({
  icon: Icon,
  onPress,
  subtitle,
  title,
  disabled = false,
}: {
  icon: typeof Plus;
  onPress: () => void;
  subtitle: string;
  title: string;
  disabled?: boolean;
}) {
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation(0.96);

  return (
    <Animated.View style={[styles.actionTileWrapper, animatedStyle]}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.actionTile, disabled && { opacity: 0.5 }]}
      >
        <View style={styles.actionTileIcon}>
          <Icon color={colors.brandRed} size={20} strokeWidth={1.8} />
        </View>
        <View style={styles.actionTileCopy}>
          <Text style={styles.actionTileTitle}>{title}</Text>
          <Text style={styles.actionTileSubtitle}>{subtitle}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function MenuCard({
  menu,
  onDelete,
  onEdit,
  onPublish,
  onShare,
  publishing,
}: {
  menu: MenuResponse;
  onDelete: () => void;
  onEdit: () => void;
  onPublish: () => void;
  onShare: () => void;
  publishing: boolean;
}) {
  const previewItems = menu.items.slice(0, 3);
  const companyLabel =
    menu.scope === "GLOBAL"
      ? `${menu.companies.length} empresas`
      : menu.companyName ?? "Empresa sin nombre";

  const accentColor = menu.status === "PUBLISHED" ? colors.success : colors.warning;

  return (
    <Card style={{ ...styles.card, borderLeftColor: accentColor, borderLeftWidth: 3 }}>
      <View style={styles.cardHeader}>
        <View style={styles.menuInfo}>
          <View style={styles.scopeRow}>
            {menu.scope === "GLOBAL" && <Globe2 color={colors.brandRed} size={17} />}
            <Text style={styles.cardTitle}>{companyLabel}</Text>
          </View>
          <View style={styles.metaRow}>
            <Clock color={colors.muted} size={16} strokeWidth={1.8} />
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
                  <ImageOff color={colors.muted} size={18} strokeWidth={1.8} />
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
          <>
            <Button
              icon={Pencil}
              onPress={onEdit}
              size="small"
              title="Editar"
              variant="ghost"
            />
            <Button
              icon={Send}
              loading={publishing}
              onPress={onPublish}
              size="small"
              title="Publicar"
              variant="primary"
            />
          </>
        ) : (
          <Button
            icon={MessageCircle}
            onPress={onShare}
            size="small"
            title="Compartir"
            variant="secondary"
          />
        )}
        <Pressable
          hitSlop={8}
          onPress={onDelete}
          style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
        >
          <Trash2 color={colors.muted} size={17} strokeWidth={1.8} />
        </Pressable>
      </View>
    </Card>
  );
}

function UpcomingMenuRow({
  menu,
  onPress,
}: {
  menu: MenuResponse;
  onPress: () => void;
}) {
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation(0.97);
  const companyLabel =
    menu.scope === "GLOBAL"
      ? "Global"
      : menu.companyName ?? "Empresa sin nombre";
  const itemsLabel = `${menu.items.length} ${menu.items.length === 1 ? "ítem" : "ítems"}`;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.upcomingRow}
      >
        <View style={styles.upcomingDateChip}>
          <CalendarClock color={colors.brandRed} size={16} strokeWidth={1.8} />
          <Text style={styles.upcomingDateText}>{formatShortDate(menu.date)}</Text>
        </View>
        <View style={styles.upcomingCopy}>
          <Text numberOfLines={1} style={styles.upcomingTitle}>
            {companyLabel}
          </Text>
          <Text numberOfLines={1} style={styles.upcomingMeta}>
            {itemsLabel} · Cierra {menu.orderClosesAt}
          </Text>
        </View>
        <StatusPill
          label={menu.status === "PUBLISHED" ? "Publicado" : "Borrador"}
          tone={menu.status === "PUBLISHED" ? "success" : "warning"}
        />
      </Pressable>
    </Animated.View>
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
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.brandRed,
    borderRadius: radius.pill,
    height: 40,
    justifyContent: "center",
    width: 40,
    ...shadows.brand,
  },
  avatarText: {
    color: colors.onBrand,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  actionGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionTileWrapper: {
    flex: 1,
  },
  actionTile: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...shadows.sm,
  },
  actionTileIcon: {
    alignItems: "center",
    backgroundColor: colors.redSoft,
    borderRadius: radius.sm,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  actionTileCopy: {
    flex: 1,
    gap: 1,
  },
  actionTileTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.1,
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
  upcomingList: {
    gap: spacing.sm,
  },
  upcomingRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...shadows.sm,
  },
  upcomingDateChip: {
    alignItems: "center",
    backgroundColor: colors.redSoft,
    borderRadius: radius.sm,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  upcomingDateText: {
    ...typography.captionStrong,
    color: colors.brandRed,
  },
  upcomingCopy: {
    flex: 1,
    gap: 2,
  },
  upcomingTitle: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  upcomingMeta: {
    ...typography.caption,
    color: colors.muted,
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
  deleteButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 34,
    justifyContent: "center",
    marginLeft: "auto",
    width: 34,
  },
  deleteButtonPressed: {
    backgroundColor: colors.redSoft,
    opacity: 0.8,
  },
});
