import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { ClipboardCheck, MessageSquare, RefreshCw, ShoppingBag, Trash2, X } from "lucide-react-native";

import { getApiErrorMessage } from "../../src/api/client";
import { employeeApi } from "../../src/api/employee";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { Hero } from "../../src/components/Hero";
import { Skeleton } from "../../src/components/Skeleton";
import { ErrorState } from "../../src/components/StateViews";
import { StatusPill } from "../../src/components/StatusPill";
import { useToast } from "../../src/providers/ToastProvider";
import { colors, radius, spacing, typography } from "../../src/theme";
import { todayYmd } from "../../src/utils/date";
import { formatMoney } from "../../src/utils/format";
import type { OrderItemResponse } from "../../src/types";

export default function EmployeeOrderScreen() {
  const date = todayYmd();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [editingItem, setEditingItem] = useState<OrderItemResponse | null>(null);
  const [commentDraft, setCommentDraft] = useState("");

  const orderQuery = useQuery({
    queryFn: () => employeeApi.currentOrder(date),
    queryKey: ["employee", "current-order", date],
  });

  const cancelMutation = useMutation({
    mutationFn: () => employeeApi.cancelOrder(date),
    onError: (error) => {
      toast.show({
        title: "No pudimos cancelar el pedido",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee", "current-order"] });
      toast.show({
        title: "Pedido cancelado",
        message: "Podés volver a pedir mientras el menú esté abierto.",
        tone: "success",
      });
      router.replace("/employee-menu");
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ itemId, comment }: { itemId: string; comment: string | null }) =>
      employeeApi.updateItemComment(date, itemId, comment),
    onError: (error) => {
      toast.show({
        title: "No pudimos guardar el comentario",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee", "current-order"] });
      setEditingItem(null);
      toast.show({
        title: "Comentario guardado",
        message: "",
        tone: "success",
      });
    },
  });

  const handleCancelOrder = () => {
    Alert.alert(
      "Cancelar pedido",
      "¿Estás seguro? Si cancelás, el pedido se eliminará y tendrás que volver a pedirlo.",
      [
        { text: "No, mantener", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: () => cancelMutation.mutate(),
        },
      ],
    );
  };

  const openEditComment = (item: OrderItemResponse) => {
    setEditingItem(item);
    setCommentDraft(item.comment ?? "");
  };

  const saveComment = () => {
    if (!editingItem) return;
    const trimmed = commentDraft.trim();
    commentMutation.mutate({
      itemId: editingItem.menuItemId,
      comment: trimmed.length > 0 ? trimmed : null,
    });
  };

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
  const canStillOrder = current?.canOrder === true;
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
            <ClipboardCheck color={colors.onBrand} size={24} strokeWidth={1.8} />
          </View>
        }
        subtitle={heroSubtitle}
        title={heroTitle}
        tone="ink"
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
              <ShoppingBag color={colors.brandRed} size={32} strokeWidth={1.8} />
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
                <StatusPill label={statusLabel(order.status)} tone={statusTone(order.status)} />
                <Text style={styles.total}>{formatMoney(order.totalAmount)}</Text>
              </View>

              <View style={styles.items}>
                {order.items.map((item) => (
                  <ItemRow
                    canEdit={canStillOrder && order.status === "RECEIVED"}
                    item={item}
                    key={item.menuItemId}
                    onEditComment={() => openEditComment(item)}
                  />
                ))}
              </View>
            </Card>

            <View style={styles.actions}>
              <Button
                icon={RefreshCw}
                onPress={() => orderQuery.refetch()}
                title="Actualizar"
                variant="secondary"
              />
              {canStillOrder && order.status === "RECEIVED" && (
                <Button
                  icon={Trash2}
                  loading={cancelMutation.isPending}
                  onPress={handleCancelOrder}
                  title="Cancelar pedido"
                  variant="danger"
                />
              )}
            </View>
          </>
        )}
      </ScrollView>

      <CommentModal
        item={editingItem}
        loading={commentMutation.isPending}
        onCancel={() => setEditingItem(null)}
        onSave={saveComment}
        onChangeText={setCommentDraft}
        value={commentDraft}
      />
    </View>
  );
}

