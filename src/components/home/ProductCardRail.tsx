import { ReactElement } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { ProductSummary } from '@/types/product';
import { ProductCard } from '@/components/ProductCard';
import { spacing } from '@/theme';

export const RAIL_CARD_WIDTH = 160;
const GAP = spacing.md;

interface Props {
  products: ProductSummary[];
  onPressProduct: (slug: string) => void;
  /** Optional trailing tile (e.g. the campaign "+N more deals" card). */
  footer?: ReactElement | null;
}

/** Shared horizontal rail spec — snap scrolling, 160-wide cards, gap 12 (docs/PROMPT-home-screen.md §Horizontal product rail). */
export function ProductCardRail({ products, onPressProduct, footer }: Props) {
  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item._id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      snapToInterval={RAIL_CARD_WIDTH + GAP}
      decelerationRate="fast"
      initialNumToRender={4}
      windowSize={5}
      renderItem={({ item }) => (
        <ProductCard product={item} onPress={() => onPressProduct(item.slug)} width={RAIL_CARD_WIDTH} />
      )}
      ListFooterComponent={footer}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: GAP },
});
