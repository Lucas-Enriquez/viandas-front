import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Building2, MapPin, Pencil, Plus, RefreshCw } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getApiErrorMessage } from "../../src/api/client";
import { companiesApi } from "../../src/api/companies";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { EmptyState, ErrorState, LoadingState } from "../../src/components/StateViews";
import { Screen } from "../../src/components/Screen";
import { colors, spacing, typography } from "../../src/theme";
import type { Company } from "../../src/types";

export default function CompaniesScreen() {
  const companiesQuery = useQuery({
    queryFn: companiesApi.list,
    queryKey: ["companies"],
  });

  if (companiesQuery.isLoading) {
    return <LoadingState label="Buscando empresas..." />;
  }

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

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Building2 color={colors.brandRed} size={26} strokeWidth={2.4} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>Empresas</Text>
          <Text style={styles.title}>Gestioná tus empresas</Text>
          <Text style={styles.subtitle}>
            Cargá dirección y coordenadas para que el delivery pueda calcular cercanía.
          </Text>
        </View>
      </View>

      <Button
        icon={Plus}
        onPress={() => router.push("/company-form")}
        title="Crear empresa"
        variant="secondary"
      />

      {companies.length === 0 ? (
        <EmptyState
          actionLabel="Crear empresa"
          icon={Building2}
          message="Todavía no tenés empresas cargadas."
          onAction={() => router.push("/company-form")}
          title="Sin empresas"
        />
      ) : (
        <View style={styles.list}>
          {companies.map((company) => (
            <CompanyCard company={company} key={company.id} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function CompanyCard({ company }: { company: Company }) {
  const hasLocation =
    typeof company.latitude === "number" && typeof company.longitude === "number";

  return (
    <Card style={styles.card}>
      <View style={styles.cardIcon}>
        <Building2 color={colors.brandRed} size={24} strokeWidth={2.4} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{company.name}</Text>
        {!!company.address && <Text style={styles.cardMeta}>{company.address}</Text>}
        <View style={styles.locationRow}>
          <MapPin
              color={hasLocation ? colors.success : colors.warning}
            size={16}
            strokeWidth={2.4}
          />
          <Text style={styles.locationText}>
            {hasLocation
              ? `${company.latitude?.toFixed(5)}, ${company.longitude?.toFixed(5)}`
              : "Sin ubicación cargada"}
          </Text>
        </View>
      </View>
      <Pressable
        accessibilityLabel={`Editar ${company.name}`}
        hitSlop={10}
        onPress={() => router.push({ pathname: "/company-form", params: { id: company.id } })}
        style={styles.editButton}
      >
        <Pencil color={colors.brandRed} size={20} strokeWidth={2.4} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  cardBody: {
    flex: 1,
    gap: spacing.xs,
  },
  cardIcon: {
    alignItems: "center",
    backgroundColor: colors.redSoft,
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  cardMeta: {
    ...typography.body,
    color: colors.muted,
  },
  cardTitle: {
    ...typography.h2,
    color: colors.ink,
  },
  editButton: {
    alignItems: "center",
    backgroundColor: colors.redSoft,
    borderRadius: 8,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  eyebrow: {
    ...typography.captionStrong,
    color: colors.brandRed,
  },
  hero: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
  },
  heroCopy: {
    flex: 1,
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: colors.yellowSoft,
    borderRadius: 8,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  list: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  locationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  locationText: {
    ...typography.caption,
    color: colors.muted,
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  title: {
    ...typography.h1,
    color: colors.ink,
  },
});
