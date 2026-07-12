import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OrderStatus } from '@/types/order';
import { colors, spacing, typography } from '@/theme';

/** Forward-only sequence — `CANCELLED` is a terminal branch, not a step in this line (01-DOCUMENTATION.md §5/§7.1). */
const SEQUENCE: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PACKED',
  'PICKED',
  'SHIPPED',
  'ARRIVED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

const LABELS: Record<OrderStatus, string> = {
  PENDING: 'Order Placed',
  CONFIRMED: 'Confirmed',
  PACKED: 'Packed',
  PICKED: 'Picked Up',
  SHIPPED: 'Shipped',
  ARRIVED: 'Arrived at Hub',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

interface Props {
  status: OrderStatus;
}

/** A simple vertical stepper — no need for granular courier tracking events (those are admin/Shipment detail, 01-DOCUMENTATION.md §7.1). */
export function OrderTimeline({ status }: Props) {
  if (status === 'CANCELLED') {
    return (
      <View style={styles.cancelledRow}>
        <Ionicons name="close-circle" size={20} color={colors.danger600} />
        <Text style={styles.cancelledText}>Order Cancelled</Text>
      </View>
    );
  }

  const currentIndex = SEQUENCE.indexOf(status);

  return (
    <View>
      {SEQUENCE.map((step, index) => {
        const reached = index <= currentIndex;
        const isLast = index === SEQUENCE.length - 1;
        return (
          <View key={step} style={styles.row}>
            <View style={styles.indicatorColumn}>
              <Ionicons
                name={reached ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={reached ? colors.brand600 : colors.gray300}
              />
              {!isLast ? <View style={[styles.line, reached && index < currentIndex && styles.lineActive]} /> : null}
            </View>
            <Text style={[typography.body, reached ? styles.labelActive : styles.labelInactive]}>{LABELS[step]}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  indicatorColumn: { alignItems: 'center', width: 18 },
  line: { width: 2, flex: 1, minHeight: 18, backgroundColor: colors.gray200 },
  lineActive: { backgroundColor: colors.brand600 },
  labelActive: { color: colors.gray900, fontWeight: '600', paddingBottom: spacing.md },
  labelInactive: { color: colors.gray400, paddingBottom: spacing.md },
  cancelledRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cancelledText: { color: colors.danger700, fontWeight: '600' },
});
