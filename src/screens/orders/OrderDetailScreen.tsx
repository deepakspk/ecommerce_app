import { useCallback, useState } from 'react';
import { NavigationProp, RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartStackParamList } from '@/navigation/types';
import { getOrder, cancelOrder, getReturnRequests } from '@/api/orders';
import { initiateKhalti, initiateEsewa } from '@/api/payments';
import { downloadInvoice } from '@/utils/downloadInvoice';
import { getErrorMessage } from '@/utils/errorHelpers';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import { OrderTimeline } from '@/components/OrderTimeline';
import { EmptyState } from '@/components/EmptyState';
import { Order } from '@/types/order';
import { ACTIVE_RETURN_STATUSES, ReturnRequest } from '@/types/return';
import { colors, radius, spacing, typography } from '@/theme';

type FetchState = 'loading' | 'ready' | 'error';

const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED'];
const RETRYABLE_PAYMENT_STATUSES = ['PENDING', 'FAILED'];

async function fetchOrder(orderId: string, setOrder: (order: Order) => void, setState: (state: FetchState) => void) {
  setState('loading');
  try {
    const order = await getOrder(orderId);
    setOrder(order);
    setState('ready');
  } catch {
    setState('error');
  }
}

async function fetchReturnRequests(orderId: string, setReturnRequests: (requests: ReturnRequest[]) => void) {
  try {
    const requests = await getReturnRequests(orderId);
    setReturnRequests(requests);
  } catch {
    setReturnRequests([]);
  }
}

/**
 * Full item/price/address/payment breakdown, timeline, and eligibility-gated
 * actions (Download Invoice / Cancel / Retry Payment / Request Return) —
 * eligibility is computed client-side from data already on the order,
 * mirroring the server's rules exactly rather than guessing
 * (02-REACT-NATIVE-PROMPTS.md Prompt 7).
 */
