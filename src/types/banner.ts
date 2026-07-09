/** Mirrors the backend's Banner model (01-DOCUMENTATION.md §5). */
export interface Banner {
  _id: string;
  imageUrl: string;
  link?: string;
  sortOrder: number;
  isActive: boolean;
}
