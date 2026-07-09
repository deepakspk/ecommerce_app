import { DiscountType } from '@/types/product';

/**
 * Mirrors the backend's discount-capping formula exactly (01-DOCUMENTATION.md
 * §2.12): PERCENTAGE is `price * value/100`, FIXED is a flat `value`, and
 * either is capped so the discount never exceeds the price itself. Needed
 * on-device because a variant's own `price` override still gets the
 * product's discount applied — the server's precomputed `finalPrice` on a
 * listing card is only for the product's default/cheapest variant. Reused by
 * Cart (02-REACT-NATIVE-PROMPTS.md Prompt 5) for the same math.
 */
export function getDiscountedPrice(
  price: number,
  discountType: DiscountType,
  discountValue?: number,
): number {
  if (!discountType || !discountValue) return price;
  const rawDiscount = discountType === 'PERCENTAGE' ? (price * discountValue) / 100 : discountValue;
  const cappedDiscount = Math.min(rawDiscount, price);
  return Math.round((price - cappedDiscount) * 100) / 100;
}
