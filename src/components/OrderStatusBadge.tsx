import { StyleSheet, Text, View } from 'react-native';
import { OrderStatus, PaymentStatus } from '@/types/order';
import { colors, radius, spacing } from '@/theme';

const ORDER_STATUS_COLORS: Record<OrderStatus, { bg: string; fg: string }> = {
  PENDING: { bg: colors.gray100, fg: colors.gray700 },
  CONFIRMED: { bg: colors.info50, fg: colors.info700 },
  PACKED: { bg: colors.info50, fg: colors.info700 },
  PICKED: { bg: colors.info50, fg: colors.info700 },
  SHIPPED: { bg: colors.warning50, fg: colors.warning700 },
  ARRIVED: { bg: colors.warning50, fg: colors.warning700 },
  OUT_FOR_DELIVERY: { bg: colors.warning50, fg: colors.warning700 },
  DELIVERED: { bg: colors.success50, fg: colors.success700 },
  CANCELLED: { bg: colors.danger50, fg: colors.danger700 },
};

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, { bg: string; fg: string }> = {
  PENDING: { bg: colors.gray100, fg: colors.gray700 },
  PAID: { bg: colors.success50, fg: colors.success700 },
  FAILED: { bg: colors.danger50, fg: colors.danger700 },
  REFUNDED: { bg: colors.info50, fg: colors.info700 },
};

const LABELS: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PACKED: 'Packed',
  PICKED: 'Picked',
  SHIPPED: 'Shipped',
  ARRIVED: 'Arrived',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
};

interface Props {
  kind: 'order' | 'payment';
  status: OrderStatus | PaymentStatus;
}

/** Reads one consolidated status->color map per kind — mirrors the web app's `ui.js` approach (formalized as a shared component in Prompt 9). */
export function OrderStatusBadge({ kind, status }: Props) {
  const palette =
    kind === 'order' ? ORDER_STATUS_COLORS[status as OrderStatus] : PAYMENT_STATUS_COLORS[status as PaymentStatus];

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.fg }]}>{LABELS[status] ?? status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  text: { fontSize: 11, fontWeight: '700' },
});
