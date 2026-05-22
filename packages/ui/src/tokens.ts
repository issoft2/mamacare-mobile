/**
 * packages/ui/src/tokens.ts
 *
 * mumcare AI Design Tokens
 * Used across mobile (React Native) and admin (Next.js).
 */

export const colors = {
  // Brand
  rose: {
    50:  "#FDF2F4",
    100: "#F9E8EC",
    200: "#F2C5D0",
    300: "#E89DB0",
    400: "#D97290",
    500: "#C05070",
    600: "#A03D58",
    700: "#7D2C42",
    800: "#5A1E2E",
    900: "#3A1220",
  },
  navy: {
    50:  "#EEF2F7",
    100: "#D4DFF0",
    200: "#A9BFE0",
    300: "#7E9FD1",
    400: "#4E7AB8",
    500: "#2D5898",
    600: "#1A3E76",
    700: "#1A2E4A",
    800: "#111E31",
    900: "#080F1A",
  },
  sage: {
    50:  "#EEF7F2",
    100: "#D4EDE0",
    200: "#A9DCC2",
    300: "#7DCBA3",
    400: "#52BA85",
    500: "#3A8060",
    600: "#2D6249",
    700: "#204533",
    800: "#14291E",
    900: "#080F0A",
  },
  peach: {
    50: "#FFF0E5", // Soft background peach/blush
    100: "#FFEDDF",
    // ... other shades if needed
  },
  coral: {
    300: "#FF9B9B", // Deeper accent coral/pink
    400: "#FF7F7F",
    // ... other shades if needed
  },
  lavender: { // The custom seed icon uses this too!
    500: "#E6E2FF",
  },
  // Semantic
  success:  "#3A8060",
  warning:  "#BA7517",
  error:    "#A32D2D",
  info:     "#1A3A6A",
  // Neutral
  white:    "#FFFFFF",
  black:    "#000000",
  gray: {
    50:  "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
  // Urgency tiers
  urgency: {
    none:              "#3A8060",
    log_only:          "#BA7517",
    notify_midwife:    "#D97230",
    notify_doctor:     "#C05070",
    emergency:         "#A32D2D",
    /** Matches `UrgencyTier` from @mumcare/types (agent / API). */
    emergency_advised: "#A32D2D",
  },
} as const;

export const typography = {
  fontFamily: {
    sans:  "Inter",
    serif: "Merriweather",
    mono:  "JetBrains Mono",
  },
  fontSize: {
    xs:   12,
    sm:   14,
    base: 16,
    lg:   18,
    xl:   20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },
  fontWeight: {
    normal:   "400",
    medium:   "500",
    semibold: "600",
    bold:     "700",
  },
  lineHeight: {
    tight:   1.25,
    normal:  1.5,
    relaxed: 1.75,
  },
} as const;

export const spacing = {
  0:   0,
  1:   4,
  2:   8,
  3:   12,
  4:   16,
  5:   20,
  6:   24,
  8:   32,
  10:  40,
  12:  48,
  16:  64,
  20:  80,
  24:  96,
} as const;

export const borderRadius = {
  none: 0,
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  "2xl": 24,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;
