import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { Info, X } from "lucide-react-native";

import { Button } from "./Button";
import { colors, radius, shadows, spacing, typography } from "../theme";

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  icon?: LucideIcon;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmModal({
  visible,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  loading = false,
  icon: Icon = Info,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
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
                <Icon color={colors.brandRed} size={22} strokeWidth={2.2} />
              </View>
              <Text style={styles.title}>{title}</Text>
              <Pressable hitSlop={10} onPress={onCancel} style={styles.closeButton}>
                <X color={colors.muted} size={20} strokeWidth={2.4} />
              </Pressable>
            </View>

            <Text style={styles.description}>{description}</Text>

            <View style={styles.actions}>
              <Button
                onPress={onCancel}
                size="small"
                style={styles.actionButton}
                title={cancelLabel}
                variant="ghost"
              />
              <Button
                loading={loading}
                onPress={onConfirm}
                size="small"
                style={styles.actionButton}
                title={confirmLabel}
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
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
