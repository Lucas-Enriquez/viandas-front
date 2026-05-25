import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, ScrollView, Share, StyleSheet, Text, View } from "react-native"; // Alert kept for shareLink fallback
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  Building2,
  Link2,
  MapPin,
  Navigation,
  Save,
  Send,
  Trash2,
} from "lucide-react-native";

import { ApiError, getApiErrorMessage } from "../../../src/api/client";
import { companiesApi } from "../../../src/api/companies";
import { Button } from "../../../src/components/Button";
import { Card } from "../../../src/components/Card";
import { DangerConfirmModal } from "../../../src/components/DangerConfirmModal";
import { Hero } from "../../../src/components/Hero";
import { Input } from "../../../src/components/Input";
import { Skeleton } from "../../../src/components/Skeleton";
import { ErrorState, LoadingState } from "../../../src/components/StateViews";
import { useToast } from "../../../src/providers/ToastProvider";
import { buildInvitationLink } from "../../../src/config";
import { mapResultStore } from "../../../src/stores/mapResult";
import { colors, radius, spacing, typography } from "../../../src/theme";
import type { CompanyRequest, GlobalInvitationResponse } from "../../../src/types";
import { formatRelativeDateTime } from "../../../src/utils/date";

export default function CompanyFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const queryClient = useQueryClient();
  const toast = useToast();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [whatsappGroupLabel, setWhatsappGroupLabel] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [generated, setGenerated] = useState<GlobalInvitationResponse | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  const companyQuery = useQuery({
    enabled: isEditing,
    queryFn: () => companiesApi.get(id!),
    queryKey: ["company", id],
  });

  const invitationQuery = useQuery({
    enabled: isEditing,
    queryFn: async () => {
      try {
        return await companiesApi.getGlobalInvitation(id!);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return null;
        }
        throw err;
      }
    },
    queryKey: ["company", id, "global-invitation"],
    retry: false,
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

  useFocusEffect(
    useCallback(() => {
      const result = mapResultStore.get();

      if (!isEditing && !result) {
        setName("");
        setAddress("");
        setNotes("");
        setWhatsappGroupLabel("");
        setLatitude("");
        setLongitude("");
        setGenerated(null);
      }

      if (result) {
        setLatitude(result.lat.toFixed(6));
        setLongitude(result.lng.toFixed(6));
        if (result.address) {
          setAddress(result.address);
        }
        mapResultStore.clear();
      }
    }, [isEditing]),
  );

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
      toast.show({
        title: "No pudimos guardar la empresa",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.show({
        title: "Empresa guardada",
        message: "Los datos quedaron actualizados.",
        tone: "success",
      });
      router.replace("/companies");
    },
  });

  const generateInvitationMutation = useMutation({
    mutationFn: () => companiesApi.createGlobalInvitation(id!, { maxUses: null }),
    onError: (error) => {
      toast.show({
        title: "No pudimos generar el link",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: (response) => {
      setGenerated(response);
      queryClient.invalidateQueries({ queryKey: ["company", id, "global-invitation"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => companiesApi.delete(id!),
    onError: (error) => {
      toast.show({
        title: "No pudimos eliminar",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setShowDelete(false);
      toast.show({ title: "Empresa eliminada", tone: "success" });
      router.replace("/companies");
    },
  });

  const invitation = invitationQuery.data;
  const isLoadingInitial = isEditing && companyQuery.isLoading;

  if (isEditing && companyQuery.isLoading) {
    return <LoadingState label="Cargando empresa..." />;
  }
  if (isEditing && companyQuery.isError) {
    return (
      <ErrorState
        actionLabel="Reintentar"
        message={getApiErrorMessage(companyQuery.error)}
        onAction={() => companyQuery.refetch()}
        title="No pudimos cargar la empresa"
      />
    );
  }

  const shareLink = async (link: string) => {
    try {
      await Share.share({ message: link });
    } catch {
      try {
        await Linking.openURL(link);
      } catch {
        Alert.alert("No pudimos compartir", link);
      }
    }
  };

  return (
    <View style={styles.root}>
      <Hero
        compact
        tone="ink"
        eyebrow="Empresas"
        onBack={() => router.back()}
        subtitle="La ubicación se usa para calcular si el reparto está cerca."
        title={isEditing ? "Editar empresa" : "Crear empresa"}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isLoadingInitial ? (
          <View style={styles.skeletonGroup}>
            <Skeleton.Card height={220} />
            <Skeleton.Card height={140} />
          </View>
        ) : (
          <>
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Building2 color={colors.brandRed} size={22} strokeWidth={1.8} />
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
          <MapPin color={colors.brandRed} size={22} strokeWidth={1.8} />
          <Text style={styles.sectionTitle}>Ubicación</Text>
        </View>
        {latitude && longitude ? (
          <View style={styles.coordsCard}>
            <View style={styles.coordsRow}>
              <Navigation color={colors.success} size={16} strokeWidth={1.8} />
              <Text style={styles.coordsValue}>
                {latitude}, {longitude}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.coordsEmpty}>Sin coordenadas guardadas.</Text>
        )}
        <Button
          icon={MapPin}
          title="Elegir en mapa"
          variant="secondary"
          onPress={() => router.push("/map-picker")}
        />
      </Card>

      {isEditing && (
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Link2 color={colors.brandRed} size={22} strokeWidth={1.8} />
            <Text style={styles.sectionTitle}>Link para empleados</Text>
          </View>

          {generated ? (
            <View style={styles.generatedCard}>
              <Text style={styles.generatedHint}>
                Guardá este link, no se vuelve a mostrar.
              </Text>
              <Text selectable style={styles.generatedLink}>
                {buildInvitationLink(generated.token)}
              </Text>
              <Button
                icon={Send}
                onPress={() => shareLink(buildInvitationLink(generated.token))}
                size="small"
                title="Compartir link"
              />
            </View>
          ) : invitation ? (
            <View style={styles.invitationCard}>
              <Text style={styles.invitationStatus}>
                Activo · {invitation.usedCount}/{invitation.maxUses ?? "∞"} usos
              </Text>
              <Text style={styles.invitationMeta}>
                Vence {formatRelativeDateTime(invitation.expiresAt)}
              </Text>
            </View>
          ) : (
            <Text style={styles.coordsEmpty}>No hay link activo todavía.</Text>
          )}

          <Button
            icon={Link2}
            loading={generateInvitationMutation.isPending}
            onPress={() => generateInvitationMutation.mutate()}
            title={invitation || generated ? "Generar nuevo link" : "Generar link"}
            variant="secondary"
          />
        </Card>
      )}

      <Button
        icon={Save}
        loading={saveMutation.isPending}
        onPress={() => saveMutation.mutate()}
        title="Guardar empresa"
      />

      {isEditing && (
        <Button
          icon={Trash2}
          onPress={() => setShowDelete(true)}
          title="Eliminar empresa"
          variant="ghost"
        />
      )}

          </>
        )}
      </ScrollView>

      <DangerConfirmModal
        bullets={[
          "Pedidos asociados",
          "Menús de la empresa",
          "Sesiones de reparto",
          "Invitaciones y empleados",
        ]}
        description="Esto borra para siempre la empresa y todo lo asociado. No se puede deshacer."
        destructiveLabel="Eliminar"
        loading={deleteMutation.isPending}
        onCancel={() => setShowDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        title={`Eliminar ${name || "empresa"}`}
        visible={showDelete}
      />
    </View>
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
  coordsCard: {
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  coordsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  coordsValue: {
    ...typography.captionStrong,
    color: colors.success,
  },
  coordsEmpty: {
    ...typography.caption,
    color: colors.muted,
  },
  invitationCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    gap: spacing.xxxs,
    padding: spacing.md,
  },
  invitationStatus: {
    ...typography.captionStrong,
    color: colors.accent,
  },
  invitationMeta: {
    ...typography.caption,
    color: colors.inkSoft,
  },
  generatedCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.redBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  generatedHint: {
    ...typography.captionStrong,
    color: colors.brandRedDark,
  },
  generatedLink: {
    ...typography.caption,
    color: colors.ink,
  },
});
