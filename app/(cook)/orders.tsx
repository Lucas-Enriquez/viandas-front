import { useMemo } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  Ban,
  CheckCircle2,
  ChefHat,
  Clock,
  PackageCheck,
  RefreshCw,
  Truck,
} from "lucide-react-native";

import { getApiErrorMessage } from "../../src/api/client";
import { deliveryApi } from "../../src/api/delivery";
import { ordersApi, type OrderAction } from "../../src/api/orders";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { EmptyState, ErrorState, LoadingState } from "../../src/components/StateViews";
import { Screen } from "../../src/components/Screen";
import { StatusPill } from "../../src/components/StatusPill";
import { startDeliveryTracking } from "../../src/services/locationTask";
import { colors, spacing, typography } from "../../src/theme";
import type { OrderResponse, OrderStatus } from "../../src/types";
import { formatMoney } from "../../src/utils/format";

const STATUS_GROUPS: Array<{ label: string; status: OrderStatus }> = [
  { label: "Recibidos", status: "RECEIVED" },
  { label: "En preparación", status: "PREPARING" },
  { label: "En reparto", status: "OUT_FOR_DELIVERY" },
  { label: "Cerca", status: "NEARBY" },
  { label: "Entregados", status: "DELIVERED" },
  { label: "Cancelados", status: "CANCELLED" },
];

