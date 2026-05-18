import { useMemo } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  Ban,
  CheckCircle2,
  ChefHat,
  Circle,
  Clock,
  PackageCheck,
  RefreshCw,
  Truck,
} from "lucide-react-native";

import { getApiErrorMessage } from "../../../src/api/client";
import { deliveryApi } from "../../../src/api/delivery";
import { ordersApi, type OrderAction } from "../../../src/api/orders";
import { Button } from "../../../src/components/Button";
import { Card } from "../../../src/components/Card";
import { Hero } from "../../../src/components/Hero";
import { Skeleton } from "../../../src/components/Skeleton";
import { EmptyState, ErrorState } from "../../../src/components/StateViews";
import { StatusPill } from "../../../src/components/StatusPill";
import { startDeliveryTracking } from "../../../src/services/locationTask";
import { useToast } from "../../../src/providers/ToastProvider";
import { colors, radius, spacing, typography } from "../../../src/theme";
import type { OrderResponse, OrderStatus } from "../../../src/types";
import { formatMoney } from "../../../src/utils/format";

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
  const toast = useToast();
  const ordersQuery = useQuery({
    queryFn: ordersApi.today,
    queryKey: ["orders", "today"],
    refetchInterval: 20_000,
  });

  const orderActionMutation = useMutation({
    mutationFn: ({ action, id }: { action: OrderAction; id: string }) =>
      ordersApi.updateStatus(id, action),
    onError: (error) => {
      toast.show({
        title: "No pudimos actualizar el pedido",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", "today"] });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ id, paid }: { id: string; paid: boolean }) =>
      ordersApi.markPaid(id, paid),
    onError: (error) => {
      toast.show({
        title: "No pudimos actualizar el pago",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", "today"] });
    },
  });

  const markMenuPreparingMutation = useMutation({
    mutationFn: (menuId: string) => ordersApi.markMenuPreparing(menuId),
    onError: (error) => {
      toast.show({
        title: "No pudimos actualizar los pedidos",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<OrderResponse[]>(["orders", "today"], (current) => {
        if (!current) return current;
        const byId = new Map(updated.map((o) => [o.id, o]));
        return current.map((o) => byId.get(o.id) ?? o);
      });
    },
  });

  const startDeliveryMutation = useMutation({
    mutationFn: async ({ companyId, menuId }: { companyId: string; menuId: string }) => {
      const session = await deliveryApi.start({ companyId, menuId });
      await startDeliveryTracking(session);
      return session;
    },
    onError: (error) => {
      toast.show({
        title: "No pudimos iniciar el reparto",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", "today"] });
      queryClient.invalidateQueries({ queryKey: ["delivery", "active"] });
      router.replace("/delivery");
    },
  });

  const orders = ordersQuery.data ?? [];
  const batches = useMemo(() => groupByDeliveryBatch(orders), [orders]);
  const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const inKitchen = orders.filter(
    (o) => o.status === "RECEIVED" || o.status === "PREPARING",
  ).length;
  const onRoute = orders.filter(
    (o) => o.status === "OUT_FOR_DELIVERY" || o.status === "NEARBY",
  ).length;

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

  const isLoading = ordersQuery.isLoading;

  return (
    <View style={styles.root}>
      <Hero
        tone="ink"
        eyebrow="Pedidos"
        title="Pedidos de hoy"
        subtitle="Actualización en vivo."
      >
        <View style={styles.statsRow}>
          <StatChip label={String(orders.length)} caption={orders.length === 1 ? "pedido" : "pedidos"} />
          <StatChip label={String(inKitchen)} caption="en cocina" />
          <StatChip label={String(onRoute)} caption="en reparto" />
        </View>
      </Hero>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            colors={[colors.brandRed]}
            onRefresh={() => ordersQuery.refetch()}
            refreshing={ordersQuery.isFetching && !ordersQuery.isLoading}
            tintColor={colors.brandRed}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total estimado</Text>
          <Text style={styles.totalValue}>{formatMoney(totalAmount)}</Text>
        </View>

        {isLoading ? (
          <View style={styles.skeletonGroup}>
            <Skeleton.Card height={120} />
            <Skeleton.Card height={140} />
            <Skeleton.Card height={120} />
          </View>
        ) : orders.length === 0 ? (
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

                {batch.orders.some((o) => o.status === "RECEIVED") && (
                  <Button
                    icon={ChefHat}
                    loading={markMenuPreparingMutation.isPending}
                    onPress={() => markMenuPreparingMutation.mutate(batch.menuId)}
                    size="small"
                    title="Marcar todos en preparación"
                    variant="secondary"
                  />
                )}

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
                          isPaymentMutating={markPaidMutation.isPending}
                          key={order.id}
                          onAction={(action) =>
                            orderActionMutation.mutate({ action, id: order.id })
                          }
                          onTogglePaid={() =>
                            markPaidMutation.mutate({ id: order.id, paid: !order.paid })
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

function OrderCard({
  isMutating,
  isPaymentMutating,
  onAction,
  onTogglePaid,
  order,
}: {
  isMutating: boolean;
  isPaymentMutating: boolean;
  onAction: (action: OrderAction) => void;
  onTogglePaid: () => void;
  order: OrderResponse;
}) {
  const actions = getActionsForStatus(order.status);

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderTitleBlock}>
          <Text style={styles.customer}>{order.customerName}</Text>
          <View style={styles.orderMetaRow}>
            <Clock color={colors.muted} size={15} strokeWidth={1.8} />
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

      <View style={styles.paidBlock}>
        <Pressable
          disabled={isPaymentMutating}
          hitSlop={6}
          onPress={onTogglePaid}
          style={({ pressed }) => [
            styles.paidPill,
            order.paid ? styles.paidPillOn : styles.paidPillOff,
            (pressed || isPaymentMutating) && { opacity: 0.6 },
          ]}
        >
          {order.paid ? (
            <CheckCircle2 color={colors.success} size={16} strokeWidth={2} />
          ) : (
            <Circle color={colors.muted} size={16} strokeWidth={2} />
          )}
          <Text style={order.paid ? styles.paidPillTextOn : styles.paidPillTextOff}>
            {order.paid ? "Pagado" : "Marcar como pagado"}
          </Text>
        </Pressable>
        {order.paid && !!order.paymentNote && (
          <Text style={styles.paidNote}>{order.paymentNote}</Text>
        )}
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
  totalRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  totalLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  totalValue: {
    ...typography.bodyStrong,
    color: colors.brandRed,
  },
  skeletonGroup: {
    gap: spacing.md,
  },
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
    borderRadius: radius.md,
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
  total: {
    ...typography.bodyStrong,
    color: colors.brandRed,
  },
  paidBlock: {
    gap: 2,
  },
  paidPill: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  paidPillOn: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  paidPillOff: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
  },
  paidPillTextOn: {
    ...typography.captionStrong,
    color: colors.success,
  },
  paidPillTextOff: {
    ...typography.captionStrong,
    color: colors.muted,
  },
  paidNote: {
    ...typography.caption,
    color: colors.muted,
    paddingHorizontal: spacing.xs,
  },
});
