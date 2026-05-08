export const colors = {
  background:    "#FFF8EE",
  surface:       "#FFFFFF",
  surfaceMuted:  "#FAF1E1",
  surfaceWarm:   "#FCE8D4",
  border:        "#EFE3D0",
  borderStrong:  "#E0CBA8",

  ink:           "#2A1810",
  inkSoft:       "#5A3E2B",
  muted:         "#7A5C44",
  placeholder:   "#A38B72",
  onBrand:       "#FFFFFF",

  brandRed:      "#E63946",
  brandRedDark:  "#B82B36",
  brandRedLight: "#FF6B6B",
  redBorder:     "#FF6B6B",
  redSoft:       "#FFE8E8",
  redSofter:     "#FFF4F4",

  accent:        "#F4A261",
  accentSoft:    "#FCE8D4",
  mustard:       "#E9C46A",
  mustardSoft:   "#FFF6DC",

  success:       "#2A9D8F",
  successSoft:   "#DFF1EE",
  warning:       "#F4A261",
  warningSoft:   "#FCE8D4",
  yellow:        "#E9C46A",
  yellowSoft:    "#FFF6DC",

  shadow:        "#5A3E2B",
} as const;

export const spacing = {
  xxxs: 2,
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
  },
  brand: {
    shadowColor: colors.brandRed,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const typography = {
  brand: {
    fontSize: 22,
    fontWeight: "800" as const,
    letterSpacing: -0.3,
  },
  h1: {
    fontSize: 30,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  h2: {
    fontSize: 22,
    fontWeight: "800" as const,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    letterSpacing: 0,
    lineHeight: 24,
  },
  bodyStrong: {
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0,
    lineHeight: 24,
  },
  button: {
    fontSize: 16,
    fontWeight: "800" as const,
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: "500" as const,
    letterSpacing: 0,
    lineHeight: 18,
  },
  captionStrong: {
    fontSize: 13,
    fontWeight: "800" as const,
    letterSpacing: 0.3,
    lineHeight: 18,
  },
} as const;
