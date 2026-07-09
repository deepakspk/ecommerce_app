import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { CompanySettings, getCompanySettings } from '@/api/settings';

export interface CompanySettingsContextValue {
  company: CompanySettings;
  loading: boolean;
  refresh: () => Promise<void>;
}

export const CompanySettingsContext = createContext<CompanySettingsContextValue | undefined>(
  undefined,
);

async function fetchCompanySettings(
  setCompany: (company: CompanySettings) => void,
  setLoading: (loading: boolean) => void,
) {
  try {
    const data = await getCompanySettings();
    setCompany(data);
  } catch {
    setCompany({});
  } finally {
    setLoading(false);
  }
}

/**
 * Fetched once on mount, shared via `useCompanySettings()`. Defaults to `{}`
 * gracefully so nothing crashes on a fresh, unconfigured install
 * (01-DOCUMENTATION.md §2.16).
 */
export function CompanySettingsProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<CompanySettings>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => fetchCompanySettings(setCompany, setLoading), []);

  useEffect(() => {
    fetchCompanySettings(setCompany, setLoading);
  }, []);

  const value = useMemo(() => ({ company, loading, refresh }), [company, loading, refresh]);

  return (
    <CompanySettingsContext.Provider value={value}>{children}</CompanySettingsContext.Provider>
  );
}
