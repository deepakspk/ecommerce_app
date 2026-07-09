import { StyleSheet, Text, View } from 'react-native';
import { ProductVariant } from '@/types/variant';
import { FilterPill } from './FilterPill';
import { spacing, typography } from '@/theme';

interface Props {
  variants: ProductVariant[];
  selectedSize?: string;
  selectedColor?: string;
  onSelectSize: (size: string) => void;
  onSelectColor: (color: string) => void;
}

/**
 * Shows, but flags out-of-stock: a color option is grayed out once selecting
 * it (given the currently chosen size) would resolve to a variant with 0
 * stock, and vice versa (01-DOCUMENTATION.md §2.4 mobile mirror).
 */
function isOptionInStock(
  variants: ProductVariant[],
  axis: 'size' | 'color',
  value: string,
  otherAxisValue?: string,
) {
  return variants.some((v) => {
    const matchesThisAxis = axis === 'size' ? v.size === value : v.color === value;
    if (!matchesThisAxis) return false;
    if (otherAxisValue !== undefined) {
      const matchesOtherAxis =
        axis === 'size' ? v.color === otherAxisValue : v.size === otherAxisValue;
      if (!matchesOtherAxis) return false;
    }
    return v.stockQuantity > 0;
  });
}

export function VariantPicker({
  variants,
  selectedSize,
  selectedColor,
  onSelectSize,
  onSelectColor,
}: Props) {
  const sizes = Array.from(new Set(variants.map((v) => v.size))).filter((s) => s !== 'Default');
  const colorOptions = Array.from(new Set(variants.map((v) => v.color))).filter(
    (c) => c !== 'Default',
  );

  return (
    <View style={styles.container}>
      {sizes.length > 0 ? (
        <View style={styles.row}>
          <Text style={typography.label}>Size</Text>
          <View style={styles.pills}>
            {sizes.map((size) => (
              <FilterPill
                key={size}
                label={size}
                selected={selectedSize === size}
                disabled={!isOptionInStock(variants, 'size', size, selectedColor)}
                onPress={() => onSelectSize(size)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {colorOptions.length > 0 ? (
        <View style={styles.row}>
          <Text style={typography.label}>Color</Text>
          <View style={styles.pills}>
            {colorOptions.map((color) => (
              <FilterPill
                key={color}
                label={color}
                selected={selectedColor === color}
                disabled={!isOptionInStock(variants, 'color', color, selectedSize)}
                onPress={() => onSelectColor(color)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  row: { gap: spacing.xs },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
