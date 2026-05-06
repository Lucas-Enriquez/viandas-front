import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { CalendarDays, Check, Plus, Utensils } from "lucide-react-native";

import { getApiErrorMessage } from "../../src/api/client";
import { companiesApi } from "../../src/api/companies";
import { menusApi } from "../../src/api/menus";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { DateTimeField } from "../../src/components/DateTimeField";
import { Input } from "../../src/components/Input";
import { LoadingState } from "../../src/components/StateViews";
import { Screen } from "../../src/components/Screen";
import { colors, spacing, typography } from "../../src/theme";
import type { Company, MenuItemCategory, MenuScope } from "../../src/types";
import { dateToBackendTime, timeToDate, todayYmd, ymdToDate } from "../../src/utils/date";

const CATEGORIES: Array<{ label: string; value: MenuItemCategory }> = [
  { label: "Plato", value: "PLATO" },
  { label: "Minuta", value: "MINUTA" },
  { label: "Ensalada", value: "ENSALADA" },
];

export default function MenuCreateScreen() {
  const params = useLocalSearchParams<{ scope?: MenuScope }>();
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
  const queryClient = useQueryClient();

  const companiesQuery = useQuery({
    queryFn: companiesApi.list,
    queryKey: ["companies"],
  });

  const companies = companiesQuery.data ?? [];
  const selectedCompanies = useMemo(
    () => companies.filter((company) => selectedCompanyIds.includes(company.id)),
    [companies, selectedCompanyIds],
  );

  const createMenuMutation = useMutation({
    mutationFn: async () => {
      if (selectedCompanyIds.length === 0) {
        throw new Error("Elegí al menos una empresa.");
      }

      const menu = await menusApi.create({
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

        await menusApi.addItem(menu.id, {
          availableCompanyIds: scope === "GLOBAL" ? itemCompanyIds : undefined,
          category,
          name: itemName.trim(),
          photoUrl: photoUrl.trim() || undefined,
          price: parsedPrice,
          remainingStock: parsedStock,
        });
      }

      return menu;
    },
    onError: (error) => {
      Alert.alert("No pudimos crear el menú", getApiErrorMessage(error));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      Alert.alert("Menú creado", "Ya podés publicarlo desde la lista.");
      router.replace("/menus");
    },
  });

  if (companiesQuery.isLoading) {
    return <LoadingState label="Cargando empresas..." />;
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Menús</Text>
        <Text style={styles.title}>Crear menú</Text>
        <Text style={styles.subtitle}>
          Usá global para publicar el mismo menú en varias empresas.
        </Text>
      </View>

      <View style={styles.segmented}>
        {(["COMPANY", "GLOBAL"] as MenuScope[]).map((option) => (
          <Pressable
            key={option}
            onPress={() => {
              setScope(option);
              setSelectedCompanyIds([]);
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

      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <CalendarDays color={colors.brandRed} size={22} strokeWidth={2.4} />
          <Text style={styles.sectionTitle}>Datos del menú</Text>
        </View>
        <DateTimeField label="Fecha" mode="date" onChange={setDate} value={date} />
        <DateTimeField
          label="Cierre de pedidos"
          mode="time"
          onChange={setOrderClosesAt}
          value={orderClosesAt}
        />
        <Text style={styles.label}>
          {scope === "COMPANY" ? "Empresa" : "Empresas incluidas"}
        </Text>
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
      </Card>

      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Utensils color={colors.brandRed} size={22} strokeWidth={2.4} />
          <Text style={styles.sectionTitle}>Primer item opcional</Text>
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
      </Card>

      <Button
        icon={Plus}
        loading={createMenuMutation.isPending}
        onPress={() => createMenuMutation.mutate()}
        title="Crear menú"
      />
    </Screen>
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
  categoryActive: {
    backgroundColor: colors.redSoft,
    borderColor: colors.redBorder,
  },
  categoryOption: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
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
    borderRadius: 8,
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
  eyebrow: {
    ...typography.captionStrong,
    color: colors.brandRed,
  },
  header: {
    gap: spacing.xs,
  },
  help: {
    ...typography.caption,
    color: colors.muted,
  },
  label: {
    ...typography.captionStrong,
    color: colors.ink,
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
  segment: {
    alignItems: "center",
    borderRadius: 8,
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
    borderRadius: 8,
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
  subtitle: {
    ...typography.body,
    color: colors.muted,
  },
  title: {
    ...typography.h1,
    color: colors.ink,
  },
});
