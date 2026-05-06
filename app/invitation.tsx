import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Check, Link2, UserPlus } from "lucide-react-native";

import { getApiErrorMessage } from "../src/api/client";
import { invitationsApi } from "../src/api/invitations";
import { useAuth } from "../src/auth/AuthContext";
import { Button } from "../src/components/Button";
import { Card } from "../src/components/Card";
import { Input } from "../src/components/Input";
import { Screen } from "../src/components/Screen";
import { colors, spacing, typography } from "../src/theme";

type InvitationKind = "individual" | "global";

export default function InvitationScreen() {
  const { setAuthenticatedSession } = useAuth();
  const [kind, setKind] = useState<InvitationKind>("global");
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [previewText, setPreviewText] = useState<string | null>(null);

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!token.trim()) {
        throw new Error("Pegá el token de invitación.");
      }
      if (kind === "global") {
        const preview = await invitationsApi.previewGlobal(token.trim());
        return `${preview.company} · usos ${preview.usedCount}/${preview.maxUses ?? "sin límite"}`;
      }
      const preview = await invitationsApi.previewIndividual(token.trim());
      setEmail(preview.email);
      return `${preview.companyName} · ${preview.email}`;
    },
    onError: (error) => {
      Alert.alert("No pudimos validar la invitación", getApiErrorMessage(error));
    },
    onSuccess: setPreviewText,
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim() || !email.trim() || !password) {
        throw new Error("Completá nombre, email y contraseña.");
      }
      const body = { email: email.trim(), name: name.trim(), password };
      return kind === "global"
        ? invitationsApi.acceptGlobal(token.trim(), body)
        : invitationsApi.acceptIndividual(token.trim(), body);
    },
    onError: (error) => {
      Alert.alert("No pudimos aceptar la invitación", getApiErrorMessage(error));
    },
    onSuccess: async (auth) => {
      const session = await setAuthenticatedSession(auth);
      router.replace(session.user.role === "EMPLOYEE" ? "/employee-menu" : "/companies");
    },
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Invitación</Text>
        <Text style={styles.title}>Registrarse como empleado</Text>
        <Text style={styles.subtitle}>
          Pegá el token interno de invitación para validar y crear la cuenta.
        </Text>
      </View>

      <View style={styles.segmented}>
        {(["global", "individual"] as InvitationKind[]).map((option) => (
          <Pressable
            key={option}
            onPress={() => setKind(option)}
            style={[styles.segment, kind === option && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, kind === option && styles.segmentTextActive]}>
              {option === "global" ? "Global" : "Individual"}
            </Text>
          </Pressable>
        ))}
      </View>

      <Card style={styles.section}>
        <Input autoCapitalize="none" label="Token" onChangeText={setToken} value={token} />
        <Button
          icon={Link2}
          loading={previewMutation.isPending}
          onPress={() => previewMutation.mutate()}
          title="Validar invitación"
          variant="secondary"
        />
        {!!previewText && (
          <View style={styles.preview}>
            <Check color={colors.success} size={18} strokeWidth={2.4} />
            <Text style={styles.previewText}>{previewText}</Text>
          </View>
        )}
      </Card>

      <Card style={styles.section}>
        <Input label="Nombre" onChangeText={setName} value={name} />
        <Input
          autoCapitalize="none"
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmail}
          value={email}
        />
        <Input
          label="Contraseña"
          onChangeText={setPassword}
          secureTextEntry
          value={password}
        />
      </Card>

      <Button
        icon={UserPlus}
        loading={acceptMutation.isPending}
        onPress={() => acceptMutation.mutate()}
        title="Aceptar y entrar"
      />
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
  preview: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderRadius: 8,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  previewText: {
    ...typography.bodyStrong,
    color: colors.success,
    flex: 1,
  },
  section: {
    gap: spacing.md,
  },
  segment: {
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
  },
  segmentActive: {
    backgroundColor: colors.brandRed,
  },
  segmented: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
  },
  segmentText: {
    ...typography.captionStrong,
    color: colors.muted,
  },
  segmentTextActive: {
    color: colors.onBrand,
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
