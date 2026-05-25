import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  Building2,
  Link2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Share2,
  X,
} from "lucide-react-native";

import { getApiErrorMessage } from "../../../src/api/client";
import { companiesApi } from "../../../src/api/companies";
import { Button } from "../../../src/components/Button";
import { Card } from "../../../src/components/Card";
import { Hero } from "../../../src/components/Hero";
import { Skeleton } from "../../../src/components/Skeleton";
import { EmptyState, ErrorState } from "../../../src/components/StateViews";
import { StatusPill } from "../../../src/components/StatusPill";
import { buildInvitationLink } from "../../../src/config";
import { useToast } from "../../../src/providers/ToastProvider";
import { mapResultStore } from "../../../src/stores/mapResult";
import { colors, radius, shadows, spacing, typography } from "../../../src/theme";
import type { Company, GlobalInvitationResponse } from "../../../src/types";

export default function CompaniesScreen() {
  const toast = useToast();
  const [inviteVisible, setInviteVisible] = useState(false);

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
        tone="ink"
        eyebrow="Empresas"
        title="Tus clientes"
        subtitle="Empresas que reciben los menús del día."
      />

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
        {/* Stats — neutros, fuera del header */}
        <View style={styles.statsRow}>
          <StatChip
            label={String(companies.length)}
            caption={companies.length === 1 ? "empresa" : "empresas"}
          />
          <StatChip label={String(withLocation)} caption="con ubicación" />
        </View>

        {/* Action grid */}
        <View style={styles.actionGrid}>
          <ActionTile
            icon={Plus}
            onPress={goCreate}
            subtitle="Nombre y dirección"
            title="Nueva empresa"
          />
          <ActionTile
            icon={Link2}
            onPress={() => setInviteVisible(true)}
            subtitle="Link para empleados"
            title="Crear invitación"
          />
        </View>

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

      <InviteModal
        companies={companies}
        onClose={() => setInviteVisible(false)}
        toast={toast}
        visible={inviteVisible}
      />
    </View>
  );
}

// ─── Stat chip ───────────────────────────────────────────────────────────────

function StatChip({ label, caption }: { label: string; caption: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statValue}>{label}</Text>
      <Text style={styles.statCaption}>{caption}</Text>
    </View>
  );
}

// ─── Action tile ─────────────────────────────────────────────────────────────

