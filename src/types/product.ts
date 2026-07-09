/**
 * Mirrors the backend's Product model plus the precomputed fields every
 * listing/detail response carries (finalPrice, averageRating, reviewCount,
 * variantCount) — never recomputed on-device (01-DOCUMENTATION.md §2.3, §5).
 */
export interface ProductImage {
  url: string;
  altText?: string;
  sortOrder: number;
}

export type DiscountType = 'PERCENTAGE' | 'FIXED' | null;

export interface ProductSummary {
  _id: string;
  name: string;
  slug: string;
  basePrice: number;
  discountType: DiscountType;
  discountValue?: number;
  finalPrice: number;
  images: ProductImage[];
  averageRating?: number;
  reviewCount: number;
  variantCount: number;
  isActive: boolean;
}

export interface AdditionalInfoItem {
  label: string;
  value: string;
}

/** `GET /products/:slug`'s `product` field — richer than the listing summary (01-DOCUMENTATION.md §5). */
export interface ProductDetail extends ProductSummary {
  shortDescription?: string;
  description?: string;
  additionalInformation?: AdditionalInfoItem[];
  weight?: number;
  categories: string[];
}
