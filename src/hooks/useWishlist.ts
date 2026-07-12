import { useContext } from 'react';
import { WishlistContext, WishlistContextValue } from '@/context/WishlistContext';

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
}
