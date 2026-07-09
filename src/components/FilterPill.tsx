import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '@/theme';

interface Props {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

/** Generic toggle pill — category chips, filter options, sort options, variant options. */
export function FilterPill({ label, selected = false, disabled = false, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.pill, selected && styles.pillSelected, disabled && styles.pillDisabled]}
    >
      <Text
        style={[styles.label, selected && styles.labelSelected, disabled && styles.labelDisabled]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
  },
  pillSelected: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  pillDisabled: { opacity: 0.4 },
  label: { fontSize: 13, color: colors.gray700, fontWeight: '500' },
  labelSelected: { color: colors.white },
  labelDisabled: { color: colors.gray400 },
});
