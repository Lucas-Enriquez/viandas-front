import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Link2, Mail, UserRound } from "lucide-react-native";

import { useAuth } from "../../src/auth/AuthContext";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { Screen } from "../../src/components/Screen";
import { colors, spacing, typography } from "../../src/theme";

export default function AccountScreen() {
  const { session } = useAuth();
  const company = session?.context?.company;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Cuenta</Text>
        <Text style={styles.title}>{session?.user.name ?? "Empleado"}</Text>
        <Text style={styles.subtitle}>{company?.name ?? "Sin empresa asignada"}</Text>
      </View>

      <Card style={styles.card}>
        <View style={styles.row}>
          <UserRound color={colors.brandRed} size={22} strokeWidth={2.4} />
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Rol</Text>
            <Text style={styles.rowValue}>{session?.user.role}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Mail color={colors.brandRed} size={22} strokeWidth={2.4} />
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue}>{session?.user.email}</Text>
          </View>
        </View>
      </Card>

      <Button
        icon={Link2}
        onPress={() => router.push("/global-token")}
        title="Abrir menú global"
        variant="secondary"
      />
      <Button
        icon={Link2}
        onPress={() => router.push("/invitation")}
        title="Aceptar invitación"
        variant="ghost"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  eyebrow: {
    ...typography.captionStrong,
    color: colors.brandRed,
  },
  header: {
    gap: spacing.xs,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  rowLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  rowText: {
    flex: 1,
  },
  rowValue: {
    ...typography.bodyStrong,
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
