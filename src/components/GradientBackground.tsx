import { PropsWithChildren } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

type Direction = "vertical" | "horizontal" | "diagonal";

type GradientBackgroundProps = PropsWithChildren<{
  from: string;
  to: string;
  direction?: Direction;
  style?: ViewStyle;
  borderRadius?: number;
}>;

export function GradientBackground({
  children,
  from,
  to,
  direction = "vertical",
  style,
  borderRadius,
}: GradientBackgroundProps) {
  const coords =
    direction === "vertical"
      ? { x1: "0", y1: "0", x2: "0", y2: "1" }
      : direction === "horizontal"
        ? { x1: "0", y1: "0", x2: "1", y2: "0" }
        : { x1: "0", y1: "0", x2: "1", y2: "1" };

  return (
    <View style={[styles.wrapper, borderRadius != null ? { borderRadius, overflow: "hidden" } : null, style]}>
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="grad" {...coords}>
            <Stop offset="0" stopColor={from} stopOpacity="1" />
            <Stop offset="1" stopColor={to} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
  },
});
