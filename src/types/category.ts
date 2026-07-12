/**
 * Mirrors the actual `GET /categories/tree` response shape, which differs
 * from the rest of the API: this endpoint serializes `id` (not `_id`) and
 * `children` (not `subcategories`), and `image` may be a relative path
 * rather than an absolute URL (resolve via `resolveAssetUrl` before display).
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  level: number;
  isActive: boolean;
  sortOrder: number;
  children?: Category[];
}
