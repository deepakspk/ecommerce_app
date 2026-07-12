import { useCallback, useEffect, useState } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CartStackParamList } from '@/navigation/types';
import { getOrder, getReturnRequests, createReturnRequest } from '@/api/orders';
import { getErrorMessage } from '@/utils/errorHelpers';
import { ReturnItemPicker } from '@/components/ReturnItemPicker';
import { Order } from '@/types/order';
import { ACTIVE_RETURN_STATUSES, ReturnRequest, ReturnRequestItem } from '@/types/return';
import { Badge, Button, EmptyState, FormError } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

type FetchState = 'loading' | 'ready' | 'error';

async function fetchOrderAndReturns(
  orderId: string,
  setOrder: (order: Order) => void,
  setState: (state: FetchState) => void,
  setExistingRequest: (request: ReturnRequest | null) => void,
) {
  setState('loading');
  try {
    const [order, returnRequests] = await Promise.all([getOrder(orderId), getReturnRequests(orderId)]);
    setOrder(order);
    setExistingRequest(returnRequests.find((r) => ACTIVE_RETURN_STATUSES.includes(r.status)) ?? null);
    setState('ready');
  } catch {
    setState('error');
  }
}

/**
 * Submit disabled until at least one item is selected with a reason
 * (`ReturnItemPicker` reports only valid selections). A 409 (already in
 * progress) reloads to show the existing request's status instead of the
 * form (01-DOCUMENTATION.md Prompt 7).
 */
export function ReturnRequestScreen() {
  const route = useRoute<RouteProp<CartStackParamList, 'ReturnRequest'>>();
  const navigation = useNavigation<NativeStackNavigationProp<CartStackParamList>>();
  const { orderId } = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [state, setState] = useState<FetchState>('loading');
  const [existingRequest, setExistingRequest] = useState<ReturnRequest | null>(null);
  const [selections, setSelections] = useState<ReturnRequestItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrderAndReturns(orderId, setOrder, setState, setExistingRequest);
  }, [orderId]);

  const handleRetry = useCallback(() => {
    fetchOrderAndReturns(orderId, setOrder, setState, setExistingRequest);
  }, [orderId]);

  const handleSubmit = async () => {
    if (selections.length === 0 || submitting) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await createReturnRequest(orderId, selections);
      navigation.goBack();
    } catch (err) {
      setFormError(getErrorMessage(err));
      fetchOrderAndReturns(orderId, setOrder, setState, setExistingRequest);
    } finally {
      setSubmitting(false);
    }
  };

  if (state === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand600} size="large" />
      </View>
    );
  }

  if (state === 'error' || !order) {
    return (
      <View style={styles.center}>
        <EmptyState icon="alert-circle-outline" title="Couldn't load this order" actionLabel="Retry" onAction={handleRetry} />
      </View>
    );
  }

  if (existingRequest) {
    return (
      <View style={styles.container}>
        <Text style={typography.h1}>Return Request</Text>
        <Text style={typography.body}>A return request is already in progress for this order.</Text>
        <Badge kind="return" status={existingRequest.status} />
        {existingRequest.adminNote ? <Text style={typography.muted}>{existingRequest.adminNote}</Text> : null}
      </View>
    );
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={typography.h1}>Request Return</Text>
      <Text style={typography.muted}>Select the item(s) you&apos;d like to return and tell us why.</Text>

      <FormError message={formError} />

      <ReturnItemPicker items={order.items} onChange={setSelections} />

      <Button
        title="Submit Return Request"
        onPress={handleSubmit}
        loading={submitting}
        disabled={selections.length === 0}
        style={styles.submitBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  submitBtn: { marginTop: spacing.md },
});
