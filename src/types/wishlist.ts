import { ProductImage } from './product';

/** `GET /wishlist` populates `productId` to a partial Product; no per-item `_id` (schema has `_id: false`). */
export interface WishlistItemProduct {
  _id: string;
  name: string;
  slug: string;
  basePrice: number;
  images: ProductImage[];
}

export interface WishlistItem {
  productId: WishlistItemProduct;
}
