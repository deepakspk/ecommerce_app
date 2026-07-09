import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Ports the web app's `ecommerce_recently_viewed` localStorage logic
 * (01-DOCUMENTATION.md §2.4) to `AsyncStorage` — non-sensitive, purely a UX
 * list of slugs, so `expo-secure-store` (reserved for the auth token) isn't
 * needed here. Stores bare slugs, not denormalized product data: catalog
 * data is never cached in this app (01-DOCUMENTATION.md §9's caching table),
 * so the rail always fetches each slug fresh and silently drops any that
 * 404 (a deleted/deactivated product).
 */
const KEY = 'ecommerce_recently_viewed';
const MAX_ITEMS = 10;

export async function getRecentlyViewedSlugs(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export async function addRecentlyViewed(slug: string): Promise<void> {
  const existing = await getRecentlyViewedSlugs();
  const next = [slug, ...existing.filter((s) => s !== slug)].slice(0, MAX_ITEMS);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // best-effort — a failed write just means the rail is missing one entry
  }
}

export async function removeRecentlyViewed(slug: string): Promise<void> {
  const existing = await getRecentlyViewedSlugs();
  const next = existing.filter((s) => s !== slug);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // best-effort
  }
}
