import { useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  CalendarDays,
  Clock,
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
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { EmptyState, ErrorState, LoadingState } from "../../src/components/StateViews";
import { Screen } from "../../src/components/Screen";
import { StatusPill } from "../../src/components/StatusPill";
import { colors, spacing, typography } from "../../src/theme";
import type { MenuResponse, MenuScope } from "../../src/types";
import { formatMenuDate, todayYmd } from "../../src/utils/date";
import { formatMoney } from "../../src/utils/format";

export default function MenusScreen() {
  const [scope, setScope] = useState<MenuScope>("COMPANY");
  const date = todayYmd();
  const queryClient = useQueryClient();

  const menusQuery = useQuery({
    queryFn: () => menusApi.list({ date }),
    queryKey: ["menus", date],
  });

  const publishMutation = useMutation({
    mutationFn: menusApi.publish,
    onError: (error) => {
      Alert.alert("No pudimos publicar el menú", getApiErrorMessage(error));
    },
    onSuccess: async (share) => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      await shareMenu(share.whatsappText || share.publicUrl);
    },
  });

  const shareMutation = useMutation({
    mutationFn: menusApi.shareMessage,
    onError: (error) => {
      Alert.alert("No pudimos obtener el link", getApiErrorMessage(error));
    },
    onSuccess: async (share) => {
      await shareMenu(share.whatsappText || share.publicUrl);
    },
  });

  if (menusQuery.isLoading) {
    return <LoadingState label="Cargando menús..." />;
  }

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

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Menús</Text>
        <Text style={styles.title}>Menús de hoy</Text>
        <Text style={styles.subtitle}>{formatMenuDate(date)}</Text>
      </View>

      <View style={styles.segmented}>
        {(["COMPANY", "GLOBAL"] as MenuScope[]).map((option) => (
          <Pressable
            key={option}
            onPress={() => setScope(option)}
            style={[styles.segment, scope === option && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, scope === option && styles.segmentTextActive]}>
              {option === "COMPANY" ? "Por empresa" : "Global"}
            </Text>
          </Pressable>
        ))}
      </View>

      <Button
        icon={Plus}
        onPress={() => router.push({ pathname: "/menu-create", params: { scope } })}
        title={scope === "COMPANY" ? "Crear menú por empresa" : "Crear menú global"}
        variant="secondary"
      />

      {menus.length === 0 ? (
        <EmptyState
          actionLabel="Crear menú"
          icon={Utensils}
          message={
            scope === "COMPANY"
              ? "No hay menús por empresa para hoy."
              : "No hay menús globales para hoy."
          }
          onAction={() => router.push({ pathname: "/menu-create", params: { scope } })}
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
    </Screen>
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

      <View style={styles.footer}>
        <View style={styles.metaRow}>
          <CalendarDays color={colors.brandRed} size={16} strokeWidth={2.4} />
          <Text style={styles.footerText}>{menu.items.length} items</Text>
        </View>
      </View>

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
            style={styles.fullWidthButton}
            title="Compartir por WhatsApp"
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
    // If WhatsApp is not installed or cannot handle the URL, use the native share sheet.
  }

  try {
    await Share.share({ message });
  } catch {
    Alert.alert("No pudimos compartir", message);
  }
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  cardActions: {
    flexDirection: "row",
    flexWrap: "wrap",
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
  eyebrow: {
    ...typography.captionStrong,
    color: colors.brandRed,
  },
  footer: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
  footerText: {
    ...typography.bodyStrong,
    color: colors.brandRed,
  },
  fullWidthButton: {
    alignSelf: "stretch",
    width: "100%",
  },
  header: {
    gap: spacing.xs,
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
    borderRadius: 8,
    height: 48,
    width: 48,
  },
  itemImageFallback: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
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
  list: {
    gap: spacing.md,
    marginTop: spacing.sm,
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
  segment: {
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
  },
  segmentActive: {
    backgroundColor: colors.brandRed,
  },
  segmented: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
  },
  segmentText: {
    ...typography.captionStrong,
    color: colors.muted,
  },
  segmentTextActive: {
    color: colors.onBrand,
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
  },
  title: {
    ...typography.h1,
    color: colors.ink,
  },
});
