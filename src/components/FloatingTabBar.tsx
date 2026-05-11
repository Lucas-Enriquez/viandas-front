import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  UIManager,
  View,
} from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { BlurView } from "expo-blur";
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
  // Only native-driver animations: no width/layout on JS thread.
  const labelOpacity = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const pressScale  = useRef(new Animated.Value(1)).current;

  // Delay icon color switch when becoming active so it doesn't flash
  // white on a gray background before the pill snaps to red.
  const [iconWhite, setIconWhite] = useState(isFocused);

  useEffect(() => {
    if (isFocused) {
      const t = setTimeout(() => setIconWhite(true), 30);
      Animated.timing(labelOpacity, {
        toValue: 1,
        duration: 160,
        delay: 60,
        useNativeDriver: true,
      }).start();
      return () => clearTimeout(t);
    } else {
      setIconWhite(false);
      Animated.timing(labelOpacity, {
        toValue: 0,
        duration: 80,
        useNativeDriver: true,
      }).start();
    }
  }, [isFocused, labelOpacity]);

  const onPressIn = () =>
    Animated.spring(pressScale, {
      toValue: 0.88,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();

  const onPressOut = () =>
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 5,
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
    >
      <Animated.View style={{ transform: [{ scale: pressScale }] }}>
        <View style={isFocused ? styles.tabActive : styles.tabInactive}>
          {Icon ? Icon({ focused: isFocused, color: iconColor, size: ICON_SIZE }) : null}
          {isFocused && (
            <Animated.Text
              numberOfLines={1}
              style={[styles.label, { opacity: labelOpacity }]}
            >
              {label}
            </Animated.Text>
          )}
        </View>
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
  const scrimHeight = TAB_HEIGHT + bottomInset + spacing.xxxl + spacing.lg;

  const visibleRoutes = state.routes.filter((route) => {
    const { options } = descriptors[route.key];
    const itemStyle = options.tabBarItemStyle as { display?: string } | undefined;
    return itemStyle?.display !== "none";
  });

  return (
    <>
      {/* Blur backdrop — blurs content scrolling behind the bar */}
      <BlurView
        intensity={28}
        tint="light"
        pointerEvents="none"
        style={[styles.scrim, { height: scrimHeight }]}
      />

      {/* SVG gradient overlay — transparent top → solid bottom so blur fades in smoothly */}
      <Svg
        pointerEvents="none"
        style={[styles.scrim, { height: scrimHeight }]}
        width="100%"
        height={scrimHeight}
      >
        <Defs>
          <LinearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"    stopColor={colors.background} stopOpacity="0"   />
            <Stop offset="0.5"  stopColor={colors.background} stopOpacity="0.2" />
            <Stop offset="0.78" stopColor={colors.background} stopOpacity="0.8" />
            <Stop offset="1"    stopColor={colors.background} stopOpacity="1"   />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#scrim)" />
      </Svg>

      {/* Floating pill bar */}
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
    </>
  );
}

const styles = StyleSheet.create({
  scrim: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
  },
  wrapper: {
    alignItems: "center",
    bottom: 0,
    left: 0,
    paddingHorizontal: spacing.sm,
    pointerEvents: "box-none",
    position: "absolute",
    right: 0,
  } as const,
  bar: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: spacing.xxxs,
    justifyContent: "center",
    paddingHorizontal: spacing.xxxs,
    paddingVertical: spacing.xxxs,
    ...shadows.lg,
  },
  // Inactive: explicit square → border-radius makes it a circle
  tabInactive: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: TAB_HEIGHT,
    justifyContent: "center",
    overflow: "hidden",
    width: TAB_HEIGHT,
  },
  // Active: pill shape grows to fit icon + label
  tabActive: {
    alignItems: "center",
    backgroundColor: colors.brandRed,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: spacing.xs,
    height: TAB_HEIGHT,
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    ...shadows.brand,
  },
  label: {
    ...typography.captionStrong,
    color: colors.onBrand,
    fontSize: 13,
    letterSpacing: 0.2,
  },
});