function ItemRow({
  item,
  canEdit,
  onEditComment,
}: {
  item: OrderItemResponse;
  canEdit: boolean;
  onEditComment: () => void;
}) {
  return (
    <View style={styles.itemRow}>
      <Text style={styles.itemQty}>x{item.quantity}</Text>
      <View style={styles.itemTextBlock}>
        <Text style={styles.itemName}>{item.name}</Text>
        {canEdit ? (
          <Pressable onPress={onEditComment} style={styles.commentRow}>
            <MessageSquare color={colors.muted} size={13} strokeWidth={1.8} />
            <Text style={styles.commentEditable}>
              {item.comment ?? "Agregar comentario"}
            </Text>
          </Pressable>
        ) : (
          !!item.comment && <Text style={styles.comment}>{item.comment}</Text>
        )}
      </View>
      <Text style={styles.itemPrice}>{formatMoney(item.unitPrice)}</Text>
    </View>
  );
}

function CommentModal({
  item,
  loading,
  value,
  onChangeText,
  onSave,
  onCancel,
}: {
  item: OrderItemResponse | null;
  loading: boolean;
  value: string;
  onChangeText: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const visible = !!item;
  const sheetAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      sheetAnim.setValue(300);
      Animated.spring(sheetAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 18,
        bounciness: 2,
      }).start();
    }
  }, [visible, sheetAnim]);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <Pressable onPress={onCancel} style={styles.modalOverlay}>
        <Animated.View style={{ transform: [{ translateY: sheetAnim }] }}>
          <Pressable onPress={() => {}} style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comentario</Text>
              <Pressable hitSlop={10} onPress={onCancel}>
                <X color={colors.muted} size={20} strokeWidth={1.8} />
              </Pressable>
            </View>

            {item && (
              <Text style={styles.modalSubtitle} numberOfLines={1}>
                {item.name}
              </Text>
            )}

            <TextInput
              autoFocus
              maxLength={500}
              multiline
              onChangeText={onChangeText}
              placeholder="Ej: sin salsa, extra picante…"
              placeholderTextColor={colors.placeholder}
              style={styles.commentInput}
              value={value}
            />

            <View style={styles.modalActions}>
              <Button onPress={onCancel} title="Cancelar" variant="ghost" />
              <Button
                loading={loading}
                onPress={onSave}
                style={styles.modalSaveButton}
                title="Guardar"
              />
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

function statusTone(status: string): "neutral" | "warning" | "success" | "brand" {
  const tones: Record<string, "neutral" | "warning" | "success" | "brand"> = {
    RECEIVED: "neutral",
    PREPARING: "warning",
    OUT_FOR_DELIVERY: "warning",
    NEARBY: "brand",
    DELIVERED: "success",
    CANCELLED: "warning",
  };
  return tones[status] ?? "neutral";
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
  items: {
    gap: spacing.sm,
  },
  itemRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  itemTextBlock: {
    flex: 1,
    gap: 3,
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
  comment: {
    ...typography.caption,
    color: colors.muted,
  },
  commentRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  commentEditable: {
    ...typography.caption,
    color: colors.muted,
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
  },
  actions: {
    gap: spacing.sm,
  },
  total: {
    ...typography.h2,
    color: colors.brandRed,
  },
  // Comment modal
  modalOverlay: {
    backgroundColor: "rgba(0,0,0,0.45)",
    flex: 1,
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  modalHandle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    height: 4,
    marginBottom: spacing.xs,
    width: 40,
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalTitle: {
    ...typography.h2,
    color: colors.ink,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.muted,
  },
  commentInput: {
    ...typography.body,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    color: colors.ink,
    marginTop: spacing.xs,
    minHeight: 88,
    padding: spacing.md,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  modalSaveButton: {
    flex: 1,
  },
});
