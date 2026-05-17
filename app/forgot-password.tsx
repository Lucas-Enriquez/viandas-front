import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { Send } from "lucide-react-native";

import { authApi } from "../src/api/auth";
import { getApiErrorMessage } from "../src/api/client";
import { Button } from "../src/components/Button";
import { Hero } from "../src/components/Hero";
import { Input } from "../src/components/Input";
import { useToast } from "../src/providers/ToastProvider";
import { colors, radius, shadows, spacing } from "../src/theme";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: (value: string) => authApi.forgotPassword(value),
    onError: (error) => {
      toast.show({
        title: "No pudimos procesar la solicitud",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: () => {
      toast.show({
        title: "Revisá tu correo",
        message: "Si el email existe, te llegó un mail con instrucciones.",
        tone: "success",
      });
      router.back();
    },
  });

  const handleSubmit = () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      toast.show({
        title: "Email inválido",
        message: "Ingresá un email válido.",
        tone: "error",
      });
      return;
    }
    mutation.mutate(trimmed);
  };

  return (
    <View style={styles.root}>
      <Hero
        eyebrow="Recuperar acceso"
        onBack={() => router.back()}
        subtitle="Te mandamos un mail con instrucciones para crear una contraseña nueva."
        title="¿Olvidaste tu contraseña?"
        tone="surface"
      />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding" })}
        style={styles.body}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <Input
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              label="Email"
              onChangeText={setEmail}
              placeholder="tu@email.com"
              returnKeyType="send"
              textContentType="emailAddress"
              value={email}
            />
            <Button
              icon={Send}
              loading={mutation.isPending}
              onPress={handleSubmit}
              title="Enviar instrucciones"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.sm,
  },
  root: { backgroundColor: colors.background, flex: 1 },
  scrollContent: { gap: spacing.md, padding: spacing.lg },
});
