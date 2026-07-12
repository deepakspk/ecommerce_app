import { colors } from './colors';
import { spacing, radius } from './spacing';
import { typography } from './typography';

export const theme = {
  colors,
  spacing,
  radius,
  typography,
};

export type Theme = typeof theme;

export { colors, spacing, radius, typography };
export type { ColorPalette, ColorToken } from './colors';
