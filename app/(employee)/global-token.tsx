import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Link2 } from "lucide-react-native";

import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { DateTimeField } from "../../src/components/DateTimeField";
import { Hero } from "../../src/components/Hero";
import { Input } from "../../src/components/Input";
import { useToast } from "../../src/providers/ToastProvider";
import { setStoredGlobalMenuLink } from "../../src/storage";
import { colors, spacing } from "../../src/theme";
import { todayYmd, ymdToDate } from "../../src/utils/date";

export default function GlobalTokenScreen() {
  const [date, setDate] = useState(() => ymdToDate(todayYmd()));
  const [token, setToken] = useState("");
  const toast = useToast();

  const saveLink = async () => {
    if (!token.trim()) {
      toast.show({
        title: "Falta token",
        message: "Pegá el token del link global.",
        tone: "error",
      });
      return;
    }

    await setStoredGlobalMenuLink({ date: todayYmd(date), token: token.trim() });
    router.replace("/employee-menu");
  };

  return (
    <View style={styles.root}>
      <Hero
        compact
        eyebrow="Menú global"
        onBack={() => router.back()}
        subtitle="Pegá la fecha y el token `t` del link global para probar el flujo sin deep links."
        title="Abrir link interno"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
      </ScrollView>
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
  section: {
    gap: spacing.md,
  },
});
