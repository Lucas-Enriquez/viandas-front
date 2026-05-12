import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Building2, Link2, LogOut, Mail, UserRound } from "lucide-react-native";

import { useAuth } from "../../src/auth/AuthContext";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { Hero } from "../../src/components/Hero";
import { colors, radius, spacing, typography } from "../../src/theme";
import { formatRole } from "../../src/utils/format";

export default function AccountScreen() {
  const { session, signOut } = useAuth();
  const company = session?.context?.company;

  const initials = (session?.user.name ?? "Empleado")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <View style={styles.root}>
      <Hero
        eyebrow="Cuenta"
        rightAccessory={
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || "?"}</Text>
          </View>
        }
        subtitle={company?.name ?? "Sin empresa asignada"}
        title={session?.user.name ?? "Empleado"}
        tone="ink"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <InfoRow icon={UserRound} label="Rol" value={formatRole(session?.user.role)} />
          <InfoRow icon={Mail} label="Email" value={session?.user.email ?? "—"} />
          <InfoRow icon={Building2} label="Empresa" value={company?.name ?? "—"} />
        </Card>

        <Button
          icon={Link2}
          onPress={() => router.push("/invitation")}
          title="Aceptar invitación"
          variant="ghost"
        />
        <Button icon={LogOut} onPress={signOut} title="Cerrar sesión" variant="secondary" />
      </ScrollView>
    </View>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Icon color={colors.brandRed} size={20} strokeWidth={2.4} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
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
  avatar: {
    alignItems: "center",
    backgroundColor: colors.brandRed,
    borderRadius: 999,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  avatarText: {
    color: colors.onBrand,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  card: {
    gap: spacing.md,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  rowIcon: {
    alignItems: "center",
    backgroundColor: colors.redSoft,
    borderRadius: radius.md,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  rowValue: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
});
