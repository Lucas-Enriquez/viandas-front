import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Check, Link2, UserPlus } from "lucide-react-native";

import { getApiErrorMessage } from "../src/api/client";
import { invitationsApi } from "../src/api/invitations";
import { useAuth } from "../src/auth/AuthContext";
import { Button } from "../src/components/Button";
import { Card } from "../src/components/Card";
import { Hero } from "../src/components/Hero";
import { Input } from "../src/components/Input";
import { useToast } from "../src/providers/ToastProvider";
import { colors, radius, spacing, typography } from "../src/theme";

type InvitationKind = "individual" | "global";

export default function InvitationScreen() {
  const params = useLocalSearchParams<{ token?: string; kind?: InvitationKind }>();
  const fromLink = !!params.token;
  const { setAuthenticatedSession } = useAuth();
  const toast = useToast();
  const [kind, setKind] = useState<InvitationKind>(params.kind ?? "global");
  const [token, setToken] = useState(params.token ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [previewText, setPreviewText] = useState<string | null>(null);
  const autoValidated = useRef(false);

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!token.trim()) {
        throw new Error("Pegá el token de invitación.");
      }
      if (kind === "global") {
        const preview = await invitationsApi.previewGlobal(token.trim());
        return preview.company;
      }
      const preview = await invitationsApi.previewIndividual(token.trim());
      setEmail(preview.email);
      return `${preview.companyName} · ${preview.email}`;
    },
    onError: (error) => {
      toast.show({
        title: "No pudimos validar la invitación",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: setPreviewText,
  });

  // Si llegamos desde un deep link, validamos el token automáticamente al montar
  useEffect(() => {
    if (fromLink && !autoValidated.current) {
      autoValidated.current = true;
      previewMutation.mutate();
    }
  }, []);

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
      toast.show({
        title: "No pudimos aceptar la invitación",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: async (auth) => {
      const session = await setAuthenticatedSession(auth);
      toast.show({ title: "Cuenta creada", tone: "success" });
      router.replace(session.user.role === "EMPLOYEE" ? "/employee-menu" : "/menus");
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.root}
    >
      <Hero
        eyebrow="Invitación"
        onBack={() => router.back()}
        subtitle={fromLink ? "Completá tus datos para crear la cuenta." : "Pegá el token interno de invitación para validar y crear la cuenta."}
        title="Sumate al equipo"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!fromLink && (
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
        )}

        <Card style={styles.section}>
          {!fromLink && (
            <Input autoCapitalize="none" label="Token" onChangeText={setToken} value={token} />
          )}
          {!fromLink && (
            <Button
              icon={Link2}
              loading={previewMutation.isPending}
              onPress={() => previewMutation.mutate()}
              title="Validar invitación"
              variant="secondary"
            />
          )}
          {!!previewText && (
            <View style={styles.preview}>
              <Check color={colors.success} size={18} strokeWidth={2.4} />
              <Text style={styles.previewText}>{previewText}</Text>
            </View>
          )}
          {fromLink && previewMutation.isPending && (
            <Text style={styles.validating}>Validando invitación…</Text>
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
      </ScrollView>
    </KeyboardAvoidingView>
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
  preview: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
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
    borderRadius: radius.pill,
    flex: 1,
    justifyContent: "center",
    minHeight: 40,
  },
  segmentActive: {
    backgroundColor: colors.brandRed,
  },
  segmented: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
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
  validating: {
    ...typography.caption,
    color: colors.muted,
    textAlign: "center",
  },
});
