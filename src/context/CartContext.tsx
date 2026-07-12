import { createContext, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as cartApi from '@/api/cart';
import { getGuestItems, setGuestItems, clearGuestItems } from '@/utils/guestStorage';
import { getDiscountedPrice } from '@/utils/pricing';
import { useAuth } from '@/hooks/useAuth';
import { CartItem, CartItemVariant } from '@/types/cart';

const GUEST_CART_KEY = 'ecommerce_guest_cart';

export interface CartContextValue {
  items: CartItem[];
  loading: boolean;
  itemCount: number;
  subtotal: number;
  addItem: (variant: CartItemVariant, quantity?: number) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const CartContext = createContext<CartContextValue | undefined>(undefined);

function computeSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    const variant = item.variantId;
    const price = getDiscountedPrice(
      variant.price ?? variant.productId.basePrice,
      variant.productId.discountType,
      variant.productId.discountValue,
    );
    return sum + price * item.quantity;
  }, 0);
}

async function loadGuestCart(setItems: (items: CartItem[]) => void, setLoading: (loading: boolean) => void) {
  setLoading(true);
  const items = await getGuestItems<CartItem>(GUEST_CART_KEY);
  setItems(items);
  setLoading(false);
}

async function loadServerCart(setItems: (items: CartItem[]) => void, setLoading: (loading: boolean) => void) {
  setLoading(true);
  try {
    const items = await cartApi.getCart();
    setItems(items);
  } catch {
    setItems([]);
  } finally {
    setLoading(false);
  }
}

/**
 * Guest -> logged-in transition only: POST the guest items to `/cart/merge`
 * (server merges quantities additively, capped at stock), clear the guest
 * key, then reload the authoritative server cart (01-DOCUMENTATION.md §7.3).
 */
async function mergeGuestCartIntoServer(
  setItems: (items: CartItem[]) => void,
  setLoading: (loading: boolean) => void,
) {
  setLoading(true);
  try {
    const guestItems = await getGuestItems<CartItem>(GUEST_CART_KEY);
    if (guestItems.length > 0) {
      await cartApi.mergeCart(guestItems.map((item) => ({ variantId: item.variantId._id, quantity: item.quantity })));
      await clearGuestItems(GUEST_CART_KEY);
    }
  } catch {
    // merge failure shouldn't strand the user — still try to load whatever the server has
  }
  try {
    const items = await cartApi.getCart();
    setItems(items);
  } catch {
    setItems([]);
  } finally {
    setLoading(false);
  }
}

/**
 * Guest cart in AsyncStorage, server cart for logged-in users, merge-on-login
 * (02-REACT-NATIVE-PROMPTS.md Prompt 5). `prevUserIdRef` tracks the previous
 * resolved auth state exactly like the web app: only an actual
 * logged-out->logged-in *transition* triggers a merge — not the initial
 * app-launch resolution (which may already be logged in from a prior
 * session) and not a logged-in->logged-out transition (which just reveals
 * the untouched guest key, never overwriting it with the server cart).
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (authLoading) return;
    const currentUserId = user?.id ?? null;
    const prevUserId = prevUserIdRef.current;

    if (prevUserId === undefined) {
      if (currentUserId) loadServerCart(setItems, setLoading);
      else loadGuestCart(setItems, setLoading);
    } else if (!prevUserId && currentUserId) {
      mergeGuestCartIntoServer(setItems, setLoading);
    } else if (currentUserId) {
      loadServerCart(setItems, setLoading);
    } else {
      loadGuestCart(setItems, setLoading);
    }

    prevUserIdRef.current = currentUserId;
  }, [user, authLoading]);

  const refresh = useCallback(async () => {
    if (user) await loadServerCart(setItems, setLoading);
    else await loadGuestCart(setItems, setLoading);
  }, [user]);

  const addItem = useCallback(
    async (variant: CartItemVariant, quantity = 1) => {
      if (user) {
        await cartApi.addCartItem(variant._id, quantity);
        await loadServerCart(setItems, setLoading);
        return;
      }
      const guestItems = await getGuestItems<CartItem>(GUEST_CART_KEY);
      const existing = guestItems.find((item) => item.variantId._id === variant._id);
      const next = existing
        ? guestItems.map((item) =>
            item.variantId._id === variant._id
              ? { ...item, quantity: Math.min(item.quantity + quantity, variant.stockQuantity) }
              : item,
          )
        : [...guestItems, { variantId: variant, quantity: Math.min(quantity, variant.stockQuantity) }];
      await setGuestItems(GUEST_CART_KEY, next);
      setItems(next);
    },
    [user],
  );

  const updateQuantity = useCallback(
    async (variantId: string, quantity: number) => {
      if (user) {
        await cartApi.updateCartItem(variantId, quantity);
        await loadServerCart(setItems, setLoading);
        return;
      }
      const guestItems = await getGuestItems<CartItem>(GUEST_CART_KEY);
      const next = guestItems.map((item) => (item.variantId._id === variantId ? { ...item, quantity } : item));
      await setGuestItems(GUEST_CART_KEY, next);
      setItems(next);
    },
    [user],
  );

  const removeItem = useCallback(
    async (variantId: string) => {
      if (user) {
        await cartApi.removeCartItem(variantId);
        await loadServerCart(setItems, setLoading);
        return;
      }
      const guestItems = await getGuestItems<CartItem>(GUEST_CART_KEY);
      const next = guestItems.filter((item) => item.variantId._id !== variantId);
      await setGuestItems(GUEST_CART_KEY, next);
      setItems(next);
    },
    [user],
  );

  const clearCartFn = useCallback(async () => {
    if (user) {
      await cartApi.clearCart();
    } else {
      await clearGuestItems(GUEST_CART_KEY);
    }
    setItems([]);
  }, [user]);

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const subtotal = useMemo(() => computeSubtotal(items), [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      loading,
      itemCount,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart: clearCartFn,
      refresh,
    }),
    [items, loading, itemCount, subtotal, addItem, updateQuantity, removeItem, clearCartFn, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
