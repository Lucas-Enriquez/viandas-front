export const colors = {
  background:    "#F7F7F8",
  surface:       "#FFFFFF",
  surfaceMuted:  "#F1F2F4",
  surfaceWarm:   "#FEF2F2",
  border:        "#E5E7EB",
  borderStrong:  "#D1D5DB",

  ink:           "#0F1115",
  inkSoft:       "#1F2937",
  muted:         "#6B7280",
  placeholder:   "#9CA3AF",
  onBrand:       "#FFFFFF",

  brandRed:      "#DC2626",
  brandRedDark:  "#991B1B",
  brandRedLight: "#EF4444",
  redBorder:     "#FCA5A5",
  redSoft:       "#FEE2E2",
  redSofter:     "#FEF2F2",

  accent:        "#2563EB",
  accentSoft:    "#DBEAFE",
  mustard:       "#F59E0B",
  mustardSoft:   "#FEF3C7",

  success:       "#059669",
  successSoft:   "#D1FAE5",
  warning:       "#D97706",
  warningSoft:   "#FEF3C7",
  yellow:        "#F59E0B",
  yellowSoft:    "#FEF3C7",

  shadow:        "#0F1115",
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
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 12,
  },
  brand: {
    shadowColor: colors.brandRed,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.20,
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
    fontSize: 26,
    fontWeight: "800" as const,
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  h2: {
    fontSize: 20,
    fontWeight: "800" as const,
    letterSpacing: -0.2,
    lineHeight: 26,
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
