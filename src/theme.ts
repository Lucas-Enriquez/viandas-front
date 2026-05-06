export const colors = {

  background:   "#FFFFFF",
  surface:      "#FFFFFF",
  surfaceMuted: "#F5F5F5",
  border:       "#EBEBEB",

  ink:          "#121212",
  muted:        "#484848",
  placeholder:  "#717171",
  onBrand:      "#FFFFFF",


  brandRed:     "#FF2A2A",
  redBorder:    "#FF6B6B",
  redSoft:      "#FFF0F0",
  shadow:       "#2C2C2C",

  success:      "#00A651",
  successSoft:  "#E6F7EE",
  warning:      "#FF8C00",
  yellow:       "#FFB800",
  yellowSoft:   "#fffcf6",
} as const;
export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  xxl: 42,
} as const;

export const typography = {
  brand: {
    fontSize: 20,
    fontWeight: "800" as const,
    letterSpacing: 0,
  },
  h1: {
    fontSize: 28,
    fontWeight: "800" as const,
    letterSpacing: 0,
    lineHeight: 34,
  },
  h2: {
    fontSize: 20,
    fontWeight: "800" as const,
    letterSpacing: 0,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    letterSpacing: 0,
    lineHeight: 23,
  },
  bodyStrong: {
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0,
    lineHeight: 23,
  },
  button: {
    fontSize: 16,
    fontWeight: "800" as const,
    letterSpacing: 0,
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
    letterSpacing: 0,
    lineHeight: 18,
  },
} as const;
