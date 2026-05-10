import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Building2, MapPin, Pencil, Plus, RefreshCw } from "lucide-react-native";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { getApiErrorMessage } from "../../src/api/client";
import { companiesApi } from "../../src/api/companies";
import { Card } from "../../src/components/Card";
import { Hero } from "../../src/components/Hero";
import { Skeleton } from "../../src/components/Skeleton";
import { EmptyState, ErrorState } from "../../src/components/StateViews";
import { StatusPill } from "../../src/components/StatusPill";
import { mapResultStore } from "../../src/stores/mapResult";
import { colors, radius, shadows, spacing, typography } from "../../src/theme";
import type { Company } from "../../src/types";

export default function CompaniesScreen() {
  const companiesQuery = useQuery({
    queryFn: companiesApi.list,
    queryKey: ["companies"],
  });

  if (companiesQuery.isError) {
    return (
      <ErrorState
        actionLabel="Reintentar"
        icon={RefreshCw}
        message={getApiErrorMessage(companiesQuery.error)}
        onAction={() => companiesQuery.refetch()}
        title="No pudimos cargar las empresas"
      />
    );
  }

  const companies = companiesQuery.data ?? [];

  const goCreate = () => {
    mapResultStore.clear();
    router.push("/company-form");
  };

  const withLocation = companies.filter(
    (c) => typeof c.latitude === "number" && typeof c.longitude === "number",
  ).length;

  return (
    <View style={styles.root}>
      <Hero
        eyebrow="Empresas"
        title="Tus clientes"
        subtitle="Empresas que reciben los menús del día."
      >
        <View style={styles.statsRow}>
          <StatChip label={String(companies.length)} caption={companies.length === 1 ? "empresa" : "empresas"} />
          <StatChip label={String(withLocation)} caption="con ubicación" />
        </View>
      </Hero>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            colors={[colors.brandRed]}
            onRefresh={() => companiesQuery.refetch()}
            refreshing={companiesQuery.isFetching && !companiesQuery.isLoading}
            tintColor={colors.brandRed}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={goCreate}
          style={({ pressed }) => [styles.primaryAction, pressed && styles.actionPressed]}
        >
          <View style={styles.primaryActionIcon}>
            <Plus color={colors.onBrand} size={26} strokeWidth={2.4} />
          </View>
          <View style={styles.primaryActionCopy}>
            <Text style={styles.primaryActionTitle}>Crear empresa</Text>
            <Text style={styles.primaryActionMeta}>
              Cargá nombre, dirección y elegí ubicación en el mapa.
            </Text>
          </View>
        </Pressable>

        {companiesQuery.isLoading ? (
          <View style={styles.list}>
            <Skeleton.Row withIcon />
            <Skeleton.Row withIcon />
            <Skeleton.Row withIcon />
          </View>
        ) : companies.length === 0 ? (
          <EmptyState
            actionLabel="Crear empresa"
            icon={Building2}
            message="Todavía no tenés empresas cargadas."
            onAction={goCreate}
            title="Sin empresas"
          />
        ) : (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listLabel}>Listado</Text>
              <Text style={styles.listHint}>
                {companies.length} {companies.length === 1 ? "empresa" : "empresas"}
              </Text>
            </View>
            <View style={styles.list}>
              {companies.map((company) => (
                <CompanyCard company={company} key={company.id} />
              ))}
            </View>
          </>
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

function CompanyCard({ company }: { company: Company }) {
  const hasLocation =
    typeof company.latitude === "number" && typeof company.longitude === "number";

  return (
    <Card style={styles.card} variant="elevated">
      <View style={styles.cardIcon}>
        <Building2 color={colors.brandRed} size={22} strokeWidth={2.4} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{company.name}</Text>
        {!!company.address && (
          <View style={styles.addressRow}>
            <MapPin color={colors.muted} size={14} strokeWidth={2.4} />
            <Text numberOfLines={2} style={styles.cardMeta}>
              {company.address}
            </Text>
          </View>
        )}
        {hasLocation ? (
          <Text style={styles.coordsCaption}>
            {company.latitude!.toFixed(5)}, {company.longitude!.toFixed(5)}
          </Text>
        ) : (
          <View style={styles.statusWrap}>
            <StatusPill label="Sin ubicación" tone="warning" />
          </View>
        )}
      </View>
      <Pressable
        accessibilityLabel={`Editar ${company.name}`}
        hitSlop={10}
        onPress={() => {
          mapResultStore.clear();
          router.push({ pathname: "/company-form", params: { id: company.id } });
        }}
        style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}
      >
        <Pencil color={colors.brandRed} size={18} strokeWidth={2.4} />
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
  primaryAction: {
    alignItems: "center",
    backgroundColor: colors.brandRed,
    borderRadius: radius.xl,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.brand,
  },
  primaryActionIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: radius.md,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  primaryActionCopy: {
    flex: 1,
    gap: 2,
  },
  primaryActionTitle: {
    color: colors.onBrand,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  primaryActionMeta: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    lineHeight: 18,
  },
  actionPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  listHeader: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  listLabel: {
    ...typography.h2,
    color: colors.ink,
  },
  listHint: {
    ...typography.caption,
    color: colors.muted,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
  },
  cardIcon: {
    alignItems: "center",
    backgroundColor: colors.redSoft,
    borderRadius: radius.md,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  cardBody: {
    flex: 1,
    gap: spacing.xs,
  },
  cardTitle: {
    ...typography.bodyStrong,
    color: colors.ink,
    fontSize: 17,
  },
  addressRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.xs,
    paddingTop: 2,
  },
  cardMeta: {
    ...typography.caption,
    color: colors.inkSoft,
    flex: 1,
  },
  coordsCaption: {
    ...typography.caption,
    color: colors.muted,
  },
  statusWrap: {
    marginTop: spacing.xxxs,
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
