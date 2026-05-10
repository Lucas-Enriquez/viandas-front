import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { CircleAlert, Inbox } from "lucide-react-native";

import { Button } from "./Button";
import { Screen } from "./Screen";
import { colors, radius, spacing, typography } from "../theme";

type StateProps = {
  actionLabel?: string;
  icon?: LucideIcon;
  message?: string;
  onAction?: () => void;
  title: string;
};

export function LoadingState({ label }: { label: string }) {
  return (
    <Screen scroll={false}>
      <View style={styles.fillCentered}>
        <ActivityIndicator color={colors.brandRed} size="large" />
        <Text style={styles.message}>{label}</Text>
      </View>
    </Screen>
  );
}

export function EmptyState({
  actionLabel,
  icon: Icon = Inbox,
  message,
  onAction,
  title,
}: StateProps) {
  return (
    <View style={styles.state}>
      <View style={styles.iconWrap}>
        <Icon color={colors.brandRed} size={32} strokeWidth={2.4} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!message && <Text style={styles.message}>{message}</Text>}
      {!!actionLabel && !!onAction && (
        <Button onPress={onAction} title={actionLabel} variant="secondary" />
      )}
    </View>
  );
}

export function ErrorState({
  actionLabel,
  icon: Icon = CircleAlert,
  message,
  onAction,
  title,
}: StateProps) {
  return (
    <Screen scroll={false}>
      <View style={styles.fillCentered}>
        <View style={styles.iconWrap}>
          <Icon color={colors.brandRed} size={34} strokeWidth={2.4} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {!!message && <Text style={styles.message}>{message}</Text>}
        {!!actionLabel && !!onAction && <Button onPress={onAction} title={actionLabel} />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fillCentered: {
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
    justifyContent: "center",
  },
  state: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.lg,
    height: 80,
    justifyContent: "center",
    width: 80,
  },
  title: {
    ...typography.h2,
    color: colors.ink,
    textAlign: "center",
  },
  message: {
    ...typography.body,
    color: colors.muted,
    maxWidth: 320,
    textAlign: "center",
  },
});
