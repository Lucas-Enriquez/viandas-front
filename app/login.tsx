import { useEffect, useState } from "react";
import {
  Alert,
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
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react-native";

import { getApiErrorMessage } from "../src/api/client";
import { useAuth } from "../src/auth/AuthContext";
import { BrandLogo } from "../src/components/BrandLogo";
import { Button } from "../src/components/Button";
import { Input } from "../src/components/Input";
import { API_URL } from "../src/config";
import { colors, spacing, typography } from "../src/theme";
import type { AuthSession } from "../src/types";

function homeForSession(session: AuthSession) {
  return session.user.role === "EMPLOYEE" ? "/employee-menu" : "/companies";
}

export default function LoginScreen() {
  const { isLoading, session, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(false);
    });

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
      Alert.alert("Faltan datos", "Ingresá email y contraseña para continuar.");
      return;
    }

    setIsSubmitting(true);
    try {
      const nextSession = await signIn(email.trim(), password);
      router.replace(homeForSession(nextSession));
    } catch (error) {
      Alert.alert("No pudimos iniciar sesión", getApiErrorMessage(error));
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
      <ScrollView
        contentContainerStyle={styles.screen}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.header, isKeyboardVisible && styles.headerKeyboard]}>
          <BrandLogo size={isKeyboardVisible ? "compact" : "large"} />
          {!isKeyboardVisible && (
            <>
              <Text style={styles.title}>App de reparto</Text>
              <Text style={styles.subtitle}>
                Entrá con tu cuenta para gestionar menús, pedidos y repartos.
              </Text>
            </>
          )}
        </View>

        <View style={styles.form}>
          <Input
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            label="Email"
            onChangeText={setEmail}
            placeholder="cook@caseritas.com"
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
                  <EyeOff color={colors.muted} size={21} strokeWidth={2.4} />
                ) : (
                  <Eye color={colors.muted} size={21} strokeWidth={2.4} />
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
  apiUrl: {
    ...typography.caption,
    color: colors.muted,
    textAlign: "center",
  },
  form: {
    gap: spacing.md,
  },
  header: {
    alignItems: "center",
    gap: spacing.sm,
  },
  headerKeyboard: {
    gap: spacing.xs,
  },
  eyeButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  screen: {
    flexGrow: 1,
    gap: spacing.xl,
    justifyContent: "flex-start",
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    maxWidth: 340,
    textAlign: "center",
  },
  title: {
    ...typography.h1,
    color: colors.ink,
    textAlign: "center",
  },
});
