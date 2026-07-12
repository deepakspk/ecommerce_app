import { apiGet } from './client';

/** Mirrors the backend's CompanySettings singleton (01-DOCUMENTATION.md §5). */
export interface CompanySettings {
  companyName?: string;
  regdNo?: string;
  vatPan?: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  logoUrl?: string;
  faviconUrl?: string;
  social?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
    whatsapp?: string;
  };
}

/**
 * The backend responds gracefully with `{}` on a fresh, unconfigured install
 * (01-DOCUMENTATION.md §2.16) — fall back to `{}` here too so nothing crashes.
 */
export function getCompanySettings() {
  return apiGet<{ company?: CompanySettings }>('/settings/company').then((data) => data.company ?? {});
}
