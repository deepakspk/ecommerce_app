/**
 * Static default palette — matches the web app's Tailwind `@theme` defaults exactly
 * (see 01-DOCUMENTATION.md §10). This is the fallback used before ThemeSettingsContext
 * (Prompt 11) resolves the live, Super-Admin-configurable primary color.
 */
export const colors = {
  brand50: '#eff6ff',
  brand100: '#dbeafe',
  brand500: '#3b82f6',
  brand600: '#2563eb',
  brand700: '#1d4ed8',
  brand800: '#1e40af',

  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray700: '#374151',
  gray900: '#111827',

  success50: '#f0fdf4',
  success100: '#dcfce7',
  success600: '#16a34a',
  success700: '#15803d',

  warning50: '#fffbeb',
  warning100: '#fef3c7',
  warning600: '#d97706',
  warning700: '#b45309',

  danger50: '#fef2f2',
  danger100: '#fee2e2',
  danger600: '#dc2626',
  danger700: '#b91c1c',

  info50: '#eef2ff',
  info100: '#e0e7ff',
  info600: '#4f46e5',
  info700: '#4338ca',

  white: '#ffffff',
  black: '#000000',
} as const;

export type ColorToken = keyof typeof colors;
/** Same key set as `colors`, but widened to plain `string` values — the live theme's derived brand shades aren't statically-known literals. */
export type ColorPalette = Record<ColorToken, string>;
