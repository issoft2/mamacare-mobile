/**
 * packages/ui/src/theme.ts
 * Light and dark theme definitions using design tokens.
 */

import { colors } from "./tokens";

export const lightTheme = {
  background:       colors.white,
  surface:          colors.gray[50],
  surfaceElevated:  colors.white,
  border:           colors.gray[200],
  borderFocus:      colors.rose[500],

  text:             colors.gray[900],
  textSecondary:    colors.gray[600],
  textMuted:        colors.gray[400],
  textInverse:      colors.white,

  primary:          colors.rose[500],
  primaryDark:      colors.rose[600],
  primaryLight:     colors.rose[100],

  secondary:        colors.navy[700],
  secondaryLight:   colors.navy[100],

  success:          colors.sage[500],
  successLight:     colors.sage[100],
  warning:          "#BA7517",
  warningLight:     "#FFF3D0",
  error:            colors.urgency.emergency,
  errorLight:       "#FCEBEB",
  info:             colors.navy[500],
  infoLight:        colors.navy[50],
} as const;

export const darkTheme = {
  background:       colors.gray[900],
  surface:          colors.gray[800],
  surfaceElevated:  colors.gray[700],
  border:           colors.gray[700],
  borderFocus:      colors.rose[400],

  text:             colors.gray[50],
  textSecondary:    colors.gray[300],
  textMuted:        colors.gray[500],
  textInverse:      colors.gray[900],

  primary:          colors.rose[400],
  primaryDark:      colors.rose[500],
  primaryLight:     colors.rose[900],

  secondary:        colors.navy[200],
  secondaryLight:   colors.navy[800],

  success:          colors.sage[400],
  successLight:     colors.sage[900],
  warning:          "#D4881F",
  warningLight:     "#3D2A00",
  error:            "#D44040",
  errorLight:       "#3D0F0F",
  info:             colors.navy[300],
  infoLight:        colors.navy[800],
} as const;

export type Theme = typeof lightTheme;
