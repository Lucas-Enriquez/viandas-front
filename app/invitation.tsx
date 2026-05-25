import { useEffect, useRef, useState } from "react";
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
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useMutation } from "@tanstack/react-query";
import { Building2, Eye, EyeOff, TriangleAlert, UserPlus } from "lucide-react-native";

import { getApiErrorMessage } from "../src/api/client";
import { invitationsApi } from "../src/api/invitations";
import { useAuth } from "../src/auth/AuthContext";
import { Button } from "../src/components/Button";
import { Input } from "../src/components/Input";
import { useToast } from "../src/providers/ToastProvider";
import { colors, radius, shadows, spacing, typography } from "../src/theme";

const logoSource = require("../assets/logo.png");

type InvitationKind = "individual" | "global";

export default function InvitationScreen() {
  const params = useLocalSearchParams<{ token?: string; kind?: InvitationKind }>();
  const { setAuthenticatedSession } = useAuth();
  const toast = useToast();
  const token = params.token ?? "";
  const kind: InvitationKind = params.kind ?? "global";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const autoValidated = useRef(false);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setIsKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (kind === "global") {
        const preview = await invitationsApi.previewGlobal(token);
        return preview.company;
      }
      const preview = await invitationsApi.previewIndividual(token);
      setEmail(preview.email);
      return `${preview.companyName} · ${preview.email}`;
    },
    onSuccess: setPreviewText,
  });

  useEffect(() => {
    if (token && !autoValidated.current) {
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
        ? invitationsApi.acceptGlobal(token, body)
        : invitationsApi.acceptIndividual(token, body);
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
      toast.show({ title: "¡Bienvenido!", tone: "success" });
      router.replace(session.user.role === "EMPLOYEE" ? "/employee-menu" : "/menus");
    },
  });

  if (!token) {
    return <Redirect href="/login" />;
  }

  const previewError = previewMutation.isError;
  const previewLoading = previewMutation.isPending;
  const canSubmit =
    !!previewText && !!name.trim() && !!email.trim() && !!password && !acceptMutation.isPending;

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
                <Text style={styles.title}>Te están invitando</Text>
                <Text style={styles.subtitle}>
                  Creá tu cuenta para sumarte al equipo.
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
        {previewLoading ? (
          <View style={styles.previewSkeleton}>
            <View style={styles.previewIconSkeleton} />
            <View style={styles.previewCopySkeleton}>
              <View style={[styles.skelLine, { width: "40%" }]} />
              <View style={[styles.skelLine, { width: "70%" }]} />
            </View>
          </View>
        ) : previewError ? (
          <View style={styles.errorCard}>
            <View style={styles.errorIcon}>
              <TriangleAlert color={colors.brandRedDark} size={20} strokeWidth={2.4} />
            </View>
            <View style={styles.errorCopy}>
              <Text style={styles.errorTitle}>Invitación inválida o vencida</Text>
              <Text style={styles.errorMessage}>
                {getApiErrorMessage(previewMutation.error)}
              </Text>
            </View>
            <Button
              onPress={() => previewMutation.mutate()}
              size="small"
              title="Reintentar"
              variant="secondary"
            />
          </View>
        ) : previewText ? (
          <View style={styles.previewCard}>
            <View style={styles.previewIcon}>
              <Building2 color={colors.brandRed} size={22} strokeWidth={1.8} />
            </View>
            <View style={styles.previewCopy}>
              <Text style={styles.previewEyebrow}>Empresa</Text>
              <Text numberOfLines={2} style={styles.previewCompany}>
                {previewText}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.form}>
          <Input
            autoComplete="name"
            label="Nombre y apellido"
            onChangeText={setName}
            placeholder="Tu nombre"
            returnKeyType="next"
            textContentType="name"
            value={name}
          />
          <Input
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            label="Email"
            onChangeText={setEmail}
            placeholder="tu@email.com"
            returnKeyType="next"
            textContentType="emailAddress"
            value={email}
          />
          <Input
            autoComplete="password-new"
            label="Contraseña"
            onChangeText={setPassword}
            placeholder="Elegí una contraseña"
            returnKeyType="done"
            rightAccessory={
              <Pressable
                accessibilityLabel={
                  isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                hitSlop={10}
                onPress={() => setIsPasswordVisible((current) => !current)}
                style={styles.eyeButton}
              >
                {isPasswordVisible ? (
                  <EyeOff color={colors.muted} size={21} strokeWidth={1.8} />
                ) : (
                  <Eye color={colors.muted} size={21} strokeWidth={1.8} />
                )}
              </Pressable>
            }
            secureTextEntry={!isPasswordVisible}
            textContentType="newPassword"
            value={password}
          />
          <Button
            disabled={!canSubmit}
            icon={UserPlus}
            loading={acceptMutation.isPending}
            onPress={() => acceptMutation.mutate()}
            title="Crear cuenta y entrar"
          />
        </View>

        <Pressable
          hitSlop={8}
          onPress={() => router.replace("/login")}
          style={({ pressed }) => [styles.loginLink, pressed && { opacity: 0.55 }]}
        >
          <Text style={styles.loginLinkText}>¿Ya tenés cuenta? Iniciá sesión</Text>
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
  previewCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.redBorder,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  previewIcon: {
    alignItems: "center",
    backgroundColor: colors.redSoft,
    borderRadius: radius.md,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  previewCopy: {
    flex: 1,
    gap: 2,
  },
  previewEyebrow: {
    ...typography.captionStrong,
    color: colors.brandRed,
    textTransform: "uppercase",
  },
  previewCompany: {
    ...typography.h2,
    color: colors.ink,
  },
  previewSkeleton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  previewIconSkeleton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 48,
    width: 48,
  },
  previewCopySkeleton: {
    flex: 1,
    gap: spacing.xs,
  },
  skelLine: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    height: 12,
  },
  errorCard: {
    alignItems: "flex-start",
    backgroundColor: colors.redSofter,
    borderColor: colors.redBorder,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    padding: spacing.md,
  },
  errorIcon: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  errorCopy: {
    flex: 1,
    gap: 2,
    minWidth: 180,
  },
  errorTitle: {
    ...typography.bodyStrong,
    color: colors.brandRedDark,
  },
  errorMessage: {
    ...typography.caption,
    color: colors.inkSoft,
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
    ...typography.captionStrong,
    color: colors.brandRed,
  },
});
