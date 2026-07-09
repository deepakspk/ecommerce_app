import { TextStyle } from 'react-native';
import { colors } from './colors';

/**
 * Type scale mirrors the web app's role system (01-DOCUMENTATION.md §8):
 * H1 page title / H2 section heading / H3 card title / body / muted / label / price.
 * System font stack only — matches the web app's deliberate choice to skip webfonts
 * for fastest load on mixed-quality connections (01-DOCUMENTATION.md §10).
 */
export const typography: Record<string, TextStyle> = {
  h1: { fontSize: 24, fontWeight: '700', color: colors.gray900, lineHeight: 30 },
  h2: { fontSize: 18, fontWeight: '600', color: colors.gray900, lineHeight: 24 },
  h3: { fontSize: 14, fontWeight: '600', color: colors.gray900, lineHeight: 20 },
  body: { fontSize: 14, fontWeight: '400', color: colors.gray700, lineHeight: 21 },
  muted: { fontSize: 12, fontWeight: '400', color: colors.gray500, lineHeight: 17 },
  label: { fontSize: 13, fontWeight: '500', color: colors.gray700, lineHeight: 18 },
  priceList: { fontSize: 14, fontWeight: '600', color: colors.gray900, lineHeight: 20 },
  priceDetail: { fontSize: 24, fontWeight: '700', color: colors.gray900, lineHeight: 30 },
};
