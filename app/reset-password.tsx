import { useEffect, useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Eye, EyeOff, KeyRound } from "lucide-react-native";

import { authApi } from "../src/api/auth";
import { getApiErrorMessage } from "../src/api/client";
import { Button } from "../src/components/Button";
import { Input } from "../src/components/Input";
import { useToast } from "../src/providers/ToastProvider";
import { colors, radius, shadows, spacing } from "../src/theme";

const logoSource = require("../assets/logo.png");

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setIsKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const mutation = useMutation({
    mutationFn: () => authApi.resetPassword((token ?? "").trim(), password),
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

  if (!token) {
    return <Redirect href="/forgot-password" />;
  }

  const handleSubmit = () => {
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

  const canSubmit = password.length >= 8 && password === confirm && !mutation.isPending;

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: "height" })}
      keyboardVerticalOffset={Platform.select({ ios: 8, android: 0 })}
      style={styles.root}
    >
      <StatusBar style="dark" />
      <View style={styles.heroBg}>
        <SafeAreaView edges={["top"]}>
          <View style={[styles.heroContent, isKeyboardVisible && styles.heroContentCompact]}>
            <Image
              accessibilityLabel="Viandas"
              resizeMode="contain"
              source={logoSource}
              style={isKeyboardVisible ? styles.logoCompact : styles.logo}
            />
            {!isKeyboardVisible && (
              <>
                <Text style={styles.title}>Nueva contraseña</Text>
                <Text style={styles.subtitle}>
                  Elegí una contraseña para tu cuenta.
                </Text>
              </>
            )}
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          <Input
            autoComplete="password-new"
            label="Nueva contraseña"
            onChangeText={setPassword}
            placeholder="Mínimo 8 caracteres"
            returnKeyType="next"
            rightAccessory={
              <Pressable
                accessibilityLabel={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                hitSlop={10}
                onPress={() => setShowPassword((s) => !s)}
                style={styles.eyeButton}
              >
                {showPassword ? (
                  <EyeOff color={colors.muted} size={21} strokeWidth={1.8} />
                ) : (
                  <Eye color={colors.muted} size={21} strokeWidth={1.8} />
                )}
              </Pressable>
            }
            secureTextEntry={!showPassword}
            textContentType="newPassword"
            value={password}
          />
          <Input
            autoComplete="password-new"
            label="Confirmar contraseña"
            onChangeText={setConfirm}
            placeholder="Repetí la contraseña"
            returnKeyType="done"
            secureTextEntry={!showPassword}
            textContentType="newPassword"
            value={confirm}
          />
          <Button
            disabled={!canSubmit}
            icon={KeyRound}
            loading={mutation.isPending}
            onPress={handleSubmit}
            title="Cambiar contraseña"
          />
        </View>

        <Pressable
          hitSlop={8}
          onPress={() => router.replace("/login")}
          style={({ pressed }) => [styles.loginLink, pressed && { opacity: 0.55 }]}
        >
          <Text style={styles.loginLinkText}>Volver al inicio de sesión</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  heroBg: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    overflow: "hidden",
    ...shadows.md,
  },
  heroContent: {
    alignItems: "center",
    gap: spacing.sm,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  heroContentCompact: {
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  logo: {
    height: 96,
    width: 96,
  },
  logoCompact: {
    height: 48,
    width: 48,
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 32,
    textAlign: "center",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
    maxWidth: 320,
    textAlign: "center",
  },
  scrollContent: {
    flexGrow: 1,
    gap: spacing.lg,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.md,
  },
  eyeButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  loginLink: {
    alignSelf: "center",
    paddingVertical: spacing.xs,
  },
  loginLinkText: {
    color: colors.brandRed,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
    lineHeight: 18,
  },
});
