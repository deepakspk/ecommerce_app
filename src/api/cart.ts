import { apiClient, apiGet } from './client';
import { CartItem } from '@/types/cart';

export function getCart() {
  return apiGet<{ items: CartItem[] }>('/cart').then((data) => data.items);
}

export function addCartItem(variantId: string, quantity = 1) {
  return apiClient
    .post<{ message: string; itemCount: number }>('/cart/items', { variantId, quantity })
    .then((res) => res.data);
}

export function updateCartItem(variantId: string, quantity: number) {
  return apiClient.put<{ message: string }>(`/cart/items/${variantId}`, { quantity }).then((res) => res.data);
}

export function removeCartItem(variantId: string) {
  return apiClient.delete<{ message: string }>(`/cart/items/${variantId}`).then((res) => res.data);
}

export function clearCart() {
  return apiClient.delete<{ message: string }>('/cart').then((res) => res.data);
}

export function mergeCart(items: { variantId: string; quantity: number }[]) {
  return apiClient.post<{ message: string }>('/cart/merge', { items }).then((res) => res.data);
}

export interface ApplyCouponResponse {
  code: string;
  subtotal: number;
  discountAmount: number;
  total: number;
}

/** Preview only — nothing is persisted until `POST /orders` re-validates it (01-DOCUMENTATION.md §2.10/§2.12). */
export function applyCoupon(code: string) {
  return apiClient.post<ApplyCouponResponse>('/cart/apply-coupon', { code }).then((res) => res.data);
}
