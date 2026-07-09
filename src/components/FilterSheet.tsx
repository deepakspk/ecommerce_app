import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AvailableFilters } from '@/api/products';
import { FilterPill } from './FilterPill';
import { colors, spacing, typography } from '@/theme';

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

/** A simple full-screen `Modal` sheet — no heavy bottom-sheet library needed at this scope. */
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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.h2}>Filters</Text>

        <View style={styles.section}>
          <Text style={typography.label}>Price range</Text>
          <View style={styles.priceRow}>
            <TextInput
              style={styles.priceInput}
              value={minPrice}
              onChangeText={setMinPrice}
              keyboardType="numeric"
              placeholder={availableFilters ? `Min ${availableFilters.priceMin}` : 'Min'}
              placeholderTextColor={colors.gray400}
            />
            <Text style={typography.muted}>to</Text>
            <TextInput
              style={styles.priceInput}
              value={maxPrice}
              onChangeText={setMaxPrice}
              keyboardType="numeric"
              placeholder={availableFilters ? `Max ${availableFilters.priceMax}` : 'Max'}
              placeholderTextColor={colors.gray400}
            />
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
          <Pressable style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
          <Pressable style={styles.applyBtn} onPress={handleApply}>
            <Text style={styles.applyText}>Apply</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg },
  section: { gap: spacing.sm },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.gray900,
  },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  resetBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  resetText: { color: colors.gray700, fontWeight: '600' },
  applyBtn: {
    flex: 2,
    backgroundColor: colors.brand600,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  applyText: { color: colors.white, fontWeight: '600' },
});
