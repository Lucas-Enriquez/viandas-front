import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ChefHat, Save, Trash2 } from "lucide-react-native";

import { getApiErrorMessage } from "../../../src/api/client";
import { productsApi } from "../../../src/api/products";
import { Button } from "../../../src/components/Button";
import { Card } from "../../../src/components/Card";
import { DangerConfirmModal } from "../../../src/components/DangerConfirmModal";
import { Hero } from "../../../src/components/Hero";
import { Input } from "../../../src/components/Input";
import { Skeleton } from "../../../src/components/Skeleton";
import { useToast } from "../../../src/providers/ToastProvider";
import { colors, radius, spacing, typography } from "../../../src/theme";
import type { MenuItemCategory, ProductRequest } from "../../../src/types";

const CATEGORIES: Array<{ label: string; value: MenuItemCategory }> = [
  { label: "Plato", value: "PLATO" },
  { label: "Minuta", value: "MINUTA" },
  { label: "Ensalada", value: "ENSALADA" },
];

export default function ProductFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const queryClient = useQueryClient();
  const toast = useToast();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<MenuItemCategory>("PLATO");
  const [description, setDescription] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  const productQuery = useQuery({
    enabled: isEditing,
    queryFn: () => productsApi.get(id!),
    queryKey: ["product", id],
  });

  useEffect(() => {
    const product = productQuery.data;
    if (!product) return;
    setName(product.name);
    setPrice(String(product.price));
    setCategory(product.category);
    setDescription(product.description ?? "");
  }, [productQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!name.trim()) {
        throw new Error("Ingresá el nombre del producto.");
      }
      const parsedPrice = parseNumber(price);
      if (!parsedPrice || parsedPrice <= 0) {
        throw new Error("Ingresá un precio válido.");
      }
      const body: ProductRequest = {
        category,
        description: description.trim() || null,
        name: name.trim(),
        price: parsedPrice,
        photoPublicId: null,
      };
      return isEditing ? productsApi.update(id!, body) : productsApi.create(body);
    },
    onError: (error) => {
      toast.show({
        title: "No pudimos guardar",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.show({ title: "Producto guardado", tone: "success" });
      router.replace("/products");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => productsApi.delete(id!),
    onError: (error) => {
      toast.show({
        title: "No pudimos eliminar",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowDelete(false);
      toast.show({ title: "Producto eliminado", tone: "success" });
      router.replace("/products");
    },
  });

  const isLoadingInitial = isEditing && productQuery.isLoading;

  return (
    <View style={styles.root}>
      <Hero
        compact
        eyebrow="Productos"
        onBack={() => router.back()}
        subtitle="Datos básicos del producto. Las fotos se suman en una próxima iteración."
        title={isEditing ? "Editar producto" : "Nuevo producto"}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isLoadingInitial ? (
          <View style={styles.skeletonGroup}>
            <Skeleton.Card height={200} />
            <Skeleton.Card height={120} />
          </View>
        ) : (
          <>
            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <ChefHat color={colors.brandRed} size={22} strokeWidth={2.4} />
                <Text style={styles.sectionTitle}>Datos generales</Text>
              </View>
              <Input
                label="Nombre"
                onChangeText={setName}
                placeholder="Milanesa napolitana"
                value={name}
              />
              <Input
                keyboardType="decimal-pad"
                label="Precio"
                onChangeText={setPrice}
                placeholder="8500"
                value={price}
              />

              <Text style={styles.label}>Categoría</Text>
              <View style={styles.categoryRow}>
                {CATEGORIES.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setCategory(option.value)}
                    style={[
                      styles.categoryOption,
                      category === option.value && styles.categoryActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        category === option.value && styles.categoryTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Input
                label="Descripción"
                multiline
                onChangeText={setDescription}
                placeholder="Con jamón, queso y salsa de tomate"
                value={description}
              />
            </Card>

            <Button
              icon={Save}
              loading={saveMutation.isPending}
              onPress={() => saveMutation.mutate()}
              title="Guardar producto"
            />

            {isEditing && (
              <Button
                icon={Trash2}
                onPress={() => setShowDelete(true)}
                title="Eliminar producto"
                variant="ghost"
              />
            )}
          </>
        )}
      </ScrollView>

      <DangerConfirmModal
        bullets={[
          "El producto desaparece de tu catálogo.",
          "Los menús anteriores que lo usaron mantienen el snapshot (no se rompen).",
        ]}
        description="Esta acción es irreversible."
        destructiveLabel="Eliminar"
        loading={deleteMutation.isPending}
        onCancel={() => setShowDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        title={`Eliminar ${name || "producto"}`}
        visible={showDelete}
      />
    </View>
  );
}

function parseNumber(value: string) {
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
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
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.ink,
  },
  label: {
    ...typography.captionStrong,
    color: colors.ink,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  categoryOption: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    minHeight: 42,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  categoryActive: {
    backgroundColor: colors.redSoft,
    borderColor: colors.redBorder,
  },
  categoryText: {
    ...typography.captionStrong,
    color: colors.muted,
  },
  categoryTextActive: {
    color: colors.brandRed,
  },
});
