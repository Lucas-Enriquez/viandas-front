import { PropsWithChildren, useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing } from "../theme";

type ScreenProps = PropsWithChildren<{
  contentStyle?: ViewStyle;
  scroll?: boolean;
  animateEntry?: boolean;
}>;

export function Screen({
  children,
  contentStyle,
  scroll = true,
  animateEntry = true,
}: ScreenProps) {
  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <EntryWrapper animate={animateEntry}>{children}</EntryWrapper>
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.staticContent, contentStyle]}>
          <EntryWrapper animate={animateEntry}>{children}</EntryWrapper>
        </View>
      )}
    </SafeAreaView>
  );
}

function EntryWrapper({ children, animate }: PropsWithChildren<{ animate: boolean }>) {
  const opacity = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(animate ? 10 : 0)).current;

  useEffect(() => {
    if (!animate) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 3 }),
    ]).start();
  }, [animate, opacity, translateY]);

  return (
    <Animated.View style={[styles.fill, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  staticContent: {
    flex: 1,
  },
  fill: {
    flex: 1,
    gap: spacing.md,
  },
});
