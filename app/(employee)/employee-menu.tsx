import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Image, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Minus, Plus, RefreshCw, ShoppingBag, UtensilsCrossed, X } from "lucide-react-native";

import { employeeApi } from "../../src/api/employee";
import { ApiError, getApiErrorMessage } from "../../src/api/client";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { Hero } from "../../src/components/Hero";
import { Skeleton } from "../../src/components/Skeleton";
import { ErrorState } from "../../src/components/StateViews";
import { StatusPill } from "../../src/components/StatusPill";
import { useToast } from "../../src/providers/ToastProvider";
import { colors, radius, shadows, spacing, typography } from "../../src/theme";
import type { MenuItemResponse } from "../../src/types";
import { formatMenuDate, todayYmd } from "../../src/utils/date";
import { formatMoney } from "../../src/utils/format";

type ItemDraft = Record<string, number>;

export default function EmployeeMenuScreen() {
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();
  const date = dateParam ?? todayYmd();
  const [draft, setDraft] = useState<ItemDraft>({});
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [preview, setPreview] = useState<MenuItemResponse | null>(null);
  const queryClient = useQueryClient();
  const toast = useToast();

  const menuQuery = useQuery({
    queryFn: () => employeeApi.menu(date),
    queryKey: ["employee", "menu", date],
  });

  const currentOrderQuery = useQuery({
    queryFn: () => employeeApi.currentOrder(date),
    queryKey: ["employee", "current-order", date],
  });

  const createOrderMutation = useMutation({
    mutationFn: () => {
      const menu = menuQuery.data;
      if (!menu) throw new Error("Primero cargá un menú.");

      const items = menu.items
        .map((item) => ({
          comment: null,
          menuItemId: item.id,
          quantity: clampQuantity(item, draft[item.id] ?? 0),
        }))
        .filter((item) => item.quantity > 0);
      if (items.length === 0) throw new Error("Elegí al menos un item.");
      return employeeApi.createOrder(date, { items });
    },
    onError: (error) => {
      setConfirmVisible(false);
      toast.show({
        title: "No pudimos crear el pedido",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: () => {
      setDraft({});
      setConfirmVisible(false);
      queryClient.invalidateQueries({ queryKey: ["employee", "current-order"] });
      toast.show({
        title: "Pedido creado",
        message: "Tu pedido quedó registrado.",
        tone: "success",
      });
      router.replace("/employee-order");
    },
  });

  const selectedItems = useMemo(() => {
    const menu = menuQuery.data;
    if (!menu) return [];
    return menu.items
      .map((item) => ({
        id: item.id,
        name: item.name,
        quantity: clampQuantity(item, draft[item.id] ?? 0),
        unitPrice: item.price,
      }))
      .filter((item) => item.quantity > 0);
  }, [draft, menuQuery.data]);

  const selectedTotal = useMemo(
    () => selectedItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
    [selectedItems],
  );

  const menuError = menuQuery.error;
  const isMenuNotFound =
    menuQuery.isError && menuError instanceof ApiError && menuError.status === 404;

  if (menuQuery.isError && !isMenuNotFound) {
    return (
      <ErrorState
        actionLabel="Reintentar"
        icon={RefreshCw}
        message={getApiErrorMessage(menuError)}
        onAction={() => menuQuery.refetch()}
        title="No pudimos cargar el menú"
      />
    );
  }

  const menu = menuQuery.data;
  const currentOrder = currentOrderQuery.data;
  const hasCurrentOrder = currentOrder?.hasOrder === true;
  const hasSelection =
    menu?.items.some((item) => clampQuantity(item, draft[item.id] ?? 0) > 0) ?? false;
  const disabledReason = hasCurrentOrder
    ? "Ya tenés un pedido"
    : !menu?.canOrder
      ? "El menú ya cerró"
      : !hasSelection
        ? "Elegí al menos un plato"
        : null;
  const isLoading = menuQuery.isLoading || currentOrderQuery.isLoading;
  const heroEyebrow = menu?.companyName ?? "Menú";
  const heroTitle = menu
    ? formatMenuDate(menu.date)
    : isMenuNotFound
      ? formatMenuDate(date)
      : "Cargando…";
  const heroSubtitle = menu
    ? menu.canOrder
      ? `Cierra ${menu.orderClosesAt}`
      : `Cerró ${menu.orderClosesAt}`
    : isMenuNotFound
      ? "Aún sin publicar"
      : "";

  return (
    <View style={styles.root}>
      <Hero eyebrow={heroEyebrow} subtitle={heroSubtitle} title={heroTitle} tone="ink">
        {menu && (
          <View style={styles.statsRow}>
            <StatChip label={String(menu.items.length)} caption="items" />
            <StatChip
              label={hasCurrentOrder ? "✓" : menu.canOrder ? "Abierto" : "Cerrado"}
              caption={hasCurrentOrder ? "tu pedido" : "estado"}
            />
          </View>
        )}
      </Hero>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            colors={[colors.brandRed]}
            onRefresh={() => {
              menuQuery.refetch();
              currentOrderQuery.refetch();
            }}
            refreshing={menuQuery.isFetching && !menuQuery.isLoading}
            tintColor={colors.brandRed}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.grid}>
            <Skeleton.Card height={220} style={{ width: "48%" }} />
            <Skeleton.Card height={220} style={{ width: "48%" }} />
            <Skeleton.Card height={220} style={{ width: "48%" }} />
            <Skeleton.Card height={220} style={{ width: "48%" }} />
          </View>
        ) : isMenuNotFound ? (
          <NoMenuPublishedState onRetry={() => menuQuery.refetch()} />
        ) : menu && !menu.canOrder && !hasCurrentOrder ? (
          <ClosedMenuState />
        ) : (
          <>
            {currentOrderQuery.isError && (
              <Card style={styles.notice} variant="warm">
                <StatusPill label="Aviso" tone="warning" />
                <Text style={styles.noticeText}>
                  No pudimos confirmar tu pedido actual. Si ya pediste, el backend lo va a
                  validar al enviar.
                </Text>
              </Card>
            )}

            {currentOrder?.hasOrder && (
              <Card style={styles.notice} variant="warm">
                <StatusPill label="Pedido registrado" tone="success" />
                <Text style={styles.noticeText}>{currentOrder.message}</Text>
                <Button
                  onPress={() => router.push("/employee-order")}
                  size="small"
                  title="Ver mi pedido"
                  variant="secondary"
                />
              </Card>
            )}

            <View style={styles.grid}>
              {menu?.items.map((item) => (
                <MenuItemCard
                  item={item}
                  key={item.id}
                  onChange={(quantity) =>
                    setDraft((current) => ({
                      ...current,
                      [item.id]: clampQuantity(item, quantity),
                    }))
                  }
                  onPreview={() => setPreview(item)}
                  quantity={clampQuantity(item, draft[item.id] ?? 0)}
                />
              ))}
            </View>

            <Card style={styles.checkout} variant="elevated">
              <View>
                <Text style={styles.checkoutLabel}>Total</Text>
                <Text style={styles.checkoutTotal}>{formatMoney(selectedTotal)}</Text>
                {!!disabledReason && <Text style={styles.checkoutReason}>{disabledReason}</Text>}
              </View>
              <Button
                disabled={!!disabledReason}
                icon={ShoppingBag}
                loading={createOrderMutation.isPending}
                onPress={() => setConfirmVisible(true)}
                style={styles.checkoutButton}
                title="Pedir"
              />
            </Card>
          </>
        )}
      </ScrollView>

      <ProductPreviewModal item={preview} onClose={() => setPreview(null)} />

      <ConfirmOrderModal
        items={selectedItems}
        loading={createOrderMutation.isPending}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => createOrderMutation.mutate()}
        total={selectedTotal}
        visible={confirmVisible}
      />
    </View>
  );
}

