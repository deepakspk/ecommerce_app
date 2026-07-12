import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SortOption } from '@/api/products';
import { BottomSheet } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  value: SortOption;
  onChange: (sort: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

export function SortSheet({ visible, onClose, value, onChange }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={[typography.h2, styles.title]}>Sort by</Text>
      {SORT_OPTIONS.map((opt) => (
        <Pressable
          key={opt.value}
          style={styles.option}
          onPress={() => {
            onChange(opt.value);
            onClose();
          }}
        >
          <Text style={typography.body}>{opt.label}</Text>
          {value === opt.value ? <Ionicons name="checkmark" size={18} color={colors.brand600} /> : null}
        </Pressable>
      ))}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.sm },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
});
