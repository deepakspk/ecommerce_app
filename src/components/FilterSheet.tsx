import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AvailableFilters } from '@/api/products';
import { FilterPill } from './FilterPill';
import { Button, Input, Modal } from '@/components/ui';
import { spacing, typography } from '@/theme';

export interface FilterValue {
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  availableFilters: AvailableFilters | null;
  value: FilterValue;
  onApply: (next: FilterValue) => void;
}

const RATING_OPTIONS = [4, 3, 2, 1];

/** Full-screen page-sheet built on the shared `Modal` chrome — no heavy bottom-sheet library needed at this scope. */
export function FilterSheet({ visible, onClose, availableFilters, value, onApply }: Props) {
  const [size, setSize] = useState(value.size);
  const [color, setColor] = useState(value.color);
  const [minPrice, setMinPrice] = useState(value.minPrice?.toString() ?? '');
  const [maxPrice, setMaxPrice] = useState(value.maxPrice?.toString() ?? '');
  const [minRating, setMinRating] = useState(value.minRating);

  // Re-sync the form to `value` on the closed->open transition, adjusted
  // during render (React's recommended alternative to an effect for syncing
  // state to a prop change) rather than after a commit.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setSize(value.size);
      setColor(value.color);
      setMinPrice(value.minPrice?.toString() ?? '');
      setMaxPrice(value.maxPrice?.toString() ?? '');
      setMinRating(value.minRating);
    }
  }

  const handleApply = () => {
    onApply({
      size,
      color,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minRating,
    });
    onClose();
  };

  const handleReset = () => {
    setSize(undefined);
    setColor(undefined);
    setMinPrice('');
    setMaxPrice('');
    setMinRating(undefined);
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Filters">
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.section}>
          <Text style={typography.label}>Price range</Text>
          <View style={styles.priceRow}>
            <View style={styles.priceInputWrap}>
              <Input
                value={minPrice}
                onChangeText={setMinPrice}
                keyboardType="numeric"
                placeholder={availableFilters ? `Min ${availableFilters.priceMin}` : 'Min'}
              />
            </View>
            <Text style={typography.muted}>to</Text>
            <View style={styles.priceInputWrap}>
              <Input
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="numeric"
                placeholder={availableFilters ? `Max ${availableFilters.priceMax}` : 'Max'}
              />
            </View>
          </View>
        </View>

        {availableFilters && availableFilters.sizes.length > 0 ? (
          <View style={styles.section}>
            <Text style={typography.label}>Size</Text>
            <View style={styles.pills}>
              {availableFilters.sizes.map((s) => (
                <FilterPill
                  key={s}
                  label={s}
                  selected={size === s}
                  onPress={() => setSize(size === s ? undefined : s)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {availableFilters && availableFilters.colors.length > 0 ? (
          <View style={styles.section}>
            <Text style={typography.label}>Color</Text>
            <View style={styles.pills}>
              {availableFilters.colors.map((c) => (
                <FilterPill
                  key={c}
                  label={c}
                  selected={color === c}
                  onPress={() => setColor(color === c ? undefined : c)}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={typography.label}>Minimum rating</Text>
          <View style={styles.pills}>
            {RATING_OPTIONS.map((r) => (
              <FilterPill
                key={r}
                label={`${r}★+`}
                selected={minRating === r}
                onPress={() => setMinRating(minRating === r ? undefined : r)}
              />
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <Button title="Reset" variant="secondary" onPress={handleReset} style={styles.resetBtn} />
          <Button title="Apply" onPress={handleApply} style={styles.applyBtn} />
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg },
  section: { gap: spacing.sm },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  priceInputWrap: { flex: 1 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  resetBtn: { flex: 1 },
  applyBtn: { flex: 2 },
});
