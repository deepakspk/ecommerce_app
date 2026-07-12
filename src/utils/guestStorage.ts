import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Shared guest-storage primitive for Cart and Wishlist — both are
 * denormalized arrays (variant+product / product snapshots) cached under
 * their own AsyncStorage key while logged out (01-DOCUMENTATION.md §7.3).
 * Non-sensitive shopping data, so `AsyncStorage` is correct here — secure
 * store is reserved for the auth token only (Prompt 1's decision table).
 */
export async function getGuestItems<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export async function setGuestItems<T>(key: string, items: T[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(items));
  } catch {
    // best-effort — a failed write just means the next read falls back to []
  }
}

export async function clearGuestItems(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // best-effort
  }
}
