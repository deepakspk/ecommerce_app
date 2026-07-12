import { createContext, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as wishlistApi from '@/api/wishlist';
import { getGuestItems, setGuestItems, clearGuestItems } from '@/utils/guestStorage';
import { useAuth } from '@/hooks/useAuth';
import { WishlistItem, WishlistItemProduct } from '@/types/wishlist';

const GUEST_WISHLIST_KEY = 'ecommerce_guest_wishlist';

export interface WishlistContextValue {
  items: WishlistItem[];
  loading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggleItem: (product: WishlistItemProduct) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

async function loadGuestWishlist(
  setItems: (items: WishlistItem[]) => void,
  setLoading: (loading: boolean) => void,
) {
  setLoading(true);
  const items = await getGuestItems<WishlistItem>(GUEST_WISHLIST_KEY);
  setItems(items);
  setLoading(false);
}

async function loadServerWishlist(
  setItems: (items: WishlistItem[]) => void,
  setLoading: (loading: boolean) => void,
) {
  setLoading(true);
  try {
    const items = await wishlistApi.getWishlist();
    setItems(items);
  } catch {
    setItems([]);
  } finally {
    setLoading(false);
  }
}

/** Additive-only merge (existence union), no quantity concept — mirrors Cart's merge pattern (01-DOCUMENTATION.md §2.7). */
async function mergeGuestWishlistIntoServer(
  setItems: (items: WishlistItem[]) => void,
  setLoading: (loading: boolean) => void,
) {
  setLoading(true);
  try {
    const guestItems = await getGuestItems<WishlistItem>(GUEST_WISHLIST_KEY);
    if (guestItems.length > 0) {
      await wishlistApi.mergeWishlist(guestItems.map((item) => ({ productId: item.productId._id })));
      await clearGuestItems(GUEST_WISHLIST_KEY);
    }
  } catch {
    // merge failure shouldn't strand the user — still try to load whatever the server has
  }
  try {
    const items = await wishlistApi.getWishlist();
    setItems(items);
  } catch {
    setItems([]);
  } finally {
    setLoading(false);
  }
}

/** Identical shape/pattern to CartContext — see its comments for the merge-transition logic. */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (authLoading) return;
    const currentUserId = user?.id ?? null;
    const prevUserId = prevUserIdRef.current;

    if (prevUserId === undefined) {
      if (currentUserId) loadServerWishlist(setItems, setLoading);
      else loadGuestWishlist(setItems, setLoading);
    } else if (!prevUserId && currentUserId) {
      mergeGuestWishlistIntoServer(setItems, setLoading);
    } else if (currentUserId) {
      loadServerWishlist(setItems, setLoading);
    } else {
      loadGuestWishlist(setItems, setLoading);
    }

    prevUserIdRef.current = currentUserId;
  }, [user, authLoading]);

  const refresh = useCallback(async () => {
    if (user) await loadServerWishlist(setItems, setLoading);
    else await loadGuestWishlist(setItems, setLoading);
  }, [user]);

  const isWishlisted = useCallback(
    (productId: string) => items.some((item) => item.productId._id === productId),
    [items],
  );

  const toggleItem = useCallback(
    async (product: WishlistItemProduct) => {
      const wishlisted = items.some((item) => item.productId._id === product._id);
      if (user) {
        if (wishlisted) await wishlistApi.removeWishlistItem(product._id);
        else await wishlistApi.addWishlistItem(product._id);
        await loadServerWishlist(setItems, setLoading);
        return;
      }
      const guestItems = await getGuestItems<WishlistItem>(GUEST_WISHLIST_KEY);
      const next = wishlisted
        ? guestItems.filter((item) => item.productId._id !== product._id)
        : [...guestItems, { productId: product }];
      await setGuestItems(GUEST_WISHLIST_KEY, next);
      setItems(next);
    },
    [items, user],
  );

  const removeItemFn = useCallback(
    async (productId: string) => {
      if (user) {
        await wishlistApi.removeWishlistItem(productId);
        await loadServerWishlist(setItems, setLoading);
        return;
      }
      const guestItems = await getGuestItems<WishlistItem>(GUEST_WISHLIST_KEY);
      const next = guestItems.filter((item) => item.productId._id !== productId);
      await setGuestItems(GUEST_WISHLIST_KEY, next);
      setItems(next);
    },
    [user],
  );

  const clearWishlistFn = useCallback(async () => {
    if (user) {
      await wishlistApi.clearWishlist();
    } else {
      await clearGuestItems(GUEST_WISHLIST_KEY);
    }
    setItems([]);
  }, [user]);

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      loading,
      isWishlisted,
      toggleItem,
      removeItem: removeItemFn,
      clearWishlist: clearWishlistFn,
      refresh,
    }),
    [items, loading, isWishlisted, toggleItem, removeItemFn, clearWishlistFn, refresh],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
