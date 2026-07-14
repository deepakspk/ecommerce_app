import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductSummary } from '@/types/product';
import { useThemeSettings } from '@/hooks/useThemeSettings';
import { ProductCardRail } from './ProductCardRail';
import { colors, spacing } from '@/theme';

interface Props {
  title: string;
  products: ProductSummary[];
  onPressProduct: (slug: string) => void;
  onPressViewAll: () => void;
}

/**
 * Feature-type rail section (docs/PROMPT-home-screen.md §6): white card with a
 * star tile, the feature name, a "View All →" link, and a horizontal rail.
 * Callers must never render this with zero products — empty rails are skipped
 * entirely at the screen level.
 */
export function FeatureSection({ title, products, onPressProduct, onPressViewAll }: Props) {
  const { colors: brand } = useThemeSettings();

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconTile, { backgroundColor: brand.brand50 }]}>
          <Ionicons name="star" size={22} color={brand.brand600} />
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Pressable onPress={onPressViewAll} hitSlop={8}>
          <Text style={[styles.viewAll, { color: brand.brand600 }]}>View All →</Text>
        </Pressable>
      </View>

      <View style={styles.divider} />

      <ProductCardRail products={products} onPressProduct={onPressProduct} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: 16,
    paddingVertical: spacing.lg,
    marginHorizontal: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontSize: 20, fontWeight: '800', color: colors.gray900 },
  viewAll: { fontSize: 13, fontWeight: '700' },
  divider: {
    height: 1,
    backgroundColor: colors.gray100,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
  },
});
