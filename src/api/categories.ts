import { apiGet } from './client';
import { Category } from '@/types/category';

/** Shared app-wide via `CategoriesContext` — fetched once, never per-screen (01-DOCUMENTATION.md §9). */
export function getCategoryTree() {
  return apiGet<{ tree: Category[] }>('/categories/tree').then((data) => data.tree);
}
