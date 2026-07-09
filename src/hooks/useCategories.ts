import { useContext } from 'react';
import { CategoriesContext, CategoriesContextValue } from '@/context/CategoriesContext';

export function useCategories(): CategoriesContextValue {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategories must be used within a CategoriesProvider');
  return ctx;
}
