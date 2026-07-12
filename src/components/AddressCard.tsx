import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Address } from '@/types/address';
import { Card } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';

interface Props {
  address: Address;
  selected?: boolean;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
}

function formatAddressLine(address: Address): string {
  const parts =
    address.country === 'Nepal'
      ? [address.area, address.city, address.district, address.province]
      : [address.area, address.street, address.city, address.country];
  return parts.filter(Boolean).join(', ');
}

export function AddressCard({ address, selected, onPress, onEdit, onDelete, onSetDefault }: Props) {
  return (
    <Card selected={selected} onPress={onPress}>
      <View style={styles.header}>
        <Text style={typography.h3}>{address.label || address.recipientName}</Text>
        {address.isDefault ? (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>Default</Text>
          </View>
        ) : null}
        {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.brand600} /> : null}
      </View>
      <Text style={typography.body}>{address.recipientName}</Text>
      <Text style={typography.muted}>{address.phone}</Text>
      <Text style={typography.muted}>{formatAddressLine(address)}</Text>
      {address.branchName ? <Text style={typography.muted}>Branch: {address.branchName}</Text> : null}

      {onEdit || onDelete || onSetDefault ? (
        <View style={styles.actionsRow}>
          {onSetDefault && !address.isDefault ? (
            <Pressable onPress={onSetDefault} hitSlop={8}>
              <Text style={styles.actionText}>Set Default</Text>
            </Pressable>
          ) : null}
          {onEdit ? (
            <Pressable onPress={onEdit} hitSlop={8}>
              <Text style={styles.actionText}>Edit</Text>
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable onPress={onDelete} hitSlop={8}>
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  defaultBadge: {
    backgroundColor: colors.success100,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  defaultBadgeText: { fontSize: 10, fontWeight: '700', color: colors.success700 },
  actionsRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xs },
  actionText: { color: colors.brand600, fontSize: 13, fontWeight: '600' },
  deleteText: { color: colors.danger600, fontSize: 13, fontWeight: '600' },
});
