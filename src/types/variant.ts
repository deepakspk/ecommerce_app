/** Mirrors the backend's ProductVariant model (01-DOCUMENTATION.md §5). */
export interface ProductVariant {
  _id: string;
  productId: string;
  size: string;
  color: string;
  sku: string;
  /** Overrides the product's `basePrice` when set. */
  price?: number;
  stockQuantity: number;
  imageUrl?: string;
  isDefault?: boolean;
}
