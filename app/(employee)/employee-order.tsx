import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ClipboardCheck, Link2, RefreshCw, ShoppingBag } from "lucide-react-native";

import { getApiErrorMessage } from "../../src/api/client";
import { employeeApi } from "../../src/api/employee";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { EmptyState, ErrorState, LoadingState } from "../../src/components/StateViews";
import { Screen } from "../../src/components/Screen";
import { StatusPill } from "../../src/components/StatusPill";
import { getStoredGlobalMenuLink } from "../../src/storage";
import { colors, spacing, typography } from "../../src/theme";
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

  if (orderQuery.isLoading) {
    return <LoadingState label="Buscando tu pedido..." />;
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

  if (!order) {
    return (
      <EmptyState
        actionLabel="Ver menú"
        icon={ShoppingBag}
        message={current?.message ?? "Todavía no hiciste un pedido para este menú."}
        onAction={() => router.push("/employee-menu")}
        title="Sin pedido"
      />
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Mi pedido</Text>
        <Text style={styles.title}>Pedido {order.id.slice(0, 8)}</Text>
        <Text style={styles.subtitle}>{current?.message}</Text>
      </View>

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
        icon={ClipboardCheck}
        onPress={() => orderQuery.refetch()}
        title="Actualizar"
        variant="secondary"
      />
    </Screen>
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
  eyebrow: {
    ...typography.captionStrong,
    color: colors.brandRed,
  },
  header: {
    gap: spacing.xs,
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
  subtitle: {
    ...typography.body,
    color: colors.muted,
  },
  title: {
    ...typography.h1,
    color: colors.ink,
  },
  total: {
    ...typography.h2,
    color: colors.brandRed,
  },
});