export default function OrdersScreen() {
  const queryClient = useQueryClient();
  const ordersQuery = useQuery({
    queryFn: ordersApi.today,
    queryKey: ["orders", "today"],
    refetchInterval: 20_000,
  });

  const orderActionMutation = useMutation({
    mutationFn: ({ action, id }: { action: OrderAction; id: string }) =>
      ordersApi.updateStatus(id, action),
    onError: (error) => {
      Alert.alert("No pudimos actualizar el pedido", getApiErrorMessage(error));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", "today"] });
    },
  });

  const startDeliveryMutation = useMutation({
    mutationFn: async ({ companyId, menuId }: { companyId: string; menuId: string }) => {
      const session = await deliveryApi.start({ companyId, menuId });
      await startDeliveryTracking(session);
      return session;
    },
    onError: (error) => {
      Alert.alert("No pudimos iniciar el reparto", getApiErrorMessage(error));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", "today"] });
      router.replace("/delivery");
    },
  });

  const orders = ordersQuery.data ?? [];
  const batches = useMemo(() => groupByDeliveryBatch(orders), [orders]);
  const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  if (ordersQuery.isLoading) {
    return <LoadingState label="Cargando pedidos..." />;
  }

  if (ordersQuery.isError) {
    return (
      <ErrorState
        actionLabel="Reintentar"
        icon={RefreshCw}
        message={getApiErrorMessage(ordersQuery.error)}
        onAction={() => ordersQuery.refetch()}
        title="No pudimos cargar los pedidos"
      />
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Pedidos</Text>
        <Text style={styles.title}>Pedidos de hoy</Text>
        <Text style={styles.subtitle}>Se actualiza automáticamente cada 20 segundos.</Text>
      </View>

      <Card style={styles.summary}>
        <View>
          <Text style={styles.summaryValue}>{orders.length}</Text>
          <Text style={styles.summaryLabel}>pedidos</Text>
        </View>
        <View>
          <Text style={styles.summaryValue}>{formatMoney(totalAmount)}</Text>
          <Text style={styles.summaryLabel}>total estimado</Text>
        </View>
      </Card>

      <Button
        icon={RefreshCw}
        onPress={() => ordersQuery.refetch()}
        title="Actualizar"
        variant="secondary"
      />

      {orders.length === 0 ? (
        <EmptyState
          icon={PackageCheck}
          message="Cuando entren pedidos para tus menús, los vas a ver acá."
          title="Sin pedidos"
        />
      ) : (
        <View style={styles.groups}>
          {batches.map((batch) => (
            <Card key={batch.key} style={styles.batchCard}>
              <View style={styles.batchHeader}>
                <View style={styles.batchInfo}>
                  <Text style={styles.batchTitle}>Menú {shortId(batch.menuId)}</Text>
                  <Text style={styles.batchMeta}>Empresa {shortId(batch.companyId)}</Text>
                </View>
                <Button
                  icon={Truck}
                  loading={startDeliveryMutation.isPending}
                  onPress={() =>
                    startDeliveryMutation.mutate({
                      companyId: batch.companyId,
                      menuId: batch.menuId,
                    })
                  }
                  size="small"
                  title="Iniciar reparto"
                />
              </View>

              {STATUS_GROUPS.map((group) => {
                const groupOrders = batch.orders.filter(
                  (order) => order.status === group.status,
                );
                if (groupOrders.length === 0) {
                  return null;
                }
                return (
                  <View key={group.status} style={styles.statusGroup}>
                    <View style={styles.groupHeader}>
                      <Text style={styles.groupTitle}>{group.label}</Text>
                      <StatusPill label={String(groupOrders.length)} tone="neutral" />
                    </View>
                    {groupOrders.map((order) => (
                      <OrderCard
                        isMutating={orderActionMutation.isPending}
                        key={order.id}
                        onAction={(action) =>
                          orderActionMutation.mutate({ action, id: order.id })
                        }
                        order={order}
                      />
                    ))}
                  </View>
                );
              })}
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

function OrderCard({
  isMutating,
  onAction,
  order,
}: {
  isMutating: boolean;
  onAction: (action: OrderAction) => void;
  order: OrderResponse;
}) {
  const actions = getActionsForStatus(order.status);

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderTitleBlock}>
          <Text style={styles.customer}>{order.customerName}</Text>
          <View style={styles.orderMetaRow}>
            <Clock color={colors.muted} size={15} strokeWidth={2.3} />
            <Text style={styles.orderMeta}>
              {new Date(order.createdAt).toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </View>
        <Text style={styles.total}>{formatMoney(order.totalAmount)}</Text>
      </View>

      <View style={styles.items}>
        {order.items.map((item) => (
          <View key={`${order.id}-${item.menuItemId}`} style={styles.itemRow}>
            <Text style={styles.itemQty}>x{item.quantity}</Text>
            <View style={styles.itemTextBlock}>
              <Text style={styles.itemName}>{item.name}</Text>
              {!!item.comment && <Text style={styles.comment}>{item.comment}</Text>}
            </View>
            <Text style={styles.itemPrice}>{formatMoney(item.unitPrice)}</Text>
          </View>
        ))}
      </View>

      {actions.length > 0 && (
        <View style={styles.actions}>
          {actions.map((action) => (
            <Button
              disabled={isMutating}
              icon={action.icon}
              key={action.action}
              onPress={() => onAction(action.action)}
              size="small"
              title={action.label}
              variant={action.variant}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function getActionsForStatus(status: OrderStatus) {
  switch (status) {
    case "RECEIVED":
      return [
        { action: "preparing" as const, icon: ChefHat, label: "Preparar", variant: "secondary" as const },
        { action: "cancel" as const, icon: Ban, label: "Cancelar", variant: "ghost" as const },
      ];
    case "PREPARING":
      return [
        { action: "out-for-delivery" as const, icon: Truck, label: "En reparto", variant: "secondary" as const },
        { action: "cancel" as const, icon: Ban, label: "Cancelar", variant: "ghost" as const },
      ];
    case "OUT_FOR_DELIVERY":
    case "NEARBY":
      return [
        { action: "delivered" as const, icon: CheckCircle2, label: "Entregado", variant: "secondary" as const },
      ];
    default:
      return [];
  }
}

function groupByDeliveryBatch(orders: OrderResponse[]) {
  const map = new Map<string, { companyId: string; key: string; menuId: string; orders: OrderResponse[] }>();
  orders.forEach((order) => {
    const key = `${order.companyId}:${order.menuId}`;
    const current = map.get(key) ?? {
      companyId: order.companyId,
      key,
      menuId: order.menuId,
      orders: [],
    };
    current.orders.push(order);
    map.set(key, current);
  });
  return Array.from(map.values());
}

function shortId(id: string) {
  return id.slice(0, 8);
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  batchCard: {
    gap: spacing.md,
  },
  batchHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  batchInfo: {
    flex: 1,
  },
  batchMeta: {
    ...typography.caption,
    color: colors.muted,
  },
  batchTitle: {
    ...typography.h2,
    color: colors.ink,
  },
  comment: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  customer: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  eyebrow: {
    ...typography.captionStrong,
    color: colors.brandRed,
  },
  groupHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  groupTitle: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  groups: {
    gap: spacing.lg,
    marginTop: spacing.sm,
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
  orderCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    gap: spacing.md,
    padding: spacing.md,
  },
  orderHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  orderMeta: {
    ...typography.caption,
    color: colors.muted,
  },
  orderMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  orderTitleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  statusGroup: {
    gap: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
  },
  summary: {
    flexDirection: "row",
    gap: spacing.lg,
    justifyContent: "space-between",
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  summaryValue: {
    ...typography.h2,
    color: colors.ink,
  },
  title: {
    ...typography.h1,
    color: colors.ink,
  },
  total: {
    ...typography.bodyStrong,
    color: colors.brandRed,
  },
});
