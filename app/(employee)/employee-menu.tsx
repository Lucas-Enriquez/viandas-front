import { useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { ImageOff, Link2, Minus, Plus, RefreshCw, ShoppingBag } from "lucide-react-native";

import { employeeApi } from "../../src/api/employee";
import { getApiErrorMessage } from "../../src/api/client";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { EmptyState, ErrorState, LoadingState } from "../../src/components/StateViews";
import { Screen } from "../../src/components/Screen";
import { StatusPill } from "../../src/components/StatusPill";
import { getStoredGlobalMenuLink } from "../../src/storage";
import { colors, spacing, typography } from "../../src/theme";
import type { MenuItemResponse } from "../../src/types";
import { formatMenuDate } from "../../src/utils/date";
import { formatMoney } from "../../src/utils/format";

type ItemDraft = Record<string, number>;

export default function EmployeeMenuScreen() {
  const [link, setLink] = useState<{ date: string; token: string } | null>(null);
  const [draft, setDraft] = useState<ItemDraft>({});
  const queryClient = useQueryClient();

  useEffect(() => {
    getStoredGlobalMenuLink().then(setLink);
  }, []);

  const menuQuery = useQuery({
    enabled: !!link,
    queryFn: () => employeeApi.globalMenu(link!.date, link!.token),
    queryKey: ["employee", "global-menu", link?.date, link?.token],
  });

  const currentOrderQuery = useQuery({
    enabled: !!link,
    queryFn: () => employeeApi.currentGlobalOrder(link!.date, link!.token),
    queryKey: ["employee", "current-order", link?.date, link?.token],
  });

  const createOrderMutation = useMutation({
    mutationFn: () => {
      if (!link) {
        throw new Error("Primero abrí un menú global.");
      }
      const menu = menuQuery.data;
      if (!menu) {
        throw new Error("Primero cargá un menú.");
      }

      const items = menu.items
        .map((item) => ({
          comment: null,
          menuItemId: item.id,
          quantity: clampQuantity(item, draft[item.id] ?? 0),
        }))
        .filter((item) => item.quantity > 0);
      if (items.length === 0) {
        throw new Error("Elegí al menos un item.");
      }
      return employeeApi.createGlobalOrder(link.date, link.token, { items });
    },
    onError: (error) => {
      Alert.alert("No pudimos crear el pedido", getApiErrorMessage(error));
    },
    onSuccess: () => {
      setDraft({});
      queryClient.invalidateQueries({ queryKey: ["employee", "current-order"] });
      Alert.alert("Pedido creado", "Tu pedido quedó registrado.");
      router.replace("/employee-order");
    },
  });

  const selectedTotal = useMemo(() => {
    const menu = menuQuery.data;
    if (!menu) {
      return 0;
    }
    return menu.items.reduce(
      (sum, item) => sum + clampQuantity(item, draft[item.id] ?? 0) * item.price,
      0,
    );
  }, [draft, menuQuery.data]);

  if (!link) {
    return (
      <EmptyState
        actionLabel="Abrir link"
        icon={Link2}
        message="Pegá el token del menú global para ver los platos disponibles."
        onAction={() => router.push("/global-token")}
        title="No hay menú abierto"
      />
    );
  }

  if (menuQuery.isLoading || currentOrderQuery.isLoading) {
    return <LoadingState label="Cargando menú..." />;
  }

  if (menuQuery.isError) {
    return (
      <ErrorState
        actionLabel="Cambiar token"
        icon={RefreshCw}
        message={getApiErrorMessage(menuQuery.error)}
        onAction={() => router.push("/global-token")}
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

  if (menu && !menu.canOrder && !hasCurrentOrder) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{menu.companyName ?? "Menú global"}</Text>
          <Text style={styles.title}>{formatMenuDate(menu.date)}</Text>
          <Text style={styles.subtitle}>Cerró {menu.orderClosesAt}</Text>
        </View>

        <ClosedMenuState />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{menu?.companyName ?? "Menú global"}</Text>
        <Text style={styles.title}>{menu ? formatMenuDate(menu.date) : "Menú"}</Text>
        <Text style={styles.subtitle}>Cierra {menu?.orderClosesAt}</Text>
      </View>

      {currentOrderQuery.isError ? (
        <Card style={styles.notice}>
          <StatusPill label="Aviso" tone="warning" />
          <Text style={styles.noticeText}>
            No pudimos confirmar tu pedido actual. Si ya pediste, el backend lo va a
            validar al enviar.
          </Text>
        </Card>
      ) : null}

      {currentOrder?.hasOrder ? (
        <Card style={styles.notice}>
          <StatusPill label="Pedido registrado" tone="success" />
          <Text style={styles.noticeText}>{currentOrder.message}</Text>
          <Button
            onPress={() => router.push("/employee-order")}
            size="small"
            title="Ver mi pedido"
            variant="secondary"
          />
        </Card>
      ) : null}

      <View style={styles.list}>
        {menu?.items.map((item) => (
          <MenuItemCard
            item={item}
            key={item.id}
            onChange={(quantity) =>
              setDraft((current) => ({ ...current, [item.id]: clampQuantity(item, quantity) }))
            }
            quantity={clampQuantity(item, draft[item.id] ?? 0)}
          />
        ))}
      </View>

      <Card style={styles.checkout}>
        <View>
          <Text style={styles.checkoutLabel}>Total</Text>
          <Text style={styles.checkoutTotal}>{formatMoney(selectedTotal)}</Text>
          {!!disabledReason && <Text style={styles.checkoutReason}>{disabledReason}</Text>}
        </View>
        <Button
          disabled={!!disabledReason}
          icon={ShoppingBag}
          loading={createOrderMutation.isPending}
          onPress={() => createOrderMutation.mutate()}
          style={styles.checkoutButton}
          title="Pedir"
        />
      </Card>
    </Screen>
  );
}

function ClosedMenuState() {
  return (
    <View style={styles.closedState}>
      <HayBaleIllustration />
      <Text style={styles.closedTitle}>El menú de hoy ya cerró</Text>
      <Text style={styles.closedMessage}>
        Volvé mañana para ver los platos disponibles y hacer tu pedido.
      </Text>
      <Button
        icon={Link2}
        onPress={() => router.push("/global-token")}
        title="Abrir otro link"
        variant="secondary"
      />
    </View>
  );
}

function HayBaleIllustration() {
  return (
    <View style={styles.hayScene}>
      <View style={styles.hayShadow} />
      <View style={styles.hayBale}>
        <View style={[styles.hayStripe, styles.hayStripeTop]} />
        <View style={[styles.hayStripe, styles.hayStripeMiddle]} />
        <View style={[styles.hayStripe, styles.hayStripeBottom]} />
        <View style={styles.hayRing} />
      </View>
      <View style={styles.hayStemLeft} />
      <View style={styles.hayStemRight} />
    </View>
  );
}

function MenuItemCard({
  item,
  onChange,
  quantity,
}: {
  item: MenuItemResponse;
  onChange: (quantity: number) => void;
  quantity: number;
}) {
  const hasStockLimit = typeof item.remainingStock === "number";
  const maxQuantity = getMaxQuantity(item);
  const isSoldOut = hasStockLimit && maxQuantity === 0;
  const canDecrease = quantity > 0;
  const canIncrease = quantity < maxQuantity;
  const meta = `${formatMoney(item.price)}${
    hasStockLimit ? ` · ${isSoldOut ? "Sin stock" : `Stock: ${item.remainingStock}`}` : ""
  }`;

  return (
    <Card style={styles.itemCard}>
      <View style={styles.itemMainRow}>
        {item.photoUrl ? (
          <Image source={{ uri: item.photoUrl }} style={styles.itemImage} />
        ) : (
          <View style={styles.itemImageFallback}>
            <ImageOff color={colors.muted} size={20} strokeWidth={2.4} />
          </View>
        )}
        <View style={styles.itemBody}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={[styles.itemMeta, isSoldOut && styles.soldOutText]}>{meta}</Text>
        </View>
      </View>
      <View style={styles.stepper}>
        <StepperButton disabled={!canDecrease} icon="minus" onPress={() => onChange(quantity - 1)} />
        <Text style={styles.quantity}>{quantity}</Text>
        <StepperButton disabled={!canIncrease} icon="plus" onPress={() => onChange(quantity + 1)} />
      </View>
    </Card>
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
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.stepperButton,
        icon === "plus" ? styles.stepperButtonAdd : styles.stepperButtonSub,
        disabled ? styles.stepperButtonDisabled : null,
        pressed && !disabled ? styles.stepperButtonPressed : null,
      ]}
    >
      <Icon
        color={icon === "plus" ? colors.onBrand : colors.brandRed}
        size={16}
        strokeWidth={2.6}
      />
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
  closedMessage: {
    ...typography.body,
    color: colors.muted,
    maxWidth: 300,
    textAlign: "center",
  },
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
  checkout: {
    alignItems: "stretch",
    gap: spacing.md,
  },
  checkoutButton: {
    alignSelf: "stretch",
    width: "100%",
  },
  checkoutLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  checkoutReason: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  checkoutTotal: {
    ...typography.h2,
    color: colors.ink,
  },
  eyebrow: {
    ...typography.captionStrong,
    color: colors.brandRed,
  },
  header: {
    gap: spacing.xs,
  },
  hayBale: {
    alignItems: "center",
    backgroundColor: colors.yellow,
    borderColor: colors.warning,
    borderRadius: 42,
    borderWidth: 3,
    height: 108,
    justifyContent: "center",
    overflow: "hidden",
    width: 142,
  },
  hayRing: {
    borderColor: colors.warning,
    borderRadius: 34,
    borderWidth: 3,
    height: 56,
    opacity: 0.55,
    width: 56,
  },
  hayScene: {
    alignItems: "center",
    height: 132,
    justifyContent: "flex-end",
    width: 176,
  },
  hayShadow: {
    backgroundColor: colors.border,
    borderRadius: 999,
    bottom: 4,
    height: 14,
    opacity: 0.85,
    position: "absolute",
    width: 132,
  },
  hayStemLeft: {
    backgroundColor: colors.warning,
    borderRadius: 999,
    height: 46,
    left: 24,
    opacity: 0.7,
    position: "absolute",
    top: 26,
    transform: [{ rotate: "-28deg" }],
    width: 4,
  },
  hayStemRight: {
    backgroundColor: colors.warning,
    borderRadius: 999,
    height: 42,
    opacity: 0.65,
    position: "absolute",
    right: 26,
    top: 28,
    transform: [{ rotate: "28deg" }],
    width: 4,
  },
  hayStripe: {
    backgroundColor: colors.warning,
    borderRadius: 999,
    height: 4,
    opacity: 0.5,
    position: "absolute",
  },
  hayStripeBottom: {
    bottom: 28,
    right: 14,
    width: 88,
  },
  hayStripeMiddle: {
    left: 12,
    top: 52,
    width: 116,
  },
  hayStripeTop: {
    left: 22,
    top: 28,
    width: 82,
  },
  itemBody: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  itemCard: {
    gap: spacing.md,
  },
  itemImage: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    height: 64,
    width: 64,
  },
  itemImageFallback: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  itemMeta: {
    ...typography.caption,
    color: colors.muted,
  },
  itemMainRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
  },
  itemName: {
    ...typography.bodyStrong,
    color: colors.ink,
    flexShrink: 1,
  },
  list: {
    gap: spacing.md,
  },
  notice: {
    gap: spacing.sm,
  },
  noticeText: {
    ...typography.body,
    color: colors.muted,
  },
  quantity: {
    ...typography.bodyStrong,
    color: colors.ink,
    minWidth: 28,
    textAlign: "center",
  },
  soldOutText: {
    color: colors.warning,
  },
  stepper: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "flex-end",
  },
  stepperButton: {
    alignItems: "center",
    borderRadius: 8,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  stepperButtonAdd: {
    backgroundColor: colors.brandRed,
  },
  stepperButtonDisabled: {
    opacity: 0.38,
  },
  stepperButtonPressed: {
    opacity: 0.78,
  },
  stepperButtonSub: {
    backgroundColor: colors.surface,
    borderColor: colors.redBorder,
    borderWidth: 1,
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
