import { apiClient } from './client';
import { Category } from '@/types/category';

/** Shared app-wide via `CategoriesContext` — fetched once, never per-screen (01-DOCUMENTATION.md §9). */
export function getCategoryTree() {
  return apiClient.get<{ tree: Category[] }>('/categories/tree').then((res) => res.data.tree);
}
