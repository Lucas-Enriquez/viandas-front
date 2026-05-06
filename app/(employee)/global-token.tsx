import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Link2 } from "lucide-react-native";

import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { DateTimeField } from "../../src/components/DateTimeField";
import { Input } from "../../src/components/Input";
import { Screen } from "../../src/components/Screen";
import { setStoredGlobalMenuLink } from "../../src/storage";
import { colors, spacing, typography } from "../../src/theme";
import { todayYmd, ymdToDate } from "../../src/utils/date";

export default function GlobalTokenScreen() {
  const [date, setDate] = useState(() => ymdToDate(todayYmd()));
  const [token, setToken] = useState("");

  const saveLink = async () => {
    if (!token.trim()) {
      Alert.alert("Falta token", "Pegá el token del link global.");
      return;
    }

    await setStoredGlobalMenuLink({ date: todayYmd(date), token: token.trim() });
    router.replace("/employee-menu");
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Menú global</Text>
        <Text style={styles.title}>Abrir link interno</Text>
        <Text style={styles.subtitle}>
          Pegá la fecha y el token `t` del link global para probar el flujo sin deep links.
        </Text>
      </View>

      <Card style={styles.section}>
        <DateTimeField label="Fecha del menú" mode="date" onChange={setDate} value={date} />
        <Input
          autoCapitalize="none"
          label="Token"
          multiline
          onChangeText={setToken}
          placeholder="t=..."
          value={token}
        />
      </Card>

      <Button icon={Link2} onPress={saveLink} title="Abrir menú" />
    </Screen>
  );
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
  subtitle: {
    ...typography.body,
    color: colors.muted,
  },
  title: {
    ...typography.h1,
    color: colors.ink,
  },
});
