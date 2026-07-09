import { apiClient } from './client';

/** "Notify me" on an out-of-stock variant — requires login (01-DOCUMENTATION.md §2.15, §4.8). */
export function createStockAlert(variantId: string) {
  return apiClient
    .post<{ message: string }>('/stock-alerts', { variantId })
    .then((res) => res.data);
}
