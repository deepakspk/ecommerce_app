import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/theme';

export type SelectablePaymentMethod = 'COD' | 'KHALTI' | 'ESEWA';

interface Props {
  value: SelectablePaymentMethod;
  onChange: (method: SelectablePaymentMethod) => void;
  /** International addresses hide the picker entirely — server forces `MANUAL` (01-DOCUMENTATION.md §2.10/§2.11). */
  isInternational: boolean;
}

const OPTIONS: { value: SelectablePaymentMethod; label: string }[] = [
  { value: 'COD', label: 'Cash on Delivery' },
  { value: 'KHALTI', label: 'Khalti' },
  { value: 'ESEWA', label: 'eSewa' },
];

export function PaymentMethodPicker({ value, onChange, isInternational }: Props) {
  if (isInternational) {
    return (
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={18} color={colors.info600} />
        <Text style={styles.infoText}>Our team will contact you to arrange payment for international orders.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {OPTIONS.map((opt) => (
        <Pressable key={opt.value} style={styles.row} onPress={() => onChange(opt.value)}>
          <Ionicons
            name={value === opt.value ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color={value === opt.value ? colors.brand600 : colors.gray400}
          />
          <Text style={typography.body}>{opt.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.info50,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, color: colors.info700, fontSize: 13 },
});
