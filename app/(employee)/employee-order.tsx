import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ClipboardCheck, Link2, RefreshCw, ShoppingBag } from "lucide-react-native";

import { getApiErrorMessage } from "../../src/api/client";
import { employeeApi } from "../../src/api/employee";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { Hero } from "../../src/components/Hero";
import { Skeleton } from "../../src/components/Skeleton";
import { EmptyState, ErrorState } from "../../src/components/StateViews";
import { StatusPill } from "../../src/components/StatusPill";
import { getStoredGlobalMenuLink } from "../../src/storage";
import { colors, radius, spacing, typography } from "../../src/theme";
import { formatMoney } from "../../src/utils/format";

export default function EmployeeOrderScreen() {
  const [link, setLink] = useState<{ date: string; token: string } | null>(null);

  useEffect(() => {
    getStoredGlobalMenuLink().then(setLink);
  }, []);

  const orderQuery = useQuery({
    enabled: !!link,
    queryFn: () => employeeApi.currentGlobalOrder(link!.date, link!.token),
    queryKey: ["employee", "current-order", link?.date, link?.token],
  });

  if (!link) {
    return (
      <EmptyState
        actionLabel="Abrir link"
        icon={Link2}
        message="Abrí primero un menú global para ver tu pedido."
        onAction={() => router.push("/global-token")}
        title="Sin menú activo"
      />
    );
  }

  if (orderQuery.isError) {
    return (
      <ErrorState
        actionLabel="Reintentar"
        icon={RefreshCw}
        message={getApiErrorMessage(orderQuery.error)}
        onAction={() => orderQuery.refetch()}
        title="No pudimos cargar tu pedido"
      />
    );
  }

  const current = orderQuery.data;
  const order = current?.order;
  const isLoading = orderQuery.isLoading;

  const heroTitle = order ? `Pedido ${order.id.slice(0, 8)}` : "Mi pedido";
  const heroSubtitle = order
    ? statusLabel(order.status)
    : current?.message ?? "Cargando…";

  return (
    <View style={styles.root}>
      <Hero
        eyebrow="Mi pedido"
        rightAccessory={
          <View style={styles.heroIcon}>
            <ClipboardCheck color={colors.onBrand} size={24} strokeWidth={2.4} />
          </View>
        }
        subtitle={heroSubtitle}
        title={heroTitle}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.skeletonGroup}>
            <Skeleton.Card height={180} />
            <Skeleton.Card height={120} />
          </View>
        ) : !order ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <ShoppingBag color={colors.brandRed} size={32} strokeWidth={2.4} />
            </View>
            <Text style={styles.emptyTitle}>Sin pedido</Text>
            <Text style={styles.emptyMessage}>
              {current?.message ?? "Todavía no hiciste un pedido para este menú."}
            </Text>
            <Button
              onPress={() => router.push("/employee-menu")}
              title="Ver menú"
              variant="secondary"
            />
          </Card>
        ) : (
          <>
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <StatusPill label={statusLabel(order.status)} tone="success" />
                <Text style={styles.total}>{formatMoney(order.totalAmount)}</Text>
              </View>

              <View style={styles.items}>
                {order.items.map((item) => (
                  <View key={item.menuItemId} style={styles.itemRow}>
                    <Text style={styles.itemQty}>x{item.quantity}</Text>
                    <View style={styles.itemTextBlock}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {!!item.comment && <Text style={styles.comment}>{item.comment}</Text>}
                    </View>
                    <Text style={styles.itemPrice}>{formatMoney(item.unitPrice)}</Text>
                  </View>
                ))}
              </View>
            </Card>

            <Button
              icon={RefreshCw}
              onPress={() => orderQuery.refetch()}
              title="Actualizar"
              variant="secondary"
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    CANCELLED: "Cancelado",
    DELIVERED: "Entregado",
    NEARBY: "Cerca",
    OUT_FOR_DELIVERY: "En reparto",
    PREPARING: "En preparación",
    RECEIVED: "Recibido",
  };
  return labels[status] ?? status;
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
  emptyCard: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: colors.redSoft,
    borderRadius: radius.lg,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.ink,
    textAlign: "center",
  },
  emptyMessage: {
    ...typography.body,
    color: colors.muted,
    maxWidth: 300,
    textAlign: "center",
  },
  card: {
    gap: spacing.md,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  comment: {
    ...typography.caption,
    color: colors.muted,
  },
  itemName: {
    ...typography.body,
    color: colors.ink,
  },
  itemPrice: {
    ...typography.captionStrong,
    color: colors.ink,
  },
  itemQty: {
    ...typography.captionStrong,
    color: colors.brandRed,
    minWidth: 30,
  },
  itemRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  itemTextBlock: {
    flex: 1,
  },
  items: {
    gap: spacing.sm,
  },
  total: {
    ...typography.h2,
    color: colors.brandRed,
  },
});
