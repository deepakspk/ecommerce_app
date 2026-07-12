import { useCallback, useState } from 'react';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { CartStackParamList } from '@/navigation/types';
import { getOrders, cancelOrder } from '@/api/orders';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { getErrorMessage } from '@/utils/errorHelpers';
import { Order } from '@/types/order';
import { colors, radius, spacing, typography } from '@/theme';

type FetchState = 'loading' | 'ready' | 'error';

const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED'];

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
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand600} size="large" />
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
          <Pressable style={styles.card} onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}>
            <View style={styles.cardHeader}>
              <Text style={typography.label}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              <OrderStatusBadge kind="order" status={item.status} />
            </View>
            <Text style={typography.body}>{item.items.length} item(s)</Text>
            <Text style={typography.priceList}>Rs. {item.total.toLocaleString()}</Text>
            {CANCELLABLE_STATUSES.includes(item.status) ? (
              <Pressable
                style={styles.cancelBtn}
                onPress={() => handleCancel(item)}
                disabled={cancellingId === item._id}
              >
                {cancellingId === item._id ? (
                  <ActivityIndicator size="small" color={colors.danger600} />
                ) : (
                  <Text style={styles.cancelText}>Cancel Order</Text>
                )}
              </Pressable>
            ) : null}
          </Pressable>
        )}
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { marginBottom: spacing.md },
  card: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cancelBtn: { alignSelf: 'flex-start', marginTop: spacing.xs },
  cancelText: { color: colors.danger600, fontWeight: '600', fontSize: 13 },
  errorBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.danger50,
  },
  errorText: { color: colors.danger700, fontSize: 13 },
});
