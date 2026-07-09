/** Mirrors the backend's Category model (01-DOCUMENTATION.md §5). */
export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent: string | null;
  level: number;
  isActive: boolean;
  sortOrder: number;
  /** Present on the nested `GET /categories/tree` response only. */
  subcategories?: Category[];
}
