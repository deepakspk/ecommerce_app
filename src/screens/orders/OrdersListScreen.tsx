import { useCallback, useState } from 'react';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { CartStackParamList } from '@/navigation/types';
import { getOrders, cancelOrder } from '@/api/orders';
import { getErrorMessage } from '@/utils/errorHelpers';
import { Order } from '@/types/order';
import { Badge, Card, EmptyState, FormError, LoadingSkeleton } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

type FetchState = 'loading' | 'ready' | 'error';

const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED'];

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
      <View style={styles.flex}>
        <Text style={[typography.h1, styles.title]}>My Orders</Text>
        <View style={styles.list}>
          {[1, 2, 3, 4].map((i) => (
            <OrderRowSkeleton key={i} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={[typography.h1, styles.title]}>My Orders</Text>}
        ListEmptyComponent={
          state === 'error' ? (
            <EmptyState icon="alert-circle-outline" title="Couldn't load orders" actionLabel="Retry" onAction={load} />
          ) : (
            <EmptyState icon="receipt-outline" title="No orders yet" message="Your placed orders will show up here." />
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }) => (
          <Card onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}>
            <View style={styles.cardHeader}>
              <Text style={typography.label}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              <Badge kind="order" status={item.status} />
            </View>
            <Text style={typography.body}>{item.items.length} item(s)</Text>
            <Text style={typography.priceList}>Rs. {item.total.toLocaleString()}</Text>
            {CANCELLABLE_STATUSES.includes(item.status) ? (
              <Pressable
                style={styles.cancelBtn}
                onPress={() => handleCancel(item)}
                disabled={cancellingId === item._id}
              >
                <Text style={styles.cancelText}>{cancellingId === item._id ? 'Cancelling…' : 'Cancel Order'}</Text>
              </Pressable>
            ) : null}
          </Card>
        )}
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
  list: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  title: { marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
