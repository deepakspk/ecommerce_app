import { apiGet } from './client';

/** Mirrors the backend's FeatureType model (01-DOCUMENTATION.md §5). */
export interface FeatureType {
  _id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export function getFeatureTypes() {
  return apiGet<{ featureTypes: FeatureType[] }>('/feature-types').then((data) => data.featureTypes);
}
