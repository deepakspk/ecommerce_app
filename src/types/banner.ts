/** Mirrors the backend's Banner model (01-DOCUMENTATION.md §5). */
export interface Banner {
  _id: string;
  imageUrl: string;
  /** 800×400 (2:1) mobile-optimized image; empty/absent on banners created before it existed. */
  mobileImageUrl?: string;
  link?: string;
  sortOrder: number;
  isActive: boolean;
}
