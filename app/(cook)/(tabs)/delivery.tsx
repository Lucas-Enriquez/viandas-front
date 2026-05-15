import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { CheckCircle2, MapPin, RefreshCw, Signal, Truck } from "lucide-react-native";

import { getApiErrorMessage } from "../../../src/api/client";
import { deliveryApi } from "../../../src/api/delivery";
import { Button } from "../../../src/components/Button";
import { Card } from "../../../src/components/Card";
import { Hero } from "../../../src/components/Hero";
import { Skeleton } from "../../../src/components/Skeleton";
import { StatusPill } from "../../../src/components/StatusPill";
import { isDeliveryTrackingActive, stopDeliveryTracking } from "../../../src/services/locationTask";
import { useToast } from "../../../src/providers/ToastProvider";
import { getActiveDelivery } from "../../../src/storage";
import { colors, radius, shadows, spacing, typography } from "../../../src/theme";
import type { ActiveDeliverySession, DeliveryPublicSignal } from "../../../src/types";
import { formatRelativeDateTime } from "../../../src/utils/date";

export default function DeliveryScreen() {
  const [activeDelivery, setActiveDelivery] = useState<ActiveDeliverySession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const toast = useToast();

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
      toast.show({
        title: "No pudimos finalizar el reparto",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: () => {
      toast.show({
        title: "Reparto finalizado",
        message: "Marcamos el delivery como entregado.",
        tone: "success",
      });
      router.replace("/orders");
    },
  });

  const session = activeDelivery?.session;
  const heroEyebrow = "Reparto";
  const heroTitle = session ? "Reparto en curso" : "Sin sesión activa";
  const heroSubtitle = session
    ? `Sesión ${session.id.slice(0, 8)} · Empresa ${session.companyId.slice(0, 8)}`
    : "Iniciá un reparto desde la pantalla de pedidos.";

  return (
    <View style={styles.root}>
      <Hero tone="ink" eyebrow={heroEyebrow} title={heroTitle} subtitle={heroSubtitle}>
        {session && (
          <View style={styles.statsRow}>
            <StatChip
              label={isTracking ? "ON" : "OFF"}
              caption="GPS"
            />
            <StatChip
              label={session.publicSignal === "NEARBY" ? "Cerca" : session.publicSignal === "DELIVERED" ? "Entregado" : "En ruta"}
              caption="estado"
            />
          </View>
        )}
      </Hero>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.skeletonGroup}>
            <Skeleton.Card height={180} />
            <Skeleton.Card height={120} />
            <Skeleton.Card height={100} />
          </View>
        ) : !activeDelivery ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Truck color={colors.brandRed} size={32} strokeWidth={1.8} />
            </View>
            <Text style={styles.emptyTitle}>No hay reparto activo</Text>
            <Text style={styles.emptyMessage}>
              Cuando inicies un reparto desde Pedidos, lo vas a controlar acá.
            </Text>
            <Button
              icon={Truck}
              onPress={() => router.replace("/orders")}
              title="Ver pedidos"
              variant="secondary"
            />
          </Card>
        ) : (
          <>
            <Card style={styles.signalCard}>
              <View style={styles.signalIcon}>
                <Signal color={colors.brandRed} size={28} strokeWidth={1.8} />
              </View>
              <Text style={styles.signalLabel}>{getSignalLabel(session!.publicSignal)}</Text>
              <Text style={styles.signalHelp}>{getSignalHelp(session!.publicSignal)}</Text>
              <StatusPill
                label={session!.status === "ACTIVE" ? "Activo" : session!.status}
                tone={session!.status === "ACTIVE" ? "success" : "neutral"}
              />
            </Card>

            <View style={styles.detailGrid}>
              <Card style={styles.detailCard}>
                <MapPin color={colors.success} size={22} strokeWidth={1.8} />
                <Text style={styles.detailTitle}>Tracking</Text>
                <Text style={styles.detailValue}>{isTracking ? "En segundo plano" : "Detenido"}</Text>
              </Card>
              <Card style={styles.detailCard}>
                <RefreshCw color={colors.brandRed} size={22} strokeWidth={1.8} />
                <Text style={styles.detailTitle}>Último envío</Text>
                <Text style={styles.detailValue}>
                  {session!.lastLocationAt ? formatRelativeDateTime(session!.lastLocationAt) : "Sin enviar"}
                </Text>
              </Card>
            </View>

            <Card style={styles.timeline}>
              <Text style={styles.timelineTitle}>Detalle</Text>
              <Row label="Inicio" value={formatRelativeDateTime(session!.startedAt)} />
              <Row label="Expira" value={formatRelativeDateTime(session!.expiresAt)} />
              <Row label="Menú" value={session!.menuId.slice(0, 8)} />
            </Card>

            <View style={styles.actions}>
              <Button
                icon={RefreshCw}
                onPress={loadState}
                title="Actualizar"
                variant="secondary"
              />
              <Button
                icon={CheckCircle2}
                loading={finishMutation.isPending}
                onPress={() => finishMutation.mutate()}
                title="Finalizar reparto"
              />
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
  skeletonGroup: {
    gap: spacing.md,
  },
  emptyCard: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: colors.redSoft,
    borderRadius: radius.lg,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.ink,
    textAlign: "center",
  },
  emptyMessage: {
    ...typography.body,
    color: colors.muted,
    maxWidth: 300,
    textAlign: "center",
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  detailCard: {
    flex: 1,
    gap: spacing.xs,
    minHeight: 110,
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
    ...shadows.sm,
  },
  signalHelp: {
    ...typography.body,
    color: colors.muted,
    maxWidth: 300,
    textAlign: "center",
  },
  signalIcon: {
    alignItems: "center",
    backgroundColor: colors.redSoft,
    borderRadius: radius.lg,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  signalLabel: {
    ...typography.h2,
    color: colors.ink,
    textAlign: "center",
  },
  timeline: {
    gap: spacing.sm,
  },
  timelineTitle: {
    ...typography.h2,
    color: colors.ink,
  },
});
