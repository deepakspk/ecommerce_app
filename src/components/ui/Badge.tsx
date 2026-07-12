import { StyleSheet, Text, View } from 'react-native';
import { OrderStatus, PaymentStatus } from '@/types/order';
import { ReturnRequestStatus } from '@/types/return';
import { colors, radius, spacing } from '@/theme';

export type BadgeKind = 'order' | 'payment' | 'return';
export type BadgeStatus = OrderStatus | PaymentStatus | ReturnRequestStatus;

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

const RETURN_STATUS_COLORS: Record<ReturnRequestStatus, { bg: string; fg: string }> = {
  REQUESTED: { bg: colors.gray100, fg: colors.gray700 },
  APPROVED: { bg: colors.info50, fg: colors.info700 },
  PICKED_UP: { bg: colors.warning50, fg: colors.warning700 },
  REFUNDED: { bg: colors.success50, fg: colors.success700 },
  REJECTED: { bg: colors.danger50, fg: colors.danger700 },
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
  REQUESTED: 'Requested',
  APPROVED: 'Approved',
  PICKED_UP: 'Picked Up',
  REJECTED: 'Rejected',
};

interface Props {
  kind: BadgeKind;
  status: BadgeStatus;
}

const COLOR_MAPS: Record<BadgeKind, Record<string, { bg: string; fg: string }>> = {
  order: ORDER_STATUS_COLORS,
  payment: PAYMENT_STATUS_COLORS,
  return: RETURN_STATUS_COLORS,
};

/**
 * Reads one consolidated status->color map per kind (order/payment/return) —
 * mirrors the web app's `ui.js` `ORDER_STATUS_COLORS`/`PAYMENT_STATUS_COLORS`/
 * `RETURN_STATUS_COLORS` approach, formalized as a single shared component
 * (02-REACT-NATIVE-PROMPTS.md Prompt 9). Supersedes the `kind: 'order'|'payment'`-
 * only `OrderStatusBadge` built ad hoc in Prompt 7.
 */
export function Badge({ kind, status }: Props) {
  const palette = COLOR_MAPS[kind][status];

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
