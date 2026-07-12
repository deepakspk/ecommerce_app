import { apiClient } from './client';

export function getInternationalFee() {
  return apiClient.get<{ fee: number }>('/logistics/international-fee').then((res) => res.data.fee);
}

/** Raw NCM branch objects, pass-through unmodified — `district_name` is the only field name the backend itself relies on. */
export interface LogisticsBranch {
  district_name: string;
  name?: string;
  [key: string]: unknown;
}

export function getBranches(district: string) {
  return apiClient
    .get<{ branches: LogisticsBranch[] }>('/logistics/branches', { params: { district } })
    .then((res) => res.data.branches);
}

/** Body is `branchName` only — the server supplies its own pickup branch and delivery type (01-DOCUMENTATION.md §7.7 ground truth). */
export function getRate(branchName: string) {
  return apiClient.post<{ charge: number }>('/logistics/rate', { branchName }).then((res) => res.data.charge);
}

/** Rs. 100 if the province is Bagmati (case-insensitive), else Rs. 200 — mirrors the server's exact fallback formula. */
export function calcFlatDeliveryFee(province: string | undefined): number {
  return (province ?? '').toLowerCase().trim() === 'bagmati' ? 100 : 200;
}
