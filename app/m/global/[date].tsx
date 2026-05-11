import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { setStoredGlobalMenuLink } from "../../../src/storage";
import { colors } from "../../../src/theme";

export default function GlobalMenuDeepLink() {
  const { date, t } = useLocalSearchParams<{ date: string; t: string }>();

  useEffect(() => {
    if (!date || !t) {
      router.replace("/employee-menu");
      return;
    }
    setStoredGlobalMenuLink({ date, token: t }).then(() => {
      router.replace("/employee-menu");
    });
  }, [date, t]);

  return (
    <View style={styles.root}>
      <ActivityIndicator color={colors.brandRed} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
  },
});
