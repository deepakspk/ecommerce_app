import { apiClient } from './client';

/** Mirrors the backend's FeatureType model (01-DOCUMENTATION.md §5). */
export interface FeatureType {
  _id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export function getFeatureTypes() {
  return apiClient
    .get<{ featureTypes: FeatureType[] }>('/feature-types')
    .then((res) => res.data.featureTypes);
}
