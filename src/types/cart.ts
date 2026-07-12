import { DiscountType, ProductImage } from './product';

/**
 * Ground truth from the backend's actual `cartController.js`/`Cart.js` (not
 * `01-DOCUMENTATION.md`, which undersells how populated this response is):
 * `GET /cart` returns each item with `variantId` populated to a full
 * ProductVariant, whose own `productId` is populated to a partial Product.
 * Cart item subdocuments have `_id: false` in the schema — there is no
 * per-item id, so `variantId._id` is the only stable key.
 */
export interface CartItemProduct {
  _id: string;
  name: string;
  slug: string;
  basePrice: number;
  discountType: DiscountType;
  discountValue?: number;
  images: ProductImage[];
}

export interface CartItemVariant {
  _id: string;
  productId: CartItemProduct;
  size: string;
  color: string;
  sku: string;
  price?: number;
  stockQuantity: number;
  imageUrl?: string;
  isDefault?: boolean;
}

export interface CartItem {
  variantId: CartItemVariant;
  quantity: number;
}