function ProductPreviewModal({
  item,
  onClose,
}: {
  item: MenuItemResponse | null;
  onClose: () => void;
}) {
  if (!item) return null;

  const maxQuantity = getMaxQuantity(item);
  const isSoldOut = typeof item.remainingStock === "number" && maxQuantity === 0;

  const CATEGORY_LABEL: Record<string, string> = {
    ENSALADA: "Ensalada",
    MINUTA: "Minuta",
    PLATO: "Plato",
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible statusBarTranslucent>
      <SafeAreaView edges={["top"]} style={styles.previewRoot}>
        {/* Photo */}
        <View style={styles.previewPhotoWrap}>
          {item.photoUrl ? (
            <Image
              resizeMode="cover"
              source={{ uri: item.photoUrl }}
              style={styles.previewPhoto}
            />
          ) : (
            <View style={[styles.previewPhoto, styles.previewPhotoFallback]}>
              <Text style={styles.previewPhotoFallbackText}>Sin foto</Text>
            </View>
          )}
          {/* Close button over photo */}
          <Pressable
            hitSlop={10}
            onPress={onClose}
            style={({ pressed }) => [styles.previewClose, pressed && { opacity: 0.7 }]}
          >
            <X color={colors.ink} size={18} strokeWidth={2} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.previewContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Category badge */}
          <View style={styles.previewBadgeRow}>
            <View style={styles.previewBadge}>
              <Text style={styles.previewBadgeText}>
                {CATEGORY_LABEL[item.category] ?? item.category}
              </Text>
            </View>
            {isSoldOut && (
              <View style={styles.previewBadgeSoldOut}>
                <Text style={styles.previewBadgeSoldOutText}>Sin stock</Text>
              </View>
            )}
            {!isSoldOut && typeof item.remainingStock === "number" && (
              <View style={styles.previewBadgeStock}>
                <Text style={styles.previewBadgeStockText}>
                  Quedan {item.remainingStock}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.previewName}>{item.name}</Text>
          <Text style={styles.previewPrice}>{formatMoney(item.price)}</Text>

          {!!item.description && (
            <>
              <View style={styles.previewDivider} />
              <Text style={styles.previewDescriptionLabel}>Descripción</Text>
              <Text style={styles.previewDescription}>{item.description}</Text>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function ConfirmOrderModal({
  visible,
  items,
  total,
  loading,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  items: { id: string; name: string; quantity: number; unitPrice: number }[];
  total: number;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
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
            <Text style={styles.modalTitle}>Confirmá tu pedido</Text>
            <Text style={styles.modalSubtitle}>
              Revisá los items antes de confirmar. No podrás cancelarlo después.
            </Text>

            <View style={styles.modalItems}>
              {items.map((item) => (
                <View key={item.id} style={styles.modalItemRow}>
                  <Text style={styles.modalItemQty}>×{item.quantity}</Text>
                  <Text style={styles.modalItemName}>{item.name}</Text>
                  <Text style={styles.modalItemPrice}>
                    {formatMoney(item.quantity * item.unitPrice)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.modalDivider} />

            <View style={styles.modalTotalRow}>
              <Text style={styles.modalTotalLabel}>Total</Text>
              <Text style={styles.modalTotalAmount}>{formatMoney(total)}</Text>
            </View>

            <View style={styles.modalActions}>
              <Button onPress={onCancel} title="Cancelar" variant="ghost" />
              <Button
                icon={ShoppingBag}
                loading={loading}
                onPress={onConfirm}
                style={styles.modalConfirmButton}
                title="Confirmar"
              />
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
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

function ClosedMenuState() {
  return (
    <View style={styles.closedState}>
      <MenuIllustration />
      <Text style={styles.closedTitle}>El menú de hoy ya cerró</Text>
      <Text style={styles.closedMessage}>
        Volvé mañana para ver los platos disponibles y hacer tu pedido.
      </Text>
    </View>
  );
}

function NoMenuPublishedState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.closedState}>
      <MenuIllustration />
      <Text style={styles.closedTitle}>Todavía no hay menú</Text>
      <Text style={styles.closedMessage}>
        El equipo aún no publicó el menú de hoy. Volvé en un rato.
      </Text>
      <Pressable
        hitSlop={10}
        onPress={onRetry}
        style={({ pressed }) => [styles.actionLink, pressed && styles.actionLinkPressed]}
      >
        <RefreshCw color={colors.brandRed} size={18} strokeWidth={2} />
        <Text style={styles.actionLinkText}>Refrescar</Text>
      </Pressable>
    </View>
  );
}

function MenuIllustration() {
  return <UtensilsCrossed color={colors.muted} size={72} strokeWidth={1.6} />;
}

function MenuItemCard({
  item,
  onChange,
  onPreview,
  quantity,
}: {
  item: MenuItemResponse;
  onChange: (quantity: number) => void;
  onPreview: () => void;
  quantity: number;
}) {
  const hasStockLimit = typeof item.remainingStock === "number";
  const maxQuantity = getMaxQuantity(item);
  const isSoldOut = hasStockLimit && maxQuantity === 0;
  const isSelected = quantity > 0;

  return (
    <View style={[styles.itemCard, isSelected && styles.itemCardSelected]}>
      {/* Tappable area: photo + info → opens preview */}
      <Pressable onPress={onPreview} style={styles.itemTappable}>
        {/* Photo banner */}
        <View>
          {item.photoUrl ? (
            <Image resizeMode="cover" source={{ uri: item.photoUrl }} style={styles.itemPhoto} />
          ) : (
            <View style={styles.itemPhotoFallback}>
              <Text style={styles.itemPhotoFallbackText}>Sin foto</Text>
            </View>
          )}
          {isSoldOut && (
            <View style={styles.soldOutOverlay}>
              <Text style={styles.soldOutOverlayText}>Sin stock</Text>
            </View>
          )}
          {isSelected && (
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyBadgeText}>×{quantity}</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.itemContent}>
          <Text numberOfLines={2} style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>{formatMoney(item.price)}</Text>
          {hasStockLimit && (
            <Text style={isSoldOut ? styles.stockOut : styles.stockCount}>
              {isSoldOut ? "Sin stock" : `Quedan ${item.remainingStock}`}
            </Text>
          )}
        </View>
      </Pressable>

      {/* Stepper — outside Pressable so no event conflict */}
      <View style={styles.stepper}>
        <StepperButton
          disabled={quantity === 0 || isSoldOut}
          icon="minus"
          onPress={() => onChange(quantity - 1)}
        />
        <Text style={styles.quantity}>{quantity}</Text>
        <StepperButton
          disabled={isSoldOut || quantity >= maxQuantity}
          icon="plus"
          onPress={() => onChange(quantity + 1)}
        />
      </View>
    </View>
  );
}

function StepperButton({
  disabled,
  icon,
  onPress,
}: {
  disabled: boolean;
  icon: "minus" | "plus";
  onPress: () => void;
}) {
  const Icon = icon === "minus" ? Minus : Plus;
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 22, bounciness: 0 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 13, bounciness: 2 }).start();

  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View
        style={[
          styles.stepperButton,
          icon === "plus" ? styles.stepperButtonAdd : styles.stepperButtonSub,
          disabled && styles.stepperButtonDisabled,
          { transform: [{ scale }] },
        ]}
      >
        <Icon
          color={icon === "plus" ? colors.onBrand : colors.brandRed}
          size={16}
          strokeWidth={1.8}
        />
      </Animated.View>
    </Pressable>
  );
}

function getMaxQuantity(item: MenuItemResponse) {
  return typeof item.remainingStock === "number"
    ? Math.max(item.remainingStock, 0)
    : Number.POSITIVE_INFINITY;
}

function clampQuantity(item: MenuItemResponse, quantity: number) {
  return Math.max(0, Math.min(quantity, getMaxQuantity(item)));
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
  // Grid
  grid: {
    columnGap: spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: spacing.sm,
  },
  // Food card
  itemCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: "hidden",
    width: "48%",
    ...shadows.sm,
  },
  itemCardSelected: {
    borderColor: colors.brandRed,
    borderWidth: 2,
    ...shadows.brand,
  },
  itemPhoto: {
    aspectRatio: 4 / 3,
    width: "100%",
  },
  itemPhotoFallback: {
    alignItems: "center",
    aspectRatio: 4 / 3,
    backgroundColor: colors.surfaceMuted,
    justifyContent: "center",
    width: "100%",
  },
  itemPhotoFallbackText: {
    color: colors.placeholder,
    fontSize: 11,
    fontWeight: "500" as const,
  },
  soldOutOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(26,28,30,0.55)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  soldOutOverlayText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800" as const,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  qtyBadge: {
    backgroundColor: colors.brandRed,
    borderRadius: radius.pill,
    bottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    position: "absolute",
    right: spacing.sm,
    ...shadows.brand,
  },
  qtyBadgeText: {
    color: colors.onBrand,
    fontSize: 13,
    fontWeight: "800" as const,
  },
  itemContent: {
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  itemName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700" as const,
    letterSpacing: 0,
    lineHeight: 19,
  },
  itemPrice: {
    ...typography.captionStrong,
    color: colors.brandRed,
  },
  stepper: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.sm,
    paddingTop: spacing.xs,
  },
  stepperButton: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  stepperButtonAdd: {
    backgroundColor: colors.brandRed,
  },
  stepperButtonDisabled: {
    opacity: 0.35,
  },
  stepperButtonSub: {
    backgroundColor: colors.surface,
    borderColor: colors.redBorder,
    borderWidth: 1.5,
  },
  quantity: {
    ...typography.bodyStrong,
    color: colors.ink,
    fontSize: 15,
    minWidth: 20,
    textAlign: "center",
  },
  // Notices
  notice: {
    gap: spacing.sm,
  },
  noticeText: {
    ...typography.body,
    color: colors.inkSoft,
  },
  // Checkout
  checkout: {
    alignItems: "stretch",
    gap: spacing.md,
  },
  checkoutButton: {
    alignSelf: "stretch",
    width: "100%",
  },
  checkoutLabel: {
    ...typography.captionStrong,
    color: colors.muted,
    textTransform: "uppercase",
  },
  checkoutReason: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  checkoutTotal: {
    ...typography.h1,
    color: colors.ink,
  },
  // Closed state
  closedState: {
    alignItems: "center",
    gap: spacing.md,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  closedTitle: {
    ...typography.h2,
    color: colors.ink,
    textAlign: "center",
  },
  closedMessage: {
    ...typography.body,
    color: colors.muted,
    maxWidth: 300,
    textAlign: "center",
  },
  // Stock
  stockCount: {
    ...typography.caption,
    color: colors.muted,
  },
  stockOut: {
    ...typography.caption,
    color: colors.brandRed,
    fontWeight: "700" as const,
  },
  // Card tappable area
  itemTappable: {
    flex: 1,
  },
  // Product preview modal
  previewRoot: {
    backgroundColor: colors.background,
    flex: 1,
  },
  previewPhotoWrap: {
    position: "relative",
  },
  previewPhoto: {
    aspectRatio: 4 / 3,
    width: "100%",
  },
  previewPhotoFallback: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    justifyContent: "center",
  },
  previewPhotoFallbackText: {
    ...typography.body,
    color: colors.placeholder,
  },
  previewClose: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    height: 36,
    justifyContent: "center",
    position: "absolute",
    right: spacing.md,
    top: spacing.md,
    width: 36,
    ...shadows.md,
  },
  previewContent: {
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  previewBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  previewBadge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  previewBadgeText: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: "600" as const,
  },
  previewBadgeSoldOut: {
    backgroundColor: colors.redSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  previewBadgeSoldOutText: {
    ...typography.caption,
    color: colors.brandRed,
    fontWeight: "700" as const,
  },
  previewBadgeStock: {
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  previewBadgeStockText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: "600" as const,
  },
  previewName: {
    ...typography.h1,
    color: colors.ink,
  },
  previewPrice: {
    ...typography.h2,
    color: colors.brandRed,
  },
  previewDivider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: spacing.xs,
  },
  previewDescriptionLabel: {
    ...typography.captionStrong,
    color: colors.muted,
    textTransform: "uppercase",
  },
  previewDescription: {
    ...typography.body,
    color: colors.inkSoft,
    lineHeight: 26,
  },
  // Confirm modal
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
    ...shadows.lg,
  },
  modalHandle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    height: 4,
    marginBottom: spacing.xs,
    width: 40,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  modalItems: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  modalItemRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  modalItemQty: {
    ...typography.captionStrong,
    color: colors.brandRed,
    minWidth: 28,
  },
  modalItemName: {
    ...typography.body,
    color: colors.ink,
    flex: 1,
  },
  modalItemPrice: {
    ...typography.captionStrong,
    color: colors.inkSoft,
  },
  modalDivider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: spacing.xs,
  },
  modalTotalRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  modalTotalLabel: {
    ...typography.bodyStrong,
    color: colors.muted,
  },
  modalTotalAmount: {
    ...typography.h2,
    color: colors.ink,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  modalConfirmButton: {
    flex: 1,
  },
  actionLink: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionLinkPressed: {
    opacity: 0.55,
  },
  actionLinkText: {
    ...typography.bodyStrong,
    color: colors.brandRed,
  },
});
