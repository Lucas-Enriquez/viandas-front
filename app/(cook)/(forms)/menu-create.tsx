import { useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import {
  CalendarDays,
  Check,
  ImageOff,
  Plus,
  Send,
  Utensils,
} from "lucide-react-native";

import { getApiErrorMessage } from "../../../src/api/client";
import { companiesApi } from "../../../src/api/companies";
import { menusApi } from "../../../src/api/menus";
import { Button } from "../../../src/components/Button";
import { Card } from "../../../src/components/Card";
import { DateTimeField } from "../../../src/components/DateTimeField";
import { Hero } from "../../../src/components/Hero";
import { Input } from "../../../src/components/Input";
import { Skeleton } from "../../../src/components/Skeleton";
import { StatusPill } from "../../../src/components/StatusPill";
import { useToast } from "../../../src/providers/ToastProvider";
import { colors, radius, spacing, typography } from "../../../src/theme";
import type { Company, MenuItemCategory, MenuScope } from "../../../src/types";
import { dateToBackendTime, timeToDate, todayYmd, ymdToDate } from "../../../src/utils/date";
import { formatMoney } from "../../../src/utils/format";

const CATEGORIES: Array<{ label: string; value: MenuItemCategory }> = [
  { label: "Plato", value: "PLATO" },
  { label: "Minuta", value: "MINUTA" },
  { label: "Ensalada", value: "ENSALADA" },
];

export default function MenuCreateScreen() {
  const params = useLocalSearchParams<{ id?: string; scope?: MenuScope }>();
  const editingId = params.id;
  const isEditing = !!editingId;
  const queryClient = useQueryClient();
  const toast = useToast();

  const initialScope = params.scope === "GLOBAL" ? "GLOBAL" : "COMPANY";
  const [scope, setScope] = useState<MenuScope>(initialScope);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [itemCompanyIds, setItemCompanyIds] = useState<string[]>([]);
  const [date, setDate] = useState(() => ymdToDate(todayYmd()));
  const [orderClosesAt, setOrderClosesAt] = useState(() => timeToDate("11:30:00"));
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<MenuItemCategory>("PLATO");
  const [remainingStock, setRemainingStock] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const companiesQuery = useQuery({
    queryFn: companiesApi.list,
    queryKey: ["companies"],
  });

  const menuQuery = useQuery({
    enabled: isEditing,
    queryFn: () => menusApi.get(editingId!),
    queryKey: ["menu", editingId],
  });

  const menu = menuQuery.data;

  useEffect(() => {
    if (!menu) return;
    setScope(menu.scope);
    setSelectedCompanyIds(menu.companies.map((c) => c.id));
    setDate(ymdToDate(menu.date));
    setOrderClosesAt(timeToDate(menu.orderClosesAt));
  }, [menu]);

  const companies = companiesQuery.data ?? [];
  const selectedCompanies = useMemo(
    () => companies.filter((company) => selectedCompanyIds.includes(company.id)),
    [companies, selectedCompanyIds],
  );

  // Auto-select all companies on first GLOBAL mount (when not editing).
  // Editing inherits selection from the menu itself via the `menu` effect above.
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

  const allSelected =
    companies.length > 0 && selectedCompanyIds.length === companies.length;
  const toggleAllCompanies = () => {
    setSelectedCompanyIds(allSelected ? [] : companies.map((c) => c.id));
  };

  const addItemMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("Menú no disponible.");
      if (!itemName.trim()) throw new Error("Ingresá el nombre del item.");
      const parsedPrice = parseNumber(price);
      if (!parsedPrice || parsedPrice <= 0) {
        throw new Error("Ingresá un precio válido.");
      }
      const parsedStock = remainingStock.trim() ? parseNumber(remainingStock) : undefined;

      await menusApi.addItem(editingId, {
        availableCompanyIds: scope === "GLOBAL" ? itemCompanyIds : undefined,
        category,
        name: itemName.trim(),
        photoUrl: photoUrl.trim() || undefined,
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
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      setItemName("");
      setPrice("");
      setRemainingStock("");
      setPhotoUrl("");
      setItemCompanyIds([]);
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

      if (itemName.trim()) {
        const parsedPrice = parseNumber(price);
        const parsedStock = remainingStock.trim() ? parseNumber(remainingStock) : undefined;
        if (!parsedPrice || parsedPrice <= 0) {
          throw new Error("Ingresá un precio válido para el item.");
        }

        await menusApi.addItem(created.id, {
          availableCompanyIds: scope === "GLOBAL" ? itemCompanyIds : undefined,
          category,
          name: itemName.trim(),
          photoUrl: photoUrl.trim() || undefined,
          price: parsedPrice,
          remainingStock: parsedStock,
        });
      }

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

  const isLoadingInitial = companiesQuery.isLoading || (isEditing && menuQuery.isLoading);

  return (
    <View style={styles.root}>
      <Hero
        compact
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
            <CalendarDays color={colors.brandRed} size={22} strokeWidth={2.4} />
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
                {scope === "COMPANY" ? "Empresa" : "Empresas incluidas"}
              </Text>
              {scope === "GLOBAL" && companies.length > 0 && (
                <Pressable hitSlop={8} onPress={toggleAllCompanies}>
                  <Text style={styles.toggleAll}>
                    {allSelected ? "Quitar todas" : "Seleccionar todas"}
                  </Text>
                </Pressable>
              )}
            </View>
            <View style={styles.choiceList}>
              {companies.map((company) => (
                <CompanyChoice
                  company={company}
                  key={company.id}
                  multiple={scope === "GLOBAL"}
                  onPress={() => {
                    if (scope === "COMPANY") {
                      setSelectedCompanyIds([company.id]);
                      setItemCompanyIds([]);
                      return;
                    }
                    setSelectedCompanyIds((current) => toggleValue(current, company.id));
                  }}
                  selected={selectedCompanyIds.includes(company.id)}
                />
              ))}
            </View>
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
            <Utensils color={colors.brandRed} size={22} strokeWidth={2.4} />
            <Text style={styles.sectionTitle}>Items del menú ({menu.items.length})</Text>
          </View>
          <View style={styles.itemList}>
            {menu.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                {item.photoUrl ? (
                  <Image source={{ uri: item.photoUrl }} style={styles.itemImage} />
                ) : (
                  <View style={styles.itemImageFallback}>
                    <ImageOff color={colors.muted} size={18} strokeWidth={2.4} />
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

      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Plus color={colors.brandRed} size={22} strokeWidth={2.4} />
          <Text style={styles.sectionTitle}>
            {isEditing ? "Agregar item" : "Primer item opcional"}
          </Text>
        </View>
        <Input label="Nombre" onChangeText={setItemName} value={itemName} />
        <Input keyboardType="decimal-pad" label="Precio" onChangeText={setPrice} value={price} />

        <Text style={styles.label}>Categoría</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setCategory(option.value)}
              style={[styles.categoryOption, category === option.value && styles.categoryActive]}
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
        <Input
          autoCapitalize="none"
          label="Foto URL"
          onChangeText={setPhotoUrl}
          placeholder="Opcional"
          value={photoUrl}
        />

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
                  onPress={() => setItemCompanyIds((current) => toggleValue(current, company.id))}
                  selected={itemCompanyIds.includes(company.id)}
                />
              ))}
            </View>
          </>
        )}

        {isEditing && (
          <Button
            icon={Plus}
            loading={addItemMutation.isPending}
            onPress={() => addItemMutation.mutate()}
            title="Agregar al menú"
            variant="secondary"
          />
        )}
      </Card>

      {isEditing && menu && menu.status === "DRAFT" ? (
        <Button
          icon={Send}
          loading={publishMutation.isPending}
          onPress={() => publishMutation.mutate()}
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
          </>
        )}
      </ScrollView>
    </View>
  );
}

function CompanyChoice({
  company,
  multiple,
  onPress,
  selected,
}: {
  company: Company;
  multiple: boolean;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}>
      <View style={styles.choiceTextBlock}>
        <Text style={[styles.choiceTitle, selected && styles.choiceTitleSelected]}>
          {company.name}
        </Text>
        {!!company.address && <Text style={styles.choiceMeta}>{company.address}</Text>}
      </View>
      {selected && <Check color={colors.brandRed} size={19} strokeWidth={2.5} />}
      {!multiple && selected ? null : null}
    </Pressable>
  );
}

function parseNumber(value: string) {
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
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
  choiceMeta: {
    ...typography.caption,
    color: colors.muted,
  },
  choiceSelected: {
    backgroundColor: colors.redSoft,
    borderColor: colors.redBorder,
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
  help: {
    ...typography.caption,
    color: colors.muted,
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
  toggleAll: {
    ...typography.captionStrong,
    color: colors.brandRed,
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
});
