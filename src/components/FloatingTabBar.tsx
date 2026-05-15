import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  UIManager,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import { colors, radius, shadows, spacing, typography } from "../theme";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TAB_HEIGHT = 48;
const ICON_SIZE = 22;

const SPRING_LAYOUT: Parameters<typeof LayoutAnimation.configureNext>[0] = {
  duration: 320,
  // Only animate layout changes (flex/size). Label opacity is owned by Animated.timing —
  // including create/delete here would conflict and leave the label stuck at opacity 0.
  update: {
    type: LayoutAnimation.Types.spring,
    springDamping: 0.82,
  },
};

// Screens should add this as paddingBottom so content isn't hidden behind the bar.
export const FLOATING_BAR_BOTTOM_OFFSET = TAB_HEIGHT + 56; // ~104dp, covers any safe-area

function TabItem({
  isFocused,
  label,
  Icon,
  onPress,
  onLongPress,
  accessibilityLabel,
  testID,
}: {
  isFocused: boolean;
  label: string;
  Icon: ((p: { focused: boolean; color: string; size: number }) => React.ReactNode) | undefined;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
}) {
  const labelOpacity = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const pressScale  = useRef(new Animated.Value(1)).current;

  // Delay icon color switch so it doesn't flash before the pill widens.
  const [iconWhite, setIconWhite] = useState(isFocused);

  useEffect(() => {
    if (isFocused) {
      const t = setTimeout(() => setIconWhite(true), 100);
      Animated.timing(labelOpacity, {
        toValue: 1,
        duration: 220,
        delay: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
      return () => clearTimeout(t);
    } else {
      setIconWhite(false);
      Animated.timing(labelOpacity, {
        toValue: 0,
        duration: 100,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [isFocused, labelOpacity]);

  const onPressIn = () =>
    Animated.spring(pressScale, {
      toValue: 0.90,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();

  const onPressOut = () =>
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 13,
      bounciness: 2,
    }).start();

  const iconColor = iconWhite ? colors.onBrand : colors.muted;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      onLongPress={onLongPress}
      style={isFocused ? styles.tabActive : styles.tabInactive}
    >
      <Animated.View
        style={[styles.tabInner, { transform: [{ scale: pressScale }] }]}
      >
        {Icon ? Icon({ focused: isFocused, color: iconColor, size: ICON_SIZE }) : null}
        {isFocused && (
          <Animated.Text
            numberOfLines={1}
            style={[styles.label, { opacity: labelOpacity }]}
          >
            {label}
          </Animated.Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

export function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, spacing.sm);

  const visibleRoutes = state.routes.filter((route) => {
    const { options } = descriptors[route.key];
    const itemStyle = options.tabBarItemStyle as { display?: string } | undefined;
    return itemStyle?.display !== "none";
  });

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { paddingBottom: bottomInset + spacing.sm }]}
    >
      <View style={styles.bar}>
          {visibleRoutes.map((route) => {
            const realIndex = state.routes.findIndex((r) => r.key === route.key);
            const isFocused = state.index === realIndex;
            const { options } = descriptors[route.key];
            const label =
              (options.tabBarLabel as string | undefined) ??
              options.title ??
              route.name;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                LayoutAnimation.configureNext(SPRING_LAYOUT);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (navigation as any).navigate(route.name, route.params);
              }
            };

            return (
              <TabItem
                key={route.key}
                isFocused={isFocused}
                label={label}
                Icon={options.tabBarIcon}
                onPress={onPress}
                onLongPress={() =>
                  navigation.emit({ type: "tabLongPress", target: route.key })
                }
                accessibilityLabel={
                  options.tabBarAccessibilityLabel as string | undefined
                }
                testID={options.tabBarButtonTestID}
              />
            );
          })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    bottom: 0,
    left: 0,
    paddingHorizontal: spacing.md,
    pointerEvents: "box-none",
    position: "absolute",
    right: 0,
  } as const,
  bar: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    flexDirection: "row",
    paddingHorizontal: spacing.xxxs,
    paddingVertical: spacing.xxxs,
    width: "100%",
    ...shadows.lg,
  },
  // Active: flex: 2 — grows proportionally relative to inactive tabs
  tabActive: {
    alignItems: "center",
    backgroundColor: colors.brandRed,
    borderRadius: radius.pill,
    flex: 2,
    flexDirection: "row",
    height: TAB_HEIGHT,
    justifyContent: "center",
    overflow: "hidden",
    ...shadows.brand,
  },
  // Inactive: transparent — glass background shows through
  tabInactive: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: radius.pill,
    flex: 1,
    height: TAB_HEIGHT,
    justifyContent: "center",
    overflow: "hidden",
  },
  tabInner: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  label: {
    ...typography.captionStrong,
    color: colors.onBrand,
    fontSize: 13,
    letterSpacing: 0.2,
  },
});
