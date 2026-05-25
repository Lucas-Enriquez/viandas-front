import { useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import {
  CalendarDays,
  Check,
  ImageOff,
  Plus,
  Send,
  Trash2,
  Utensils,
} from "lucide-react-native";

import { getApiErrorMessage } from "../../../src/api/client";
import { companiesApi } from "../../../src/api/companies";
import { menusApi } from "../../../src/api/menus";
import { productsApi } from "../../../src/api/products";
import { Button } from "../../../src/components/Button";
import { Card } from "../../../src/components/Card";
import { ConfirmModal } from "../../../src/components/ConfirmModal";
import { DangerConfirmModal } from "../../../src/components/DangerConfirmModal";
import { DateTimeField } from "../../../src/components/DateTimeField";
import { Hero } from "../../../src/components/Hero";
import { Input } from "../../../src/components/Input";
import { Skeleton } from "../../../src/components/Skeleton";
import { ErrorState, LoadingState } from "../../../src/components/StateViews";
import { StatusPill } from "../../../src/components/StatusPill";
import { useToast } from "../../../src/providers/ToastProvider";
import { colors, radius, spacing, typography } from "../../../src/theme";
import type { Company, MenuItemCategory, MenuScope, Product } from "../../../src/types";
import { dateToBackendTime, timeToDate, todayYmd, ymdToDate } from "../../../src/utils/date";
import { formatMoney } from "../../../src/utils/format";

const CATEGORIES: Array<{ label: string; value: MenuItemCategory }> = [
  { label: "Plato", value: "PLATO" },
  { label: "Minuta", value: "MINUTA" },
  { label: "Ensalada", value: "ENSALADA" },
];

const CATEGORY_TABS: Array<{ label: string; value: MenuItemCategory | "ALL" }> = [
  { label: "Todos", value: "ALL" },
  { label: "Plato", value: "PLATO" },
  { label: "Minuta", value: "MINUTA" },
  { label: "Ensalada", value: "ENSALADA" },
];

export default function MenuCreateScreen() {
  const params = useLocalSearchParams<{ id?: string; scope?: MenuScope; date?: string }>();
  const editingId = params.id;
  const isEditing = !!editingId;
  const queryClient = useQueryClient();
  const toast = useToast();

  const initialScope = params.scope === "GLOBAL" ? "GLOBAL" : "COMPANY";
  const [scope, setScope] = useState<MenuScope>(initialScope);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [itemCompanyIds, setItemCompanyIds] = useState<string[]>([]);
  const [date, setDate] = useState(() =>
    ymdToDate(typeof params.date === "string" ? params.date : todayYmd()),
  );
  const [orderClosesAt, setOrderClosesAt] = useState(() => timeToDate("11:30:00"));
  const [itemMode, setItemMode] = useState<"CATALOG" | "FREE">("CATALOG");
  const [showDelete, setShowDelete] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  // Multi-select catalog state
  const [pickedProductIds, setPickedProductIds] = useState<string[]>([]);
  const [pickedStocks, setPickedStocks] = useState<Record<string, string>>({});
  const [filterCategory, setFilterCategory] = useState<MenuItemCategory | "ALL">("ALL");

  // Free-form item state
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<MenuItemCategory>("PLATO");
  const [remainingStock, setRemainingStock] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const companiesQuery = useQuery({
    queryFn: companiesApi.list,
    queryKey: ["companies"],
  });

  const productsQuery = useQuery({
    queryFn: () => productsApi.list(),
    queryKey: ["products"],
  });

  const menuQuery = useQuery({
    enabled: isEditing,
    queryFn: () => menusApi.get(editingId!),
    queryKey: ["menu", editingId],
    refetchOnMount: "always",
    staleTime: 0,
  });

  const menuItemsQuery = useQuery({
    enabled: isEditing,
    queryFn: () => menusApi.listItems(editingId!),
    queryKey: ["menu-items", editingId],
    refetchOnMount: "always",
    staleTime: 0,
  });

  const menu = menuQuery.data;


  useEffect(() => {
    if (!menu) return;
    setScope(menu.scope);
    setSelectedCompanyIds(menu.companies.map((c) => c.id));
    // Preferimos el `date` del query param (viene del LIST endpoint con
    // formato YMD confiable). Si no, caemos al `menu.date` del GET.
    const ymdSource = typeof params.date === "string" ? params.date : menu.date;
    setDate(ymdToDate(ymdSource));
    setOrderClosesAt(timeToDate(menu.orderClosesAt));
  }, [menu]);

  const companies = companiesQuery.data ?? [];
  const selectedCompanies = useMemo(
    () => companies.filter((company) => selectedCompanyIds.includes(company.id)),
    [companies, selectedCompanyIds],
  );


  // Products filtered by the active category tab.
  const filteredProducts = useMemo(() => {
    const products = productsQuery.data ?? [];
    if (filterCategory === "ALL") return products;
    return products.filter((p) => p.category === filterCategory);
  }, [productsQuery.data, filterCategory]);

  // normalizedName → menuItemId, para detectar qué productos ya están y poder borrarlos
  const menuItemByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of menuItemsQuery.data ?? []) {
      map.set(normalizeName(item.name), item.id);
    }
    return map;
  }, [menuItemsQuery.data]);

  // Auto-select all companies on first GLOBAL mount (when not editing).
  const didAutoSelectRef = useRef(false);
  useEffect(() => {
    if (
      !isEditing &&
      !didAutoSelectRef.current &&
      scope === "GLOBAL" &&
      companies.length > 0
    ) {
      setSelectedCompanyIds(companies.map((c) => c.id));
      didAutoSelectRef.current = true;
    }
  }, [companies, scope, isEditing]);

  const addItemMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("Menú no disponible.");
      const availableCompanyIds = scope === "GLOBAL" ? itemCompanyIds : undefined;

      if (itemMode === "CATALOG") {
        if (pickedProductIds.length === 0) throw new Error("Elegí al menos un producto del catálogo.");
        await Promise.all(
          pickedProductIds.map((productId) => {
            const rawStock = pickedStocks[productId]?.trim();
            const parsedStock = rawStock ? parseNumber(rawStock) : undefined;
            return menusApi.addItem(editingId, {
              productId,
              remainingStock: parsedStock,
              availableCompanyIds,
            });
          }),
        );
        return;
      }

      if (!itemName.trim()) throw new Error("Ingresá el nombre del item.");
      const parsedPrice = parseNumber(price);
      if (!parsedPrice || parsedPrice <= 0) {
        throw new Error("Ingresá un precio válido.");
      }
      const parsedStock = remainingStock.trim() ? parseNumber(remainingStock) : undefined;

      await menusApi.addItem(editingId, {
        availableCompanyIds,
        category,
        name: itemName.trim(),
        photoPublicId: photoUrl.trim() || undefined,
        price: parsedPrice,
        remainingStock: parsedStock,
      });
    },
    onError: (error) => {
      toast.show({
        title: "No pudimos agregar el item",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu", editingId] });
      queryClient.invalidateQueries({ queryKey: ["menu-items", editingId] });
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast.show({ title: "Item agregado", tone: "success" });
      setPickedProductIds([]);
      setPickedStocks({});
      setItemName("");
      setPrice("");
      setRemainingStock("");
      setPhotoUrl("");
      setItemCompanyIds([]);
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => menusApi.removeItem(editingId!, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items", editingId] });
      toast.show({ title: "Item eliminado", tone: "success" });
    },
    onError: (err) => {
      toast.show({ title: getApiErrorMessage(err), tone: "error" });
    },
  });

  const createMenuMutation = useMutation({
    mutationFn: async () => {
      if (selectedCompanyIds.length === 0) {
        throw new Error("Elegí al menos una empresa.");
      }

      const created = await menusApi.create({
        companyId: scope === "COMPANY" ? selectedCompanyIds[0] : undefined,
        companyIds: scope === "GLOBAL" ? selectedCompanyIds : undefined,
        date: todayYmd(date),
        orderClosesAt: dateToBackendTime(orderClosesAt),
        scope,
      });

      return created;
    },
    onError: (error) => {
      toast.show({
        title: "No pudimos crear el menú",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      router.replace({ pathname: "/menu-create", params: { id: created.id } });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("Menú no disponible.");
      return menusApi.publish(editingId);
    },
    onError: (error) => {
      toast.show({
        title: "No pudimos publicar el menú",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      queryClient.invalidateQueries({ queryKey: ["menu", editingId] });
      router.replace({ pathname: "/menu-share", params: { id: editingId! } });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("Menú no disponible.");
      return menusApi.delete(editingId);
    },
    onError: (error) => {
      toast.show({
        title: "No pudimos eliminar el menú",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      setShowDelete(false);
      toast.show({ title: "Menú eliminado", tone: "success" });
      router.back();
    },
  });

  const isLoadingInitial = companiesQuery.isLoading || (isEditing && menuQuery.isLoading);

  const addButtonTitle =
    itemMode === "CATALOG" && pickedProductIds.length > 0
      ? `Agregar ${pickedProductIds.length} al menú`
      : "Agregar al menú";

  if (isEditing && menuQuery.isLoading) {
    return <LoadingState label="Cargando menú..." />;
  }
  if (isEditing && menuQuery.isError) {
    return (
      <ErrorState
        actionLabel="Reintentar"
        message={getApiErrorMessage(menuQuery.error)}
        onAction={() => menuQuery.refetch()}
        title="No pudimos cargar el menú"
      />
    );
  }

  return (
    <View style={styles.root}>
      <Hero
        compact
        tone="ink"
        eyebrow="Menús"
        onBack={() => router.back()}
        subtitle={
          isEditing
            ? "Agregá items o publicalo cuando esté listo."
            : "Usá global para publicar el mismo menú en varias empresas."
        }
        title={isEditing ? "Editar menú" : "Crear menú"}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isLoadingInitial ? (
          <View style={styles.skeletonGroup}>
            <Skeleton.Card height={200} />
            <Skeleton.Card height={140} />
            <Skeleton.Card height={180} />
          </View>
        ) : (
          <>
            {!isEditing && (
              <View style={styles.segmented}>
                {(["COMPANY", "GLOBAL"] as MenuScope[]).map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setScope(option);
                      if (option === "GLOBAL") {
                        setSelectedCompanyIds(companies.map((c) => c.id));
                      } else {
                        setSelectedCompanyIds([]);
                      }
                      setItemCompanyIds([]);
                    }}
                    style={[styles.segment, scope === option && styles.segmentActive]}
                  >
                    <Text style={[styles.segmentText, scope === option && styles.segmentTextActive]}>
                      {option === "COMPANY" ? "Por empresa" : "Global"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Card style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeader}>
                  <CalendarDays color={colors.brandRed} size={22} strokeWidth={1.8} />
                  <Text style={styles.sectionTitle}>Datos del menú</Text>
                </View>
                {isEditing && menu && (
                  <StatusPill
                    label={menu.status === "PUBLISHED" ? "Publicado" : "Borrador"}
                    tone={menu.status === "PUBLISHED" ? "success" : "warning"}
                  />
                )}
              </View>
              <DateTimeField label="Fecha" mode="date" onChange={setDate} value={date} />
              <DateTimeField
                label="Cierre de pedidos"
                mode="time"
                onChange={setOrderClosesAt}
                value={orderClosesAt}
              />

              {!isEditing && (
                <>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>
                      {scope === "COMPANY"
                        ? "Empresa"
                        : `Empresas incluidas (${companies.length})`}
                    </Text>
                  </View>
                  <ScrollView
                    contentContainerStyle={styles.choiceList}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                    style={styles.choiceListScroll}
                  >
                    {companies.map((company) => (
                      <CompanyChoice
                        company={company}
                        key={company.id}
                        multiple={scope === "GLOBAL"}
                        onPress={
                          scope === "GLOBAL"
                            ? undefined
                            : () => {
                                setSelectedCompanyIds([company.id]);
                                setItemCompanyIds([]);
                              }
                        }
                        selected={
                          scope === "GLOBAL" || selectedCompanyIds.includes(company.id)
                        }
                      />
                    ))}
                  </ScrollView>
                </>
              )}

              {isEditing && menu && (
                <Text style={styles.help}>
                  {menu.scope === "GLOBAL"
                    ? `${menu.companies.length} empresas asignadas`
                    : menu.companyName ?? "Sin empresa"}
                </Text>
              )}
            </Card>

            {isEditing && menu && menu.items.length > 0 && (
              <Card style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Utensils color={colors.brandRed} size={22} strokeWidth={1.8} />
                  <Text style={styles.sectionTitle}>Items del menú ({menu.items.length})</Text>
                </View>
                <View style={styles.itemList}>
                  {menu.items.map((item) => (
                    <View key={item.id} style={styles.itemRow}>
                      {item.photoUrl ? (
                        <Image source={{ uri: item.photoUrl }} style={styles.itemImage} />
                      ) : (
                        <View style={styles.itemImageFallback}>
                          <ImageOff color={colors.muted} size={18} strokeWidth={1.8} />
                        </View>
                      )}
                      <View style={styles.itemBody}>
                        <Text numberOfLines={1} style={styles.itemName}>
                          {item.name}
                        </Text>
                        <Text style={styles.itemMeta}>
                          {formatMoney(item.price)} · {item.category}
                          {item.remainingStock !== null ? ` · stock ${item.remainingStock}` : ""}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Card>
            )}

            {isEditing && (
              <Card style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Plus color={colors.brandRed} size={22} strokeWidth={1.8} />
                  <Text style={styles.sectionTitle}>Agregar item</Text>
                </View>

                <View style={styles.modeToggle}>
                  {(["CATALOG", "FREE"] as const).map((mode) => (
                    <Pressable
                      key={mode}
                      onPress={() => {
                        setItemMode(mode);
                        setPickedProductIds([]);
                        setPickedStocks({});
                      }}
                      style={[styles.modeChip, itemMode === mode && styles.modeChipActive]}
                    >
                      <Text
                        style={[styles.modeChipText, itemMode === mode && styles.modeChipTextActive]}
                      >
                        {mode === "CATALOG" ? "Desde catálogo" : "Libre"}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {itemMode === "CATALOG" ? (
                  <>
                    {productsQuery.isLoading ? (
                      <Text style={styles.help}>Cargando catálogo…</Text>
                    ) : (productsQuery.data ?? []).length === 0 ? (
                      <View style={styles.emptyCatalog}>
                        <Text style={styles.help}>
                          No tenés productos en el catálogo todavía.
                        </Text>
                        <Button
                          onPress={() => router.push("/products")}
                          size="small"
                          title="Crear productos"
                          variant="secondary"
                        />
                      </View>
                    ) : menuItemsQuery.isLoading ? (
                      <Text style={styles.help}>Cargando…</Text>
                    ) : (
                      <>
                        <ScrollView
                          contentContainerStyle={styles.categoryTabsContent}
                          horizontal
                          showsHorizontalScrollIndicator={false}
                        >
                          {CATEGORY_TABS.map((tab) => (
                            <Pressable
                              key={tab.value}
                              onPress={() => setFilterCategory(tab.value)}
                              style={[
                                styles.categoryTab,
                                filterCategory === tab.value && styles.categoryTabActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.categoryTabText,
                                  filterCategory === tab.value && styles.categoryTabTextActive,
                                ]}
                              >
                                {tab.label}
                              </Text>
                            </Pressable>
                          ))}
                        </ScrollView>

                        <View style={styles.choiceList}>
                          {filteredProducts.length === 0 ? (
                            <Text style={styles.help}>Ningún producto en esta categoría.</Text>
                          ) : (
                            filteredProducts.map((product) => {
                              const menuItemId = menuItemByName.get(normalizeName(product.name));
                              return (
                                <ProductChoice
                                  alreadyInMenu={!!menuItemId}
                                  key={product.id}
                                  onRemove={menuItemId ? () => removeItemMutation.mutate(menuItemId) : undefined}
                                  onSelect={() => {
                                    const isSelected = pickedProductIds.includes(product.id);
                                    if (isSelected) {
                                      setPickedProductIds((curr) =>
                                        curr.filter((id) => id !== product.id),
                                      );
                                      setPickedStocks((curr) => {
                                        const next = { ...curr };
                                        delete next[product.id];
                                        return next;
                                      });
                                    } else {
                                      setPickedProductIds((curr) => [...curr, product.id]);
                                    }
                                  }}
                                  onStockChange={(value) =>
                                    setPickedStocks((curr) => ({ ...curr, [product.id]: value }))
                                  }
                                  product={product}
                                  removePending={removeItemMutation.isPending}
                                  selected={pickedProductIds.includes(product.id)}
                                  stockValue={pickedStocks[product.id] ?? ""}
                                />
                              );
                            })
                          )}
                        </View>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Input label="Nombre" onChangeText={setItemName} value={itemName} />
                    <Input
                      keyboardType="decimal-pad"
                      label="Precio"
                      onChangeText={setPrice}
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
                      keyboardType="number-pad"
                      label="Stock"
                      onChangeText={setRemainingStock}
                      placeholder="Opcional"
                      value={remainingStock}
                    />
                  </>
                )}

                {scope === "GLOBAL" && selectedCompanies.length > 0 && (
                  <>
                    <Text style={styles.label}>Disponible para</Text>
                    <Text style={styles.help}>
                      Si no elegís empresas, el item aplica a todas las empresas del menú.
                    </Text>
                    <View style={styles.choiceList}>
                      {selectedCompanies.map((company) => (
                        <CompanyChoice
                          company={company}
                          key={company.id}
                          multiple
                          onPress={() =>
                            setItemCompanyIds((current) => toggleValue(current, company.id))
                          }
                          selected={itemCompanyIds.includes(company.id)}
                        />
                      ))}
                    </View>
                  </>
                )}

                <Button
                  disabled={
                    itemMode === "CATALOG"
                      ? pickedProductIds.length === 0
                      : !itemName.trim()
                  }
                  icon={Plus}
                  loading={addItemMutation.isPending}
                  onPress={() => addItemMutation.mutate()}
                  title={addButtonTitle}
                  variant="secondary"
                />
              </Card>
            )}

            {isEditing && menu && menu.status === "DRAFT" ? (
              <Button
                icon={Send}
                loading={publishMutation.isPending}
                onPress={() => setShowPublishConfirm(true)}
                title="Publicar menú"
              />
            ) : !isEditing ? (
              <Button
                icon={Plus}
                loading={createMenuMutation.isPending}
                onPress={() => createMenuMutation.mutate()}
                title="Crear menú"
              />
            ) : null}

            {isEditing && (
              <Card style={styles.dangerCard}>
                <View style={styles.sectionHeader}>
                  <Trash2 color={colors.brandRed} size={22} strokeWidth={1.8} />
                  <Text style={styles.sectionTitle}>Zona peligrosa</Text>
                </View>
                <Text style={styles.help}>
                  Eliminar este menú es permanente y borra todos sus ítems y pedidos asociados.
                </Text>
                <Button
                  icon={Trash2}
                  onPress={() => setShowDelete(true)}
                  title="Eliminar menú"
                  variant="danger"
                />
              </Card>
            )}
          </>
        )}
      </ScrollView>

      <DangerConfirmModal
        bullets={["Items del menú", "Pedidos asociados"]}
        description="Esta acción es permanente. Se va a borrar el menú y todo lo que contiene."
        destructiveLabel="Eliminar menú"
        loading={deleteMutation.isPending}
        onCancel={() => setShowDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="¿Eliminar este menú?"
        visible={showDelete}
      />

      <ConfirmModal
        confirmLabel="Publicar menú"
        description="Los empleados van a ver el menú y podrán pedir hasta el horario de cierre. Después de publicar no podrás eliminar items del menú."
        icon={Send}
        loading={publishMutation.isPending}
        onCancel={() => setShowPublishConfirm(false)}
        onConfirm={() => {
          setShowPublishConfirm(false);
          publishMutation.mutate();
        }}
        title="¿Publicar este menú?"
        visible={showPublishConfirm}
      />
    </View>
  );
}

function CompanyChoice({
  company,
  multiple: _multiple,
  onPress,
  selected,
}: {
  company: Company;
  multiple: boolean;
  onPress?: () => void;
  selected: boolean;
}) {
  const inner = (
    <>
      <View style={styles.choiceTextBlock}>
        <Text style={[styles.choiceTitle, selected && styles.choiceTitleSelected]}>
          {company.name}
        </Text>
        {!!company.address && <Text style={styles.choiceMeta}>{company.address}</Text>}
      </View>
      {selected && <Check color={colors.brandRed} size={19} strokeWidth={1.8} />}
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.choice, selected && styles.choiceSelected]}>{inner}</View>
    );
  }

  return (
    <Pressable onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}>
      {inner}
    </Pressable>
  );
}

function ProductChoice({
  alreadyInMenu,
  onRemove,
  onSelect,
  onStockChange,
  product,
  removePending,
  selected,
  stockValue,
}: {
  alreadyInMenu: boolean;
  onRemove?: () => void;
  onSelect: () => void;
  onStockChange: (value: string) => void;
  product: Product;
  removePending: boolean;
  selected: boolean;
  stockValue: string;
}) {
  return (
    <View
      style={[
        styles.productChoiceOuter,
        selected && styles.choiceSelected,
        alreadyInMenu && styles.choiceInMenu,
      ]}
    >
      <Pressable disabled={alreadyInMenu} onPress={onSelect} style={styles.productChoiceRow}>
        {product.photoUrl ? (
          <Image
            resizeMode="cover"
            source={{ uri: product.photoUrl }}
            style={styles.productThumb}
          />
        ) : (
          <View style={styles.productThumbFallback}>
            <ImageOff color={colors.muted} size={16} strokeWidth={2} />
          </View>
        )}

        <View style={styles.choiceTextBlock}>
          <Text
            style={[
              styles.choiceTitle,
              selected && styles.choiceTitleSelected,
              alreadyInMenu && styles.choiceTitleInMenu,
            ]}
          >
            {product.name}
          </Text>
          <Text style={styles.choiceMeta}>
            {formatMoney(product.price)} · {product.category}
          </Text>
        </View>

        {alreadyInMenu ? (
          <View style={styles.inMenuBadge}>
            <Text style={styles.inMenuText}>En menú ✓</Text>
          </View>
        ) : selected ? (
          <Check color={colors.brandRed} size={19} strokeWidth={1.8} />
        ) : null}
      </Pressable>

      {alreadyInMenu && onRemove && (
        <Pressable
          disabled={removePending}
          onPress={onRemove}
          style={styles.removeItemRow}
        >
          <Trash2 color={colors.brandRed} size={15} strokeWidth={2} />
          <Text style={styles.removeItemText}>Quitar del menú</Text>
        </Pressable>
      )}

      {/* Stock input expands inline when the product is selected */}
      {selected && (
        <View style={styles.stockInline}>
          <Text style={styles.stockLabel}>Stock (opcional)</Text>
          <TextInput
            keyboardType="number-pad"
            onChangeText={onStockChange}
            placeholder="Sin límite"
            placeholderTextColor={colors.placeholder}
            style={styles.stockInput}
            value={stockValue}
          />
        </View>
      )}
    </View>
  );
}

function parseNumber(value: string) {
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
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
  // Free-form category selector
  categoryActive: {
    backgroundColor: colors.redSoft,
    borderColor: colors.redBorder,
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
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  categoryText: {
    ...typography.captionStrong,
    color: colors.muted,
  },
  categoryTextActive: {
    color: colors.brandRed,
  },
  // Catalog category filter tabs
  categoryTabsContent: {
    gap: spacing.xs,
    paddingVertical: spacing.xxxs,
  },
  categoryTab: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  categoryTabActive: {
    backgroundColor: colors.redSoft,
    borderColor: colors.redBorder,
  },
  categoryTabText: {
    ...typography.captionStrong,
    color: colors.muted,
  },
  categoryTabTextActive: {
    color: colors.brandRed,
  },
  // Company choice rows (unchanged shape)
  choice: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 54,
    padding: spacing.md,
  },
  choiceList: {
    gap: spacing.sm,
  },
  choiceListScroll: {
    maxHeight: 280,
  },
  choiceMeta: {
    ...typography.caption,
    color: colors.muted,
  },
  choiceSelected: {
    backgroundColor: colors.redSoft,
    borderColor: colors.redBorder,
  },
  choiceInMenu: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  choiceTextBlock: {
    flex: 1,
  },
  choiceTitle: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  choiceTitleSelected: {
    color: colors.brandRed,
  },
  choiceTitleInMenu: {
    color: colors.success,
  },
  // Product choice card (column layout to allow expandable stock row)
  productChoiceOuter: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  productChoiceRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  productThumb: {
    borderRadius: radius.sm,
    height: 44,
    width: 44,
  },
  productThumbFallback: {
    alignItems: "center",
    backgroundColor: colors.border,
    borderRadius: radius.sm,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  inMenuBadge: {
    backgroundColor: colors.success,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  inMenuText: {
    ...typography.caption,
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  removeItemRow: {
    alignItems: "center",
    borderTopColor: colors.successSoft,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  removeItemText: {
    ...typography.caption,
    color: colors.brandRed,
    fontSize: 13,
  },
  // Inline stock field — appears inside the selected product card
  stockInline: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  stockLabel: {
    ...typography.caption,
    color: colors.muted,
    flex: 1,
  },
  stockInput: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.ink,
    minWidth: 90,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textAlign: "right",
  },
  help: {
    ...typography.caption,
    color: colors.muted,
  },
  dangerCard: {
    borderColor: colors.redBorder,
    borderWidth: 1,
    gap: spacing.md,
  },
  itemBody: {
    flex: 1,
  },
  itemImage: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    height: 48,
    width: 48,
  },
  itemImageFallback: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  itemList: {
    gap: spacing.sm,
  },
  itemMeta: {
    ...typography.caption,
    color: colors.muted,
  },
  itemName: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  itemRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  label: {
    ...typography.captionStrong,
    color: colors.ink,
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  sectionHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.ink,
  },
  segment: {
    alignItems: "center",
    borderRadius: radius.sm,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
  },
  segmentActive: {
    backgroundColor: colors.brandRed,
  },
  segmented: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
  },
  segmentText: {
    ...typography.captionStrong,
    color: colors.muted,
  },
  segmentTextActive: {
    color: colors.onBrand,
  },
  modeToggle: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    flexDirection: "row",
    padding: 4,
  },
  modeChip: {
    alignItems: "center",
    borderRadius: radius.pill,
    flex: 1,
    justifyContent: "center",
    minHeight: 36,
  },
  modeChipActive: {
    backgroundColor: colors.brandRed,
  },
  modeChipText: {
    ...typography.captionStrong,
    color: colors.muted,
  },
  modeChipTextActive: {
    color: colors.onBrand,
  },
  emptyCatalog: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    gap: spacing.sm,
    padding: spacing.md,
  },
});
