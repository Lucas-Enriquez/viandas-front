import { StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, spacing } from "../theme";

export function TopScrim() {
  const insets = useSafeAreaInsets();
  // Cover the status bar area + a small bleed where blur fades into content.
  const height = insets.top + spacing.lg;

  return (
    <>
      {/* Blur backdrop — blurs content scrolling under the status bar */}
      <BlurView
        intensity={24}
        tint="light"
        pointerEvents="none"
        style={[styles.scrim, { height }]}
      />

      {/* Gradient overlay — subtle white veil at the top fading to transparent.
          Soft on purpose so it doesn't whitewash colored headers like Hero. */}
      <Svg
        pointerEvents="none"
        style={[styles.scrim, { height }]}
        width="100%"
        height={height}
      >
        <Defs>
          <LinearGradient id="topScrim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"   stopColor={colors.background} stopOpacity="0.45" />
            <Stop offset="0.5" stopColor={colors.background} stopOpacity="0.2"  />
            <Stop offset="1"   stopColor={colors.background} stopOpacity="0"    />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#topScrim)" />
      </Svg>
    </>
  );
}

const styles = StyleSheet.create({
  scrim: {
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});
