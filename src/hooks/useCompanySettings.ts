import { useContext } from 'react';
import {
  CompanySettingsContext,
  CompanySettingsContextValue,
} from '@/context/CompanySettingsContext';

export function useCompanySettings(): CompanySettingsContextValue {
  const ctx = useContext(CompanySettingsContext);
  if (!ctx) throw new Error('useCompanySettings must be used within a CompanySettingsProvider');
  return ctx;
}
