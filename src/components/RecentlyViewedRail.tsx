import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getProductBySlug } from '@/api/products';
import { getRecentlyViewedSlugs, removeRecentlyViewed } from '@/utils/recentlyViewed';
import { getStatusCode } from '@/utils/errorHelpers';
import { ProductSummary } from '@/types/product';
import { ProductRail } from './ProductRail';

interface Props {
  /** Hide the current product on its own detail page. */
  excludeSlug?: string;
  onPressProduct: (slug: string) => void;
}

/**
 * Real implementation now that ProductDetail exists to populate it
 * (02-REACT-NATIVE-PROMPTS.md Prompt 3/4). Refetches on focus so a rail on
 * Home or another product's page reflects the latest browsing. A stale slug
 * (404 — deleted/deactivated product) is dropped from storage silently
 * rather than showing a broken tile (01-DOCUMENTATION.md §2.4).
 */
export function RecentlyViewedRail({ excludeSlug, onPressProduct }: Props) {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        const slugs = (await getRecentlyViewedSlugs()).filter((slug) => slug !== excludeSlug);
        const results = await Promise.allSettled(slugs.map((slug) => getProductBySlug(slug)));

        const valid: ProductSummary[] = [];
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            valid.push(result.value.product);
          } else if (getStatusCode(result.reason) === 404) {
            removeRecentlyViewed(slugs[index]);
          }
        });

        if (!cancelled) {
          setProducts(valid);
          setLoaded(true);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [excludeSlug]),
  );

  if (!loaded || products.length === 0) return null;

  return (
    <ProductRail title="Recently Viewed" products={products} onPressProduct={onPressProduct} />
  );
}
