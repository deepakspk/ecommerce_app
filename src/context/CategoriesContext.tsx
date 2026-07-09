import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { getCategoryTree } from '@/api/categories';
import { Category } from '@/types/category';

export interface CategoriesContextValue {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const CategoriesContext = createContext<CategoriesContextValue | undefined>(undefined);

async function fetchCategories(
  setCategories: (categories: Category[]) => void,
  setError: (error: string | null) => void,
  setLoading: (loading: boolean) => void,
) {
  try {
    const tree = await getCategoryTree();
    setCategories(tree);
    setError(null);
  } catch {
    setError('Failed to load categories');
  } finally {
    setLoading(false);
  }
}

/**
 * Fetched once on mount, shared everywhere via `useCategories()` — Home, the
 * Categories tab, and any future category picker all read the same tree
 * instead of each fetching their own copy (01-DOCUMENTATION.md §9).
 */
export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => fetchCategories(setCategories, setError, setLoading), []);

  useEffect(() => {
    fetchCategories(setCategories, setError, setLoading);
  }, []);

  const value = useMemo(
    () => ({ categories, loading, error, refresh }),
    [categories, loading, error, refresh],
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}
