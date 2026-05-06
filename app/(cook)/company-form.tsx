import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Building2, MapPin, Save } from "lucide-react-native";

import { getApiErrorMessage } from "../../src/api/client";
import { companiesApi } from "../../src/api/companies";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { Input } from "../../src/components/Input";
import { LoadingState } from "../../src/components/StateViews";
import { Screen } from "../../src/components/Screen";
import { colors, spacing, typography } from "../../src/theme";
import type { CompanyRequest } from "../../src/types";

export default function CompanyFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [whatsappGroupLabel, setWhatsappGroupLabel] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const companyQuery = useQuery({
    enabled: isEditing,
    queryFn: () => companiesApi.get(id!),
    queryKey: ["company", id],
  });

  useEffect(() => {
    if (!companyQuery.data) {
      return;
    }

    setName(companyQuery.data.name);
    setAddress(companyQuery.data.address ?? "");
    setNotes(companyQuery.data.notes ?? "");
    setWhatsappGroupLabel(companyQuery.data.whatsappGroupLabel ?? "");
    setLatitude(companyQuery.data.latitude?.toString() ?? "");
    setLongitude(companyQuery.data.longitude?.toString() ?? "");
  }, [companyQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) {
        throw new Error("Ingresá el nombre de la empresa.");
      }

      const lat = parseOptionalNumber(latitude);
      const lng = parseOptionalNumber(longitude);
      if ((lat === undefined) !== (lng === undefined)) {
        throw new Error("Completá latitud y longitud, o dejá ambas vacías.");
      }

      const body: CompanyRequest = {
        address: address.trim() || null,
        latitude: lat ?? null,
        locationSource: lat !== undefined && lng !== undefined ? "MANUAL" : null,
        longitude: lng ?? null,
        name: name.trim(),
        notes: notes.trim() || null,
        whatsappGroupLabel: whatsappGroupLabel.trim() || null,
      };

      return isEditing ? companiesApi.update(id!, body) : companiesApi.create(body);
    },
    onError: (error) => {
      Alert.alert("No pudimos guardar la empresa", getApiErrorMessage(error));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      Alert.alert("Empresa guardada", "Los datos quedaron actualizados.");
      router.replace("/companies");
    },
  });

  if (companyQuery.isLoading) {
    return <LoadingState label="Cargando empresa..." />;
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Empresas</Text>
        <Text style={styles.title}>{isEditing ? "Editar empresa" : "Crear empresa"}</Text>
        <Text style={styles.subtitle}>
          La ubicación se usa para calcular si el reparto está cerca.
        </Text>
      </View>

      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Building2 color={colors.brandRed} size={22} strokeWidth={2.4} />
          <Text style={styles.sectionTitle}>Datos generales</Text>
        </View>
        <Input label="Nombre" onChangeText={setName} value={name} />
        <Input label="Dirección" onChangeText={setAddress} value={address} />
        <Input label="Notas" multiline onChangeText={setNotes} value={notes} />
        <Input
          label="Grupo de WhatsApp"
          onChangeText={setWhatsappGroupLabel}
          value={whatsappGroupLabel}
        />
      </Card>

      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <MapPin color={colors.brandRed} size={22} strokeWidth={2.4} />
          <Text style={styles.sectionTitle}>Ubicación manual</Text>
        </View>
        <Input
          keyboardType="decimal-pad"
          label="Latitud"
          onChangeText={setLatitude}
          placeholder="-34.3921711"
          value={latitude}
        />
        <Input
          keyboardType="decimal-pad"
          label="Longitud"
          onChangeText={setLongitude}
          placeholder="-58.6627832"
          value={longitude}
        />
      </Card>

      <Button
        icon={Save}
        loading={saveMutation.isPending}
        onPress={() => saveMutation.mutate()}
        title="Guardar empresa"
      />
    </Screen>
  );
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

const styles = StyleSheet.create({
  eyebrow: {
    ...typography.captionStrong,
    color: colors.brandRed,
  },
  header: {
    gap: spacing.xs,
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
  subtitle: {
    ...typography.body,
    color: colors.muted,
  },
  title: {
    ...typography.h1,
    color: colors.ink,
  },
});
