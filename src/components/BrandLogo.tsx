import { Image, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../theme";

const logoSource = require("../../assets/logo.png");

type BrandLogoProps = {
  size?: "large" | "compact";
};

export function BrandLogo({ size = "compact" }: BrandLogoProps) {
  const isLarge = size === "large";

  return (
    <View style={styles.wrapper}>
      <Image
        accessibilityLabel="Logo Caseritas"
        resizeMode="contain"
        source={logoSource}
        style={isLarge ? styles.logoLarge : styles.logoCompact}
      />
      {!isLarge && <Text style={styles.brandText}>Caseritas</Text>}
    </View>
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
