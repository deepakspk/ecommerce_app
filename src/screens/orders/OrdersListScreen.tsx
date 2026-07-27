import { useCallback, useState } from 'react';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CartStackParamList } from '@/navigation/types';
import { getOrders, cancelOrder } from '@/api/orders';
import { getErrorMessage } from '@/utils/errorHelpers';
import { variantLabel } from '@/utils/variantLabel';
import { Order } from '@/types/order';
import { Badge, Card, EmptyState, FormError, LoadingSkeleton } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';

type FetchState = 'loading' | 'ready' | 'error';

const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED'];
const MAX_PREVIEW_ITEMS = 3;

function OrderRowSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHeader}>
        <LoadingSkeleton width={90} height={12} />
        <LoadingSkeleton width={64} height={18} style={{ borderRadius: 999 }} />
      </View>
      <LoadingSkeleton width="40%" height={12} />
      <LoadingSkeleton width={70} height={16} />
    </View>
  );
}

/** Re-fetches on every focus, not just mount — status can change server-side while the user is elsewhere (01-DOCUMENTATION.md Prompt 7 best practice). */
export function OrdersListScreen() {
  const navigation = useNavigation<NavigationProp<CartStackParamList>>();
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);
  const [state, setState] = useState<FetchState>('loading');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setState('loading');
    getOrders()
      .then((data) => {
        setOrders(data);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleCancel = useCallback(
    (order: Order) => {
      Alert.alert('Cancel order', 'Are you sure you want to cancel this order?', [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: async () => {
            setError(null);
            setCancellingId(order._id);
            try {
              await cancelOrder(order._id);
              load();
            } catch (err) {
              setError(getErrorMessage(err));
              load();
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]);
    },
    [load],
  );

  if (state === 'loading') {
    return (
      <View style={[styles.flex, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={colors.gray900} />
          </Pressable>
          <Text style={typography.h1}>My Orders</Text>
        </View>
        <View style={styles.list}>
          {[1, 2, 3, 4].map((i) => (
            <OrderRowSkeleton key={i} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.gray900} />
        </Pressable>
        <Text style={typography.h1}>My Orders</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          state === 'error' ? (
            <EmptyState
              icon="alert-circle-outline"
              title="Couldn't load orders"
              actionLabel="Retry"
              onAction={load}
            />
          ) : (
            <EmptyState
              icon="receipt-outline"
              title="No orders yet"
              message="Your placed orders will show up here."
            />
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }) => {
          const previewItems = item.items.slice(0, MAX_PREVIEW_ITEMS);
          const hiddenCount = item.items.length - previewItems.length;

          return (
            <Card onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <Text style={typography.label}>
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  {item.trackingId ? (
                    <Text style={typography.muted}>Tracking: {item.trackingId}</Text>
                  ) : null}
                </View>
                <Badge kind="order" status={item.status} />
              </View>

              <View style={styles.divider} />

              <View style={styles.itemsList}>
                {previewItems.map((orderItem, i) => {
                  const label = variantLabel(orderItem);
                  return (
                    <View key={`${orderItem.variantId}-${i}`} style={styles.itemRow}>
                      <View style={styles.itemIcon}>
                        <Ionicons name="cube-outline" size={16} color={colors.gray400} />
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={typography.body} numberOfLines={1}>
                          {orderItem.productName}
                        </Text>
                        <Text style={typography.muted}>
                          {label ? `${label} · ` : ''}Qty {orderItem.quantity}
                        </Text>
                      </View>
                      <Text style={styles.itemPrice}>
                        Rs. {(orderItem.unitPrice * orderItem.quantity).toLocaleString()}
                      </Text>
                    </View>
                  );
                })}
                {hiddenCount > 0 ? (
                  <Text style={styles.moreItemsText}>
                    +{hiddenCount} more item{hiddenCount > 1 ? 's' : ''}
                  </Text>
                ) : null}
              </View>

              <View style={styles.divider} />

              <View style={styles.cardFooter}>
                <Text style={typography.muted}>
                  {item.items.length} item{item.items.length > 1 ? 's' : ''}
                </Text>
                <Text style={styles.totalPrice}>Rs. {item.total.toLocaleString()}</Text>
              </View>

              {CANCELLABLE_STATUSES.includes(item.status) ? (
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => handleCancel(item)}
                  disabled={cancellingId === item._id}
                >
                  <Text style={styles.cancelText}>
                    {cancellingId === item._id ? 'Cancelling…' : 'Cancel Order'}
                  </Text>
                </Pressable>
              ) : null}
            </Card>
          );
        }}
      />

      {error ? (
        <View style={styles.errorBannerWrap}>
          <FormError message={error} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardHeaderText: { gap: 2 },
  divider: { height: 1, backgroundColor: colors.gray100 },
  itemsList: { gap: spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: { flex: 1, gap: 1 },
  itemPrice: { fontSize: 13, fontWeight: '600', color: colors.gray900 },
  moreItemsText: { fontSize: 12, color: colors.gray500, fontStyle: 'italic' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalPrice: { fontSize: 16, fontWeight: '800', color: colors.gray900 },
  cancelBtn: { alignSelf: 'flex-start', marginTop: spacing.xs },
  cancelText: { color: colors.danger600, fontWeight: '600', fontSize: 13 },
  errorBannerWrap: { marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  skeletonCard: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  skeletonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
