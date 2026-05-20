import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text } from "react-native";

import { colors, spacing, typography } from "../theme";

const logoSource = require("../../assets/logo.png");

type BrandLogoProps = {
  size?: "large" | "compact";
};

export function BrandLogo({ size = "compact" }: BrandLogoProps) {
  const isLarge = size === "large";
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 6 }),
    ]).start();
  }, [opacity, scale]);

  return (
    <Animated.View style={[styles.wrapper, { opacity, transform: [{ scale }] }]}>
      <Image
        accessibilityLabel="Logo Viandas"
        resizeMode="contain"
        source={logoSource}
        style={isLarge ? styles.logoLarge : styles.logoCompact}
      />
      {!isLarge && <Text style={styles.brandText}>Viandas</Text>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: spacing.xs,
  },
  logoLarge: {
    height: 176,
    width: 260,
  },
  logoCompact: {
    height: 42,
    width: 74,
  },
  brandText: {
    ...typography.brand,
    color: colors.brandRed,
  },
});
