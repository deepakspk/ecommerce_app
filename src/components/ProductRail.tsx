import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductSummary } from '@/types/product';
import { ProductCard } from './ProductCard';
import { colors, spacing, typography } from '@/theme';

interface Props {
  title: string;
  products: ProductSummary[];
  onPressProduct: (slug: string) => void;
  onSeeAll?: () => void;
}

export function ProductRail({ title, products, onPressProduct, onSeeAll }: Props) {
  if (products.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="flash-outline" size={18} color={colors.brand600} />
          <Text style={typography.h2}>{title}</Text>
        </View>
        {onSeeAll ? (
          <Pressable onPress={onSeeAll} hitSlop={8}>
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        ) : null}
      </View>
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={() => onPressProduct(item.slug)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  seeAll: { color: colors.brand600, fontSize: 13, fontWeight: '600' },
  list: { paddingHorizontal: spacing.lg, gap: spacing.md },
});
