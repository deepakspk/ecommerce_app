import { apiClient } from './client';
import { WishlistItem } from '@/types/wishlist';

export function getWishlist() {
  return apiClient.get<{ items: WishlistItem[] }>('/wishlist').then((res) => res.data.items);
}

export function addWishlistItem(productId: string) {
  return apiClient
    .post<{ message: string; itemCount: number }>('/wishlist/items', { productId })
    .then((res) => res.data);
}

export function removeWishlistItem(productId: string) {
  return apiClient.delete<{ message: string }>(`/wishlist/items/${productId}`).then((res) => res.data);
}

export function clearWishlist() {
  return apiClient.delete<{ message: string }>('/wishlist').then((res) => res.data);
}

export function mergeWishlist(items: { productId: string }[]) {
  return apiClient.post<{ message: string }>('/wishlist/merge', { items }).then((res) => res.data);
}
