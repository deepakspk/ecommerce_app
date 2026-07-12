import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { getThemeSettings } from '@/api/settings';
import { deriveBrandScale } from '@/utils/colorShades';
import { colors as staticColors } from '@/theme/colors';
import type { ColorPalette } from '@/theme/colors';

export interface ThemeSettingsContextValue {
  colors: ColorPalette;
  loading: boolean;
  refresh: () => Promise<void>;
}

export const ThemeSettingsContext = createContext<ThemeSettingsContextValue | undefined>(undefined);

async function fetchTheme(setColors: (colors: ColorPalette) => void, setLoading: (loading: boolean) => void) {
  try {
    const theme = await getThemeSettings();
    const brandScale = deriveBrandScale(theme.primaryColor || staticColors.brand600);
    setColors({ ...staticColors, ...brandScale });
  } catch {
    // Keep whatever's already in state (the static default palette on first
    // load) — a brief flash of the default brand color on cold start, or a
    // fetch failure, is an accepted trade-off here, not worth over-engineering
    // around (01-DOCUMENTATION.md §2.16 / 02-REACT-NATIVE-PROMPTS.md Prompt 11).
  } finally {
    setLoading(false);
  }
}

/**
 * Fetched once per app session on launch (Prompt 11's caching strategy —
 * same tier as Categories/CompanySettings), derives a full brand50-800 ramp
 * from the Super-Admin-configured `primaryColor` and merges it over the
 * static default palette. React Native has no CSS custom properties (the web
 * app's re-skinning trick), so this updates the theme object in memory
 * instead — every `components/ui/*` primitive that touches a brand color
 * reads it live through `useThemeSettings()` rather than a static `theme`
 * import, so they all re-render the instant this resolves.
 */
export function ThemeSettingsProvider({ children }: { children: ReactNode }) {
  const [colors, setColors] = useState<ColorPalette>(staticColors);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => fetchTheme(setColors, setLoading), []);

  useEffect(() => {
    fetchTheme(setColors, setLoading);
  }, []);

  const value = useMemo(() => ({ colors, loading, refresh }), [colors, loading, refresh]);

  return <ThemeSettingsContext.Provider value={value}>{children}</ThemeSettingsContext.Provider>;
}
