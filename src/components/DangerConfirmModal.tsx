import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AlertTriangle, X } from "lucide-react-native";

import { Button } from "./Button";
import { colors, radius, shadows, spacing, typography } from "../theme";

type DangerConfirmModalProps = {
  visible: boolean;
  title: string;
  description: string;
  bullets?: string[];
  confirmWord?: string;
  destructiveLabel: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DangerConfirmModal({
  visible,
  title,
  description,
  bullets,
  confirmWord = "eliminar",
  destructiveLabel,
  loading = false,
  onCancel,
  onConfirm,
}: DangerConfirmModalProps) {
  const [typed, setTyped] = useState("");
  const matches = typed.trim().toLowerCase() === confirmWord.toLowerCase();

  useEffect(() => {
    if (!visible) {
      setTyped("");
    }
  }, [visible]);

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: "height" })}
        style={styles.backdrop}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <AlertTriangle color={colors.brandRedDark} size={22} strokeWidth={2.4} />
              </View>
              <Text style={styles.title}>{title}</Text>
              <Pressable hitSlop={10} onPress={onCancel} style={styles.closeButton}>
                <X color={colors.muted} size={20} strokeWidth={2.4} />
              </Pressable>
            </View>

            <Text style={styles.description}>{description}</Text>

            {bullets && bullets.length > 0 && (
              <View style={styles.bullets}>
                {bullets.map((bullet) => (
                  <View key={bullet} style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.label}>
              Escribí <Text style={styles.confirmWord}>{confirmWord}</Text> para confirmar:
            </Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setTyped}
              placeholder={confirmWord}
              placeholderTextColor={colors.placeholder}
              style={[styles.input, matches && styles.inputMatches]}
              value={typed}
            />

            <View style={styles.actions}>
              <Button
                onPress={onCancel}
                size="small"
                style={styles.actionButton}
                title="Cancelar"
                variant="ghost"
              />
              <Button
                disabled={!matches}
                loading={loading}
                onPress={onConfirm}
                size="small"
                style={styles.actionButton}
                title={destructiveLabel}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(15, 17, 21, 0.55)",
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    gap: spacing.md,
    padding: spacing.lg,
    width: "100%",
    ...shadows.lg,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  headerIcon: {
    alignItems: "center",
    backgroundColor: colors.redSoft,
    borderRadius: radius.md,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  title: {
    ...typography.h2,
    color: colors.ink,
    flex: 1,
  },
  description: {
    ...typography.body,
    color: colors.inkSoft,
  },
  bullets: {
    backgroundColor: colors.redSofter,
    borderRadius: radius.md,
    gap: spacing.xs,
    padding: spacing.md,
  },
  bulletRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  bulletDot: {
    backgroundColor: colors.brandRedDark,
    borderRadius: 999,
    height: 6,
    marginTop: 8,
    width: 6,
  },
  bulletText: {
    ...typography.caption,
    color: colors.inkSoft,
    flex: 1,
  },
  label: {
    ...typography.captionStrong,
    color: colors.ink,
  },
  confirmWord: {
    color: colors.brandRedDark,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1.5,
    color: colors.ink,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputMatches: {
    borderColor: colors.brandRed,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
