import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";

import { colors, radius as radiusTokens, spacing } from "../theme";

type SkeletonProps = {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: ViewStyle;
};

function SkeletonBlock({ width = "100%", height = 16, radius = radiusTokens.sm, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          backgroundColor: colors.surfaceMuted,
          borderRadius: radius,
          height,
          opacity,
          width: width as number,
        },
        style,
      ]}
    />
  );
}

function SkeletonLine({ width = "100%", style }: { width?: number | string; style?: ViewStyle }) {
  return <SkeletonBlock height={14} radius={radiusTokens.sm} style={style} width={width} />;
}

function SkeletonCard({ height = 96 }: { height?: number }) {
  return (
    <View style={styles.cardWrap}>
      <SkeletonBlock height={height} radius={radiusTokens.lg} />
    </View>
  );
}

function SkeletonRow({ withIcon = false }: { withIcon?: boolean }) {
  return (
    <View style={styles.row}>
      {withIcon && <SkeletonBlock height={44} radius={radiusTokens.md} width={44} />}
      <View style={styles.rowBody}>
        <SkeletonLine width="70%" />
        <SkeletonLine width="50%" />
      </View>
    </View>
  );
}

export const Skeleton = Object.assign(SkeletonBlock, {
  Line: SkeletonLine,
  Card: SkeletonCard,
  Row: SkeletonRow,
});

const styles = StyleSheet.create({
  cardWrap: {
    paddingVertical: spacing.xs,
  },
  row: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radiusTokens.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  rowBody: {
    flex: 1,
    gap: spacing.xs,
  },
});
