import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { CheckCircle2, MapPin, RefreshCw, Signal, Truck } from "lucide-react-native";

import { getApiErrorMessage } from "../../src/api/client";
import { deliveryApi } from "../../src/api/delivery";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { EmptyState, LoadingState } from "../../src/components/StateViews";
import { Screen } from "../../src/components/Screen";
import { StatusPill } from "../../src/components/StatusPill";
import { isDeliveryTrackingActive, stopDeliveryTracking } from "../../src/services/locationTask";
import { getActiveDelivery } from "../../src/storage";
import { colors, spacing, typography } from "../../src/theme";
import type { ActiveDeliverySession, DeliveryPublicSignal } from "../../src/types";
import { formatRelativeDateTime } from "../../src/utils/date";

export default function DeliveryScreen() {
  const [activeDelivery, setActiveDelivery] = useState<ActiveDeliverySession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);

  const loadState = async () => {
    setIsLoading(true);
    const [delivery, tracking] = await Promise.all([
      getActiveDelivery(),
      isDeliveryTrackingActive(),
    ]);
    setActiveDelivery(delivery);
    setIsTracking(tracking);
    setIsLoading(false);
  };

  useEffect(() => {
    loadState();
  }, []);

  const finishMutation = useMutation({
    mutationFn: async () => {
      if (!activeDelivery) {
        throw new Error("No hay reparto activo.");
      }
      const finished = await deliveryApi.finish(activeDelivery.session.id);
      await stopDeliveryTracking();
      return finished;
    },
    onError: (error) => {
      Alert.alert("No pudimos finalizar el reparto", getApiErrorMessage(error));
    },
    onSuccess: () => {
      Alert.alert("Reparto finalizado", "Marcamos el delivery como entregado.");
      router.replace("/orders");
    },
  });

  if (isLoading) {
    return <LoadingState label="Leyendo reparto activo..." />;
  }

  if (!activeDelivery) {
    return (
      <EmptyState
        actionLabel="Ver pedidos"
        icon={Truck}
        message="Iniciá un reparto desde la pantalla de pedidos."
        onAction={() => router.replace("/orders")}
        title="No hay reparto activo"
      />
    );
  }

  const { session } = activeDelivery;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Reparto activo</Text>
        <Text style={styles.title}>Sesión {session.id.slice(0, 8)}</Text>
        <Text style={styles.subtitle}>
          Menú {session.menuId.slice(0, 8)} · Empresa {session.companyId.slice(0, 8)}
        </Text>
      </View>

      <Card style={styles.signalCard}>
        <View style={styles.signalIcon}>
          <Signal color={colors.brandRed} size={32} strokeWidth={2.5} />
        </View>
        <Text style={styles.signalLabel}>{getSignalLabel(session.publicSignal)}</Text>
        <Text style={styles.signalHelp}>{getSignalHelp(session.publicSignal)}</Text>
        <StatusPill
          label={session.status === "ACTIVE" ? "Activo" : session.status}
          tone={session.status === "ACTIVE" ? "success" : "neutral"}
        />
      </Card>

      <View style={styles.detailGrid}>
        <Card style={styles.detailCard}>
          <MapPin color={colors.success} size={22} strokeWidth={2.4} />
          <Text style={styles.detailTitle}>Tracking</Text>
          <Text style={styles.detailValue}>{isTracking ? "En segundo plano" : "Detenido"}</Text>
        </Card>
        <Card style={styles.detailCard}>
          <RefreshCw color={colors.brandRed} size={22} strokeWidth={2.4} />
          <Text style={styles.detailTitle}>Último envío</Text>
          <Text style={styles.detailValue}>
            {session.lastLocationAt ? formatRelativeDateTime(session.lastLocationAt) : "Sin enviar"}
          </Text>
        </Card>
      </View>

      <Card style={styles.timeline}>
        <Text style={styles.timelineTitle}>Detalle</Text>
        <Row label="Inicio" value={formatRelativeDateTime(session.startedAt)} />
        <Row label="Expira" value={formatRelativeDateTime(session.expiresAt)} />
      </Card>

      <View style={styles.actions}>
        <Button
          icon={RefreshCw}
          onPress={loadState}
          title="Actualizar estado"
          variant="secondary"
        />
        <Button
          icon={CheckCircle2}
          loading={finishMutation.isPending}
          onPress={() => finishMutation.mutate()}
          title="Finalizar reparto"
        />
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function getSignalLabel(signal: DeliveryPublicSignal) {
  switch (signal) {
    case "OUT_FOR_DELIVERY":
      return "Salió a repartir";
    case "NEARBY":
      return "Está cerca";
    case "DELIVERED":
      return "Entregado";
    case "UNKNOWN":
      return "Ubicación sin referencia";
    default:
      return "Estado desconocido";
  }
}

function getSignalHelp(signal: DeliveryPublicSignal) {
  switch (signal) {
    case "OUT_FOR_DELIVERY":
      return "Seguimos enviando ubicación mientras el reparto esté activo.";
    case "NEARBY":
      return "La empresa ya debería ver que el pedido está cerca.";
    case "DELIVERED":
      return "El reparto ya fue marcado como entregado.";
    case "UNKNOWN":
      return "La empresa no tiene latitud y longitud cargadas.";
    default:
      return "No pudimos interpretar la señal pública.";
  }
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  detailCard: {
    flex: 1,
    gap: spacing.xs,
    minHeight: 120,
  },
  detailGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  detailTitle: {
    ...typography.captionStrong,
    color: colors.muted,
  },
  detailValue: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  eyebrow: {
    ...typography.captionStrong,
    color: colors.brandRed,
  },
  header: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  rowLabel: {
    ...typography.body,
    color: colors.muted,
  },
  rowValue: {
    ...typography.bodyStrong,
    color: colors.ink,
    flex: 1,
    textAlign: "right",
  },
  signalCard: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  signalHelp: {
    ...typography.body,
    color: colors.muted,
    maxWidth: 300,
    textAlign: "center",
  },
  signalIcon: {
    alignItems: "center",
    backgroundColor: colors.yellowSoft,
    borderRadius: 8,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  signalLabel: {
    ...typography.h1,
    color: colors.ink,
    textAlign: "center",
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
  },
  timeline: {
    gap: spacing.sm,
  },
  timelineTitle: {
    ...typography.h2,
    color: colors.ink,
  },
  title: {
    ...typography.h1,
    color: colors.ink,
  },
});
