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
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react-native";

import { useAuth } from "../src/auth/AuthContext";
import { Button } from "../src/components/Button";
import { Input } from "../src/components/Input";
import { useToast } from "../src/providers/ToastProvider";
import { getApiErrorMessage } from "../src/api/client";
import { API_URL } from "../src/config";
import { colors, radius, shadows, spacing, typography } from "../src/theme";
import type { AuthSession } from "../src/types";

const logoSource = require("../assets/logo.png");

function homeForSession(session: AuthSession) {
  return session.user.role === "EMPLOYEE" ? "/employee-menu" : "/menus";
}

export default function LoginScreen() {
  const { isLoading, session, signIn } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () =>
      setIsKeyboardVisible(true),
    );
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () =>
      setIsKeyboardVisible(false),
    );
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (session) {
      router.replace(homeForSession(session));
    }
  }, [session]);

  if (!isLoading && session) {
    return <Redirect href={homeForSession(session)} />;
  }

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      toast.show({
        title: "Faltan datos",
        message: "Ingresá email y contraseña.",
        tone: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const nextSession = await signIn(email.trim(), password);
      router.replace(homeForSession(nextSession));
    } catch (error) {
      toast.show({
        title: "No pudimos iniciar sesión",
        message: getApiErrorMessage(error),
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              accessibilityLabel="Caseritas"
              resizeMode="contain"
              source={logoSource}
              style={isKeyboardVisible ? styles.logoCompact : styles.logo}
            />
            {!isKeyboardVisible && (
              <>
                <Text style={styles.title}>Bienvenido a Caseritas</Text>
                <Text style={styles.subtitle}>
                  Iniciá sesión para gestionar el día.
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
      >
        <View style={styles.form}>
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
            label="Contraseña"
            onChangeText={setPassword}
            placeholder="Tu contraseña"
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
            returnKeyType="done"
            secureTextEntry={!isPasswordVisible}
            textContentType="password"
            value={password}
          />
          <Button
            icon={LogIn}
            loading={isSubmitting}
            onPress={handleLogin}
            title="Ingresar"
          />
          <Pressable
            hitSlop={8}
            onPress={() => router.push("/forgot-password")}
            style={({ pressed }) => [styles.forgotLink, pressed && { opacity: 0.55 }]}
          >
            <Text style={styles.forgotLinkText}>¿Olvidaste tu contraseña?</Text>
          </Pressable>
          <Button
            icon={UserPlus}
            onPress={() => router.push("/invitation")}
            title="Aceptar invitación"
            variant="ghost"
          />
        </View>
        <Text style={styles.apiUrl}>Backend: {API_URL}</Text>
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
  apiUrl: {
    ...typography.caption,
    color: colors.muted,
    textAlign: "center",
  },
  forgotLink: {
    alignSelf: "center",
    paddingVertical: spacing.xs,
  },
  forgotLinkText: {
    ...typography.captionStrong,
    color: colors.brandRed,
  },
});
