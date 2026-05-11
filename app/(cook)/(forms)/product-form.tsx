import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Camera, ChefHat, Save, Trash2, X } from "lucide-react-native";

import { getApiErrorMessage } from "../../../src/api/client";
import { productsApi } from "../../../src/api/products";
import { Button } from "../../../src/components/Button";
import { Card } from "../../../src/components/Card";
import { DangerConfirmModal } from "../../../src/components/DangerConfirmModal";
import { Hero } from "../../../src/components/Hero";
import { Input } from "../../../src/components/Input";
import { Skeleton } from "../../../src/components/Skeleton";
import { useToast } from "../../../src/providers/ToastProvider";
import { colors, radius, shadows, spacing, typography } from "../../../src/theme";
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

  // localUri = picked image not yet uploaded; existingUrl = already saved photo URL
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);

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
    setExistingPhotoUrl(product.photoUrl ?? null);
  }, [productQuery.data]);

  async function pickImage() {
    // Dynamic import so a missing native module (pre-rebuild) doesn't crash the screen.
    let ImagePicker: typeof import("expo-image-picker");
    try {
      ImagePicker = await import("expo-image-picker");
    } catch {
      toast.show({
        title: "No disponible",
        message: "La cámara/galería requiere un rebuild de la app.",
        tone: "error",
      });
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      toast.show({
        title: "Permiso denegado",
        message: "Necesitamos acceso a tu galería para subir una foto.",
        tone: "error",
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled) {
      setLocalPhotoUri(result.assets[0].uri);
    }
  }

  function removePhoto() {
    setLocalPhotoUri(null);
    setExistingPhotoUrl(null);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Ingresá el nombre del producto.");
      const parsedPrice = parseNumber(price);
      if (!parsedPrice || parsedPrice <= 0) throw new Error("Ingresá un precio válido.");

      // If there's a new local image, upload it first.
      let photoPublicId: string | null = null;
      if (localPhotoUri) {
        photoPublicId = await productsApi.uploadPhoto(localPhotoUri);
      }

      const body: ProductRequest = {
        category,
        description: description.trim() || null,
        name: name.trim(),
        price: parsedPrice,
        // Only send photoPublicId when there's a new upload or explicit removal.
        ...(localPhotoUri || (!existingPhotoUrl && isEditing)
          ? { photoPublicId }
          : {}),
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
  const previewUri = localPhotoUri ?? existingPhotoUrl;

  return (
    <View style={styles.root}>
      <Hero
        compact
        eyebrow="Productos"
        onBack={() => router.back()}
        subtitle={isEditing ? "Editá los datos del producto." : "Completá los datos del nuevo producto."}
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
            {/* Photo picker */}
            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <Camera color={colors.brandRed} size={22} strokeWidth={2.4} />
                <Text style={styles.sectionTitle}>Foto</Text>
              </View>

              {previewUri ? (
                <View style={styles.previewWrapper}>
                  <Image
                    source={{ uri: previewUri }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                  <Pressable
                    onPress={removePhoto}
                    style={styles.removeBtn}
                    hitSlop={8}
                  >
                    <X color={colors.onBrand} size={14} strokeWidth={2.6} />
                  </Pressable>
                  <Pressable onPress={pickImage} style={styles.changePhotoBtn}>
                    <Camera color={colors.onBrand} size={16} strokeWidth={2.4} />
                    <Text style={styles.changePhotoText}>Cambiar</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={pickImage}
                  style={({ pressed }) => [
                    styles.photoPlaceholder,
                    pressed && styles.photoPlaceholderPressed,
                  ]}
                >
                  <Camera color={colors.muted} size={32} strokeWidth={1.8} />
                  <Text style={styles.photoPlaceholderText}>Elegir foto</Text>
                  <Text style={styles.photoPlaceholderHint}>Desde la galería · Se recorta en 1:1</Text>
                </Pressable>
              )}
            </Card>

            {/* Product data */}
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
              title={saveMutation.isPending && localPhotoUri ? "Subiendo foto…" : "Guardar producto"}
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
  // Photo picker
  photoPlaceholder: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderStyle: "dashed",
    borderWidth: 1.5,
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 140,
    paddingVertical: spacing.lg,
  },
  photoPlaceholderPressed: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.redBorder,
  },
  photoPlaceholderText: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  photoPlaceholderHint: {
    ...typography.caption,
    color: colors.muted,
  },
  previewWrapper: {
    borderRadius: radius.lg,
    overflow: "hidden",
    position: "relative",
  },
  previewImage: {
    aspectRatio: 1,
    borderRadius: radius.lg,
    width: "100%",
  },
  removeBtn: {
    alignItems: "center",
    backgroundColor: colors.brandRed,
    borderRadius: radius.pill,
    height: 28,
    justifyContent: "center",
    position: "absolute",
    right: spacing.sm,
    top: spacing.sm,
    width: 28,
    ...shadows.brand,
  },
  changePhotoBtn: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: radius.md,
    bottom: spacing.sm,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    position: "absolute",
  },
  changePhotoText: {
    ...typography.captionStrong,
    color: colors.onBrand,
    fontSize: 12,
  },
  // Category
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
