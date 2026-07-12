import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OrderItem } from '@/types/order';
import { ReturnRequestItem } from '@/types/return';
import { QuantityStepper } from './QuantityStepper';
import { colors, radius, spacing, typography } from '@/theme';

interface RowState {
  selected: boolean;
  quantity: number;
  reason: string;
}

interface Props {
  items: OrderItem[];
  /** Fires with only the currently-valid (selected, quantity >= 1, reason non-empty) selections. */
  onChange: (selections: ReturnRequestItem[]) => void;
}

/** Checkbox + quantity stepper (capped at ordered quantity) + required reason, per order line item. */
export function ReturnItemPicker({ items, onChange }: Props) {
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(items.map((item) => [item.variantId, { selected: false, quantity: 1, reason: '' }])),
  );

  useEffect(() => {
    const selections: ReturnRequestItem[] = Object.entries(rows)
      .filter(([, row]) => row.selected && row.quantity >= 1 && row.reason.trim())
      .map(([variantId, row]) => ({ variantId, quantity: row.quantity, reason: row.reason.trim() }));
    onChange(selections);
  }, [rows, onChange]);

  const updateRow = (variantId: string, patch: Partial<RowState>) => {
    setRows((prev) => ({ ...prev, [variantId]: { ...prev[variantId], ...patch } }));
  };

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const row = rows[item.variantId];
        const label = [item.size, item.color].filter((v) => v && v !== 'Default').join(' / ');
        return (
          <View key={item.variantId} style={styles.row}>
            <Pressable style={styles.checkboxRow} onPress={() => updateRow(item.variantId, { selected: !row.selected })}>
              <Ionicons
                name={row.selected ? 'checkbox' : 'square-outline'}
                size={20}
                color={row.selected ? colors.brand600 : colors.gray400}
              />
              <View style={styles.itemInfo}>
                <Text style={typography.h3} numberOfLines={1}>
                  {item.productName}
                </Text>
                {label ? <Text style={typography.muted}>{label}</Text> : null}
                <Text style={typography.muted}>Ordered: {item.quantity}</Text>
              </View>
            </Pressable>

            {row.selected ? (
              <View style={styles.details}>
                <View style={styles.quantityRow}>
                  <Text style={typography.label}>Quantity to return</Text>
                  <QuantityStepper
                    quantity={row.quantity}
                    max={item.quantity}
                    onChange={(quantity) => updateRow(item.variantId, { quantity })}
                  />
                </View>
                <TextInput
                  style={styles.reasonInput}
                  value={row.reason}
                  onChangeText={(reason) => updateRow(item.variantId, { reason })}
                  placeholder="Reason for return (required)"
                  placeholderTextColor={colors.gray400}
                  multiline
                />
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  row: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  checkboxRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  itemInfo: { flex: 1, gap: 2 },
  details: { gap: spacing.sm, paddingLeft: spacing.xl },
  quantityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reasonInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: 13,
    minHeight: 50,
    textAlignVertical: 'top',
  },
});
