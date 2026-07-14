import { apiGet } from './client';
import { Promotion } from '@/types/promotion';

export function getPromotions() {
  return apiGet<{ promotions: Promotion[] }>('/promotions').then((data) => data.promotions ?? []);
}
