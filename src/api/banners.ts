import { apiClient } from './client';
import { Banner } from '@/types/banner';

export function getBanners() {
  return apiClient.get<{ banners: Banner[] }>('/banners').then((res) => res.data.banners);
}