export function OrderDetailScreen() {
  const route = useRoute<RouteProp<CartStackParamList, 'OrderDetail'>>();
  const navigation = useNavigation<NavigationProp<CartStackParamList>>();
  const { orderId } = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [orderState, setOrderState] = useState<FetchState>('loading');
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);

  const [cancelling, setCancelling] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchOrder(orderId, setOrder, setOrderState);
      fetchReturnRequests(orderId, setReturnRequests);
    }, [orderId]),
  );

  const activeReturnRequest = returnRequests.find((r) => ACTIVE_RETURN_STATUSES.includes(r.status));

  const handleCancel = useCallback(() => {
    Alert.alert('Cancel order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          setActionError(null);
          setCancelling(true);
          try {
            await cancelOrder(orderId);
            fetchOrder(orderId, setOrder, setOrderState);
          } catch (err) {
            setActionError(getErrorMessage(err));
            fetchOrder(orderId, setOrder, setOrderState);
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  }, [orderId]);

  const handleDownloadInvoice = useCallback(async () => {
    setActionError(null);
    setDownloadingInvoice(true);
    try {
      await downloadInvoice(orderId);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setDownloadingInvoice(false);
    }
  }, [orderId]);

  const handleRetryPayment = useCallback(async () => {
    if (!order) return;
    setActionError(null);
    setRetryingPayment(true);
    try {
      if (order.paymentMethod === 'KHALTI') {
        const { paymentUrl } = await initiateKhalti(order._id);
        navigation.navigate('PaymentWebView', { gateway: 'KHALTI', orderId: order._id, paymentUrl });
      } else if (order.paymentMethod === 'ESEWA') {
        const { formUrl, fields } = await initiateEsewa(order._id);
        navigation.navigate('PaymentWebView', {
          gateway: 'ESEWA',
          orderId: order._id,
          esewaFormUrl: formUrl,
          esewaFields: fields,
        });
      }
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setRetryingPayment(false);
    }
  }, [order, navigation]);

  if (orderState === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand600} size="large" />
      </View>
    );
  }

  if (orderState === 'error' || !order) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="alert-circle-outline"
          title="Couldn't load this order"
          actionLabel="Retry"
          onAction={() => fetchOrder(orderId, setOrder, setOrderState)}
        />
      </View>
    );
  }

  const canCancel = CANCELLABLE_STATUSES.includes(order.status);
  const canRetryPayment =
    (order.paymentMethod === 'KHALTI' || order.paymentMethod === 'ESEWA') &&
    RETRYABLE_PAYMENT_STATUSES.includes(order.paymentStatus);
  const canRequestReturn = order.status === 'DELIVERED' && !activeReturnRequest;

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={typography.h1}>Order Detail</Text>
        <OrderStatusBadge kind="order" status={order.status} />
      </View>
      {order.trackingId ? <Text style={typography.muted}>Tracking ID: {order.trackingId}</Text> : null}

      {actionError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{actionError}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={typography.h2}>Status</Text>
        <OrderTimeline status={order.status} />
      </View>

      <View style={styles.section}>
        <Text style={typography.h2}>Items</Text>
        {order.items.map((item, index) => {
          const label = [item.size, item.color].filter((v) => v && v !== 'Default').join(' / ');
          return (
            <View key={`${item.variantId}-${index}`} style={styles.itemRow}>
              <View style={styles.itemIcon}>
                <Ionicons name="cube-outline" size={22} color={colors.gray400} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={typography.body} numberOfLines={2}>
                  {item.productName}
                </Text>
                {label ? <Text style={typography.muted}>{label}</Text> : null}
                <Text style={typography.muted}>Qty: {item.quantity}</Text>
              </View>
              <Text style={typography.priceList}>Rs. {(item.unitPrice * item.quantity).toLocaleString()}</Text>
            </View>
          );
        })}
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={typography.body}>Subtotal</Text>
          <Text style={typography.body}>Rs. {order.subtotal.toLocaleString()}</Text>
        </View>
        {order.discountAmount > 0 ? (
          <View style={styles.summaryRow}>
            <Text style={typography.body}>Discount {order.couponCode ? `(${order.couponCode})` : ''}</Text>
            <Text style={styles.discountText}>-Rs. {order.discountAmount.toLocaleString()}</Text>
          </View>
        ) : null}
        <View style={styles.summaryRow}>
          <Text style={typography.body}>Delivery Fee</Text>
          <Text style={typography.body}>Rs. {order.deliveryFee.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={typography.h2}>Total</Text>
          <Text style={typography.priceDetail}>Rs. {order.total.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={typography.h2}>Delivery Address</Text>
        <Text style={typography.body}>{order.address.recipientName}</Text>
        <Text style={typography.muted}>{order.address.phone}</Text>
        <Text style={typography.muted}>
          {[order.address.area, order.address.city, order.address.district, order.address.province, order.address.country]
            .filter(Boolean)
            .join(', ')}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={typography.h2}>Payment</Text>
        <View style={styles.summaryRow}>
          <Text style={typography.body}>{order.paymentMethod}</Text>
          <OrderStatusBadge kind="payment" status={order.paymentStatus} />
        </View>
      </View>

      {activeReturnRequest ? (
        <View style={styles.section}>
          <Text style={typography.h2}>Return Request</Text>
          <Text style={typography.body}>Status: {activeReturnRequest.status}</Text>
          {activeReturnRequest.adminNote ? <Text style={typography.muted}>{activeReturnRequest.adminNote}</Text> : null}
        </View>
      ) : null}

      <View style={styles.actionsSection}>
        <Pressable style={styles.actionBtn} onPress={handleDownloadInvoice} disabled={downloadingInvoice}>
          {downloadingInvoice ? (
            <ActivityIndicator size="small" color={colors.brand600} />
          ) : (
            <Text style={styles.actionText}>Download Invoice</Text>
          )}
        </Pressable>

        {canRetryPayment ? (
          <Pressable style={[styles.actionBtn, styles.primaryActionBtn]} onPress={handleRetryPayment} disabled={retryingPayment}>
            {retryingPayment ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.primaryActionText}>Retry Payment ({order.paymentMethod})</Text>
            )}
          </Pressable>
        ) : null}

        {canRequestReturn ? (
          <Pressable style={styles.actionBtn} onPress={() => navigation.navigate('ReturnRequest', { orderId: order._id })}>
            <Text style={styles.actionText}>Request Return</Text>
          </Pressable>
        ) : null}

        {canCancel ? (
          <Pressable style={styles.dangerActionBtn} onPress={handleCancel} disabled={cancelling}>
            {cancelling ? (
              <ActivityIndicator size="small" color={colors.danger600} />
            ) : (
              <Text style={styles.dangerActionText}>Cancel Order</Text>
            )}
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  section: { gap: spacing.sm },
  itemRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', paddingVertical: spacing.xs },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: { flex: 1, gap: 2 },
  divider: { height: 1, backgroundColor: colors.gray100, marginVertical: spacing.xs },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  discountText: { color: colors.success700 },
  errorBanner: { backgroundColor: colors.danger50, borderRadius: 8, padding: spacing.md },
  errorText: { color: colors.danger700, fontSize: 13 },
  actionsSection: { gap: spacing.sm },
  actionBtn: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  actionText: { color: colors.gray700, fontWeight: '600' },
  primaryActionBtn: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  primaryActionText: { color: colors.white, fontWeight: '600' },
  dangerActionBtn: {
    borderWidth: 1,
    borderColor: colors.danger600,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  dangerActionText: { color: colors.danger600, fontWeight: '600' },
});
