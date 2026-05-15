import { useMemo, useState } from "react";
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ChefHat, Pencil, Plus, RefreshCw } from "lucide-react-native";

import { getApiErrorMessage } from "../../../src/api/client";
import { productsApi } from "../../../src/api/products";
import { Card } from "../../../src/components/Card";
import { Hero } from "../../../src/components/Hero";
import { Skeleton } from "../../../src/components/Skeleton";
import { EmptyState, ErrorState } from "../../../src/components/StateViews";
import { colors, radius, spacing, typography } from "../../../src/theme";
import type { MenuItemCategory, Product } from "../../../src/types";
import { formatMoney } from "../../../src/utils/format";

type CategoryFilter = MenuItemCategory | "ALL";

const CATEGORY_LABELS: Record<MenuItemCategory, string> = {
  PLATO: "Platos",
  MINUTA: "Minutas",
  ENSALADA: "Ensaladas",
};


export default function ProductsScreen() {
  const [filter, setFilter] = useState<CategoryFilter>("ALL");

  const productsQuery = useQuery({
    queryFn: () => productsApi.list(),
    queryKey: ["products"],
  });

  if (productsQuery.isError) {
    return (
      <ErrorState
        actionLabel="Reintentar"
        icon={RefreshCw}
        message={getApiErrorMessage(productsQuery.error)}
        onAction={() => productsQuery.refetch()}
        title="No pudimos cargar productos"
      />
    );
  }

  const products = productsQuery.data ?? [];
  const filtered = useMemo(
    () => (filter === "ALL" ? products : products.filter((p) => p.category === filter)),
    [products, filter],
  );

  const counts = useMemo(() => {
    const byCategory: Record<MenuItemCategory, number> = { PLATO: 0, MINUTA: 0, ENSALADA: 0 };
    products.forEach((p) => { byCategory[p.category] = (byCategory[p.category] ?? 0) + 1; });
    return byCategory;
  }, [products]);

  return (
    <View style={styles.root}>
      <Hero
        tone="ink"
        eyebrow="Productos"
        title="Tu catálogo"
        subtitle="Reusalos al armar el menú del día."
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            colors={[colors.brandRed]}
            onRefresh={() => productsQuery.refetch()}
            refreshing={productsQuery.isFetching && !productsQuery.isLoading}
            tintColor={colors.brandRed}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.push("/product-form")}
          style={({ pressed }) => [styles.createAction, pressed && styles.actionPressed]}
        >
          <View style={styles.createActionIcon}>
            <Plus color={colors.brandRed} size={22} strokeWidth={1.8} />
          </View>
          <View style={styles.createActionCopy}>
            <Text style={styles.createActionTitle}>Crear producto</Text>
            <Text style={styles.createActionMeta}>
              Sumá un plato o minuta a tu catálogo reutilizable.
            </Text>
          </View>
        </Pressable>

        <ScrollView
          contentContainerStyle={styles.filterRow}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <Pressable
            onPress={() => setFilter("ALL")}
            style={[styles.filterChip, filter === "ALL" && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filter === "ALL" && styles.filterTextActive]}>
              Todos
            </Text>
            <Text style={[styles.filterCount, filter === "ALL" && styles.filterCountActive]}>
              {products.length}
            </Text>
          </Pressable>

          {(["PLATO", "MINUTA", "ENSALADA"] as MenuItemCategory[]).map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setFilter(cat)}
              style={[styles.filterChip, filter === cat && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, filter === cat && styles.filterTextActive]}>
                {CATEGORY_LABELS[cat]}
              </Text>
              <Text style={[styles.filterCount, filter === cat && styles.filterCountActive]}>
                {counts[cat]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {productsQuery.isLoading ? (
          <View style={styles.list}>
            <Skeleton.Row withIcon />
            <Skeleton.Row withIcon />
            <Skeleton.Row withIcon />
          </View>
        ) : filtered.length === 0 ? (
          <EmptyState
            actionLabel={products.length === 0 ? "Crear primer producto" : undefined}
            icon={ChefHat}
            message={
              products.length === 0
                ? "Cargá tu primer producto para empezar a armar menús más rápido."
                : "No hay productos en esta categoría."
            }
            onAction={products.length === 0 ? () => router.push("/product-form") : undefined}
            title={products.length === 0 ? "Sin productos" : "Sin resultados"}
          />
        ) : (
          <View style={styles.list}>
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Card style={styles.card} variant="elevated">
      {product.photoUrl ? (
        <Image resizeMode="cover" source={{ uri: product.photoUrl }} style={styles.photo} />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoPlaceholderText}>Sin{"\n"}foto</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{product.name}</Text>
        <Text style={styles.cardPrice}>{formatMoney(product.price)}</Text>
        {!!product.description && (
          <Text numberOfLines={2} style={styles.cardDescription}>
            {product.description}
          </Text>
        )}
      </View>
      <Pressable
        accessibilityLabel={`Editar ${product.name}`}
        hitSlop={10}
        onPress={() =>
          router.push({ pathname: "/product-form", params: { id: product.id } })
        }
        style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}
      >
        <Pencil color={colors.brandRed} size={18} strokeWidth={1.8} />
      </Pressable>
    </Card>
  );
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
  createAction: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
  },
  createActionIcon: {
    alignItems: "center",
    backgroundColor: colors.redSoft,
    borderRadius: radius.md,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  createActionCopy: {
    flex: 1,
    gap: 2,
  },
  createActionTitle: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  createActionMeta: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  actionPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  filterChip: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  filterChipActive: {
    backgroundColor: colors.brandRed,
    borderColor: colors.brandRed,
  },
  filterText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600" as const,
    letterSpacing: 0,
  },
  filterTextActive: {
    color: colors.onBrand,
  },
  filterCount: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600" as const,
    minWidth: 18,
    overflow: "hidden",
    paddingHorizontal: 5,
    paddingVertical: 1,
    textAlign: "center",
  },
  filterCountActive: {
    backgroundColor: "rgba(255,255,255,0.22)",
    color: colors.onBrand,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  photo: {
    borderRadius: radius.md,
    height: 72,
    width: 72,
  },
  photoPlaceholder: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  photoPlaceholderText: {
    color: colors.placeholder,
    fontSize: 11,
    fontWeight: "500" as const,
    lineHeight: 15,
    textAlign: "center",
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    ...typography.bodyStrong,
    color: colors.ink,
    fontSize: 17,
  },
  cardPrice: {
    ...typography.captionStrong,
    color: colors.brandRed,
  },
  cardDescription: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  editButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  editButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
});
