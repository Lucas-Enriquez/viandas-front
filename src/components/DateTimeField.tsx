import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { CalendarDays, Clock } from "lucide-react-native";

import { colors, spacing, typography } from "../theme";

type DateTimeFieldProps = {
  label: string;
  mode: "date" | "time";
  onChange: (value: Date) => void;
  value: Date;
};

export function DateTimeField({ label, mode, onChange, value }: DateTimeFieldProps) {
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const Icon = mode === "date" ? CalendarDays : Clock;

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== "ios") {
      setIsPickerVisible(false);
    }

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    onChange(selectedDate);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setIsPickerVisible(true)}
        style={({ pressed }) => [styles.field, pressed ? styles.pressed : null]}
      >
        <Icon color={colors.brandRed} size={20} strokeWidth={2.4} />
        <Text style={styles.value}>{formatValue(value, mode)}</Text>
      </Pressable>

      {isPickerVisible && (
        <View style={Platform.OS === "ios" ? styles.iosPickerWrap : undefined}>
          <DateTimePicker
            display={Platform.select({ android: "default", ios: "spinner" })}
            locale="es-AR"
            mode={mode}
            onChange={handleChange}
            value={value}
          />
          {Platform.OS === "ios" && (
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsPickerVisible(false)}
              style={styles.doneButton}
            >
              <Text style={styles.doneText}>Listo</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function formatValue(value: Date, mode: "date" | "time") {
  if (mode === "date") {
    return value.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  return value.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const styles = StyleSheet.create({
  doneButton: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: colors.brandRed,
    borderRadius: 8,
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  doneText: {
    ...typography.button,
    color: colors.onBrand,
  },
  field: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  iosPickerWrap: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  label: {
    ...typography.captionStrong,
    color: colors.ink,
  },
  pressed: {
    opacity: 0.82,
  },
  value: {
    ...typography.body,
    color: colors.ink,
    flex: 1,
  },
  wrapper: {
    gap: spacing.xs,
  },
});
