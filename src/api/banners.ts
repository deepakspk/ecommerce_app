import { apiGet } from './client';
import { Banner } from '@/types/banner';

export function getBanners() {
  return apiGet<{ banners: Banner[] }>('/banners').then((data) => data.banners);
}
