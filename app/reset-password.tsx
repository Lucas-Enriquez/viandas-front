import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Eye, EyeOff, KeyRound } from "lucide-react-native";

import { authApi } from "../src/api/auth";
import { getApiErrorMessage } from "../src/api/client";
import { Button } from "../src/components/Button";
import { Hero } from "../src/components/Hero";
import { Input } from "../src/components/Input";
import { useToast } from "../src/providers/ToastProvider";
import { colors, radius, shadows, spacing } from "../src/theme";

export default function ResetPasswordScreen() {
  const { token: initialToken } = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(initialToken ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
    }
  }, [initialToken]);

  const mutation = useMutation({
    mutationFn: () => authApi.resetPassword(token.trim(), password),
    onError: (error) => {
      toast.show({
        title: "No pudimos cambiar la contraseña",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    },
    onSuccess: () => {
      toast.show({
        title: "Contraseña actualizada",
        message: "Ya podés iniciar sesión.",
        tone: "success",
      });
      router.replace("/login");
    },
  });

  const handleSubmit = () => {
    if (!token.trim()) {
      toast.show({
        title: "Falta el token",
        message: "Pegá el token que vino en el mail.",
        tone: "error",
      });
      return;
    }
    if (password.length < 8) {
      toast.show({
        title: "Contraseña corta",
        message: "Tiene que tener al menos 8 caracteres.",
        tone: "error",
      });
      return;
    }
    if (password !== confirm) {
      toast.show({
        title: "No coinciden",
        message: "Las contraseñas son distintas.",
        tone: "error",
      });
      return;
    }
    mutation.mutate();
  };

  return (
    <View style={styles.root}>
      <Hero
        eyebrow="Recuperar acceso"
        onBack={() => router.back()}
        subtitle="Pegá el token del mail y elegí una nueva contraseña."
        title="Nueva contraseña"
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
              autoCorrect={false}
              label="Token del mail"
              onChangeText={setToken}
              placeholder="Pegá el código…"
              value={token}
            />
            <Input
              label="Nueva contraseña"
              onChangeText={setPassword}
              placeholder="Mínimo 8 caracteres"
              rightAccessory={
                <Pressable
                  accessibilityLabel={showPassword ? "Ocultar" : "Mostrar"}
                  hitSlop={10}
                  onPress={() => setShowPassword((s) => !s)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff color={colors.muted} size={20} strokeWidth={1.8} />
                  ) : (
                    <Eye color={colors.muted} size={20} strokeWidth={1.8} />
                  )}
                </Pressable>
              }
              secureTextEntry={!showPassword}
              textContentType="newPassword"
              value={password}
            />
            <Input
              label="Confirmar contraseña"
              onChangeText={setConfirm}
              placeholder="Repetí la contraseña"
              secureTextEntry={!showPassword}
              textContentType="newPassword"
              value={confirm}
            />
            <Button
              icon={KeyRound}
              loading={mutation.isPending}
              onPress={handleSubmit}
              title="Cambiar contraseña"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  eyeButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
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
