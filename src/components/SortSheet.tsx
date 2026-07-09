import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SortOption } from '@/api/products';
import { colors, radius, spacing, typography } from '@/theme';

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
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
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
            {value === opt.value ? (
              <Ionicons name="checkmark" size={18} color={colors.brand600} />
            ) : null}
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
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