function ActionTile({
  icon: Icon,
  onPress,
  subtitle,
  title,
}: {
  icon: typeof Plus;
  onPress: () => void;
  subtitle: string;
  title: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionTile, pressed && styles.actionTilePressed]}
    >
      <View style={styles.actionTileIcon}>
        <Icon color={colors.brandRed} size={22} strokeWidth={1.8} />
      </View>
      <Text style={styles.actionTileTitle}>{title}</Text>
      <Text style={styles.actionTileSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

// ─── Company card ─────────────────────────────────────────────────────────────

function CompanyCard({ company }: { company: Company }) {
  const hasLocation =
    typeof company.latitude === "number" && typeof company.longitude === "number";

  return (
    <Card style={styles.card} variant="elevated">
      <View style={styles.cardIcon}>
        <Building2 color={colors.brandRed} size={22} strokeWidth={1.8} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{company.name}</Text>
        {!!company.address && (
          <View style={styles.addressRow}>
            <MapPin color={colors.muted} size={14} strokeWidth={1.8} />
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
        <Pencil color={colors.brandRed} size={18} strokeWidth={1.8} />
      </Pressable>
    </Card>
  );
}

// ─── Invite modal ─────────────────────────────────────────────────────────────

function InviteModal({
  companies,
  onClose,
  toast,
  visible,
}: {
  companies: Company[];
  onClose: () => void;
  toast: ReturnType<typeof useToast>;
  visible: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GlobalInvitationResponse | null>(null);

  const createMutation = useMutation({
    mutationFn: () => companiesApi.createGlobalInvitation(selectedId!, { maxUses: null }),
    onError: (error) => {
      toast.show({
        title: "No pudimos generar el link",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: (data) => setGenerated(data),
  });

  const handleClose = () => {
    setSelectedId(null);
    setGenerated(null);
    onClose();
  };

  const handleShare = async () => {
    if (!generated) return;
    try {
      await Share.share({ message: buildInvitationLink(generated.token) });
    } catch {
      // user cancelled or error
    }
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: "height" })}
        style={styles.modalBackdrop}
      >
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderIcon}>
              <Link2 color={colors.brandRed} size={20} strokeWidth={1.8} />
            </View>
            <Text style={styles.modalTitle}>
              {generated ? "Link generado" : "Link de invitación"}
            </Text>
            <Pressable hitSlop={10} onPress={handleClose} style={styles.modalClose}>
              <X color={colors.muted} size={20} strokeWidth={1.8} />
            </Pressable>
          </View>

          {generated ? (
            // ── Estado: link generado ──────────────────────────────────────
            <ScrollView
              contentContainerStyle={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.warningBanner}>
                <Text style={styles.warningText}>
                  Este link se muestra una sola vez. Guardalo antes de cerrar.
                </Text>
              </View>

              <View style={styles.linkBox}>
                <Text selectable style={styles.linkText}>
                  {buildInvitationLink(generated.token)}
                </Text>
              </View>

              <Text style={styles.linkMeta}>
                Empresa: {generated.company} · Vence:{" "}
                {new Date(generated.expiresAt).toLocaleDateString("es-AR")}
              </Text>

              <Button
                icon={Share2}
                onPress={handleShare}
                title="Compartir link"
              />
              <Button
                onPress={handleClose}
                title="Cerrar"
                variant="ghost"
              />
            </ScrollView>
          ) : (
            // ── Estado: elegir empresa ────────────────────────────────────
            <ScrollView
              contentContainerStyle={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalSubtitle}>
                Elegí la empresa para la que querés generar el link:
              </Text>

              <View style={styles.companyList}>
                {companies.map((company) => (
                  <Pressable
                    key={company.id}
                    onPress={() => setSelectedId(company.id)}
                    style={[
                      styles.companyChoice,
                      selectedId === company.id && styles.companyChoiceSelected,
                    ]}
                  >
                    <View style={styles.companyChoiceDot}>
                      {selectedId === company.id && (
                        <View style={styles.companyChoiceDotFill} />
                      )}
                    </View>
                    <View style={styles.companyChoiceText}>
                      <Text
                        style={[
                          styles.companyChoiceName,
                          selectedId === company.id && styles.companyChoiceNameSelected,
                        ]}
                      >
                        {company.name}
                      </Text>
                      {!!company.address && (
                        <Text numberOfLines={1} style={styles.companyChoiceMeta}>
                          {company.address}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>

              <Button
                disabled={!selectedId}
                icon={Link2}
                loading={createMutation.isPending}
                onPress={() => createMutation.mutate()}
                title="Generar link"
              />
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statValue: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  statCaption: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },

  // Action grid
  actionGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionTile: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  actionTilePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  actionTileIcon: {
    alignItems: "center",
    backgroundColor: colors.redSoft,
    borderRadius: radius.md,
    height: 40,
    justifyContent: "center",
    marginBottom: spacing.xs,
    width: 40,
  },
  actionTileTitle: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  actionTileSubtitle: {
    ...typography.caption,
    color: colors.muted,
  },

  // List
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

  // Company card
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

  // Invite modal
  modalBackdrop: {
    backgroundColor: "rgba(15, 17, 21, 0.55)",
    flex: 1,
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    maxHeight: "85%",
    ...shadows.lg,
  },
  modalHeader: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.lg,
  },
  modalHeaderIcon: {
    alignItems: "center",
    backgroundColor: colors.redSoft,
    borderRadius: radius.md,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.ink,
    flex: 1,
  },
  modalClose: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  modalBody: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.inkSoft,
  },

  // Company picker inside modal
  companyList: {
    gap: spacing.sm,
  },
  companyChoice: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  companyChoiceSelected: {
    backgroundColor: colors.redSoft,
    borderColor: colors.redBorder,
  },
  companyChoiceDot: {
    alignItems: "center",
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: 2,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  companyChoiceDotFill: {
    backgroundColor: colors.brandRed,
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  companyChoiceText: {
    flex: 1,
  },
  companyChoiceName: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  companyChoiceNameSelected: {
    color: colors.brandRed,
  },
  companyChoiceMeta: {
    ...typography.caption,
    color: colors.muted,
  },

  // Generated link state
  warningBanner: {
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  warningText: {
    ...typography.captionStrong,
    color: colors.warning,
  },
  linkBox: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  linkText: {
    ...typography.body,
    color: colors.ink,
  },
  linkMeta: {
    ...typography.caption,
    color: colors.muted,
  },
});
