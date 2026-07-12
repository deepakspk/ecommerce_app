import { useContext } from 'react';
import { ThemeSettingsContext, ThemeSettingsContextValue } from '@/context/ThemeSettingsContext';

export function useThemeSettings(): ThemeSettingsContextValue {
  const ctx = useContext(ThemeSettingsContext);
  if (!ctx) throw new Error('useThemeSettings must be used within a ThemeSettingsProvider');
  return ctx;
}
