import { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CartStackParamList } from '@/navigation/types';
import { useCart } from '@/hooks/useCart';
import { getAddresses } from '@/api/addresses';
import { getInternationalFee, getRate, calcFlatDeliveryFee } from '@/api/logistics';
import { createOrder } from '@/api/orders';
import { initiateKhalti, initiateEsewa } from '@/api/payments';
import { ApplyCouponResponse } from '@/api/cart';
import { AddressCard } from '@/components/AddressCard';
import { CouponInput } from '@/components/CouponInput';
import { PaymentMethodPicker, SelectablePaymentMethod } from '@/components/PaymentMethodPicker';
import { getDiscountedPrice } from '@/utils/pricing';
import { getErrorMessage } from '@/utils/errorHelpers';
import { Address } from '@/types/address';
import { Button, EmptyState, FormError } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

type FetchState = 'loading' | 'ready' | 'error';

async function fetchAddresses(
  setAddresses: (addresses: Address[]) => void,
  setSelectedId: Dispatch<SetStateAction<string | undefined>>,
  setState: (state: FetchState) => void,
) {
  setState('loading');
  try {
    const addresses = await getAddresses();
    setAddresses(addresses);
    setSelectedId((prev) => {
      if (prev && addresses.some((a) => a._id === prev)) return prev;
      return addresses.find((a) => a.isDefault)?._id ?? addresses[0]?._id;
    });
    setState('ready');
  } catch {
    setState('error');
  }
}

async function fetchDeliveryFee(address: Address | undefined, setFee: (fee: number | null) => void, setState: (state: FetchState) => void) {
  if (!address) {
    setFee(null);
    setState('ready');
    return;
  }
  setState('loading');
  if (address.country !== 'Nepal') {
    try {
      const fee = await getInternationalFee();
      setFee(fee);
    } catch {
      setFee(3000);
    }
    setState('ready');
    return;
  }
  if (address.branchName) {
    try {
      const fee = await getRate(address.branchName);
      setFee(fee);
      setState('ready');
      return;
    } catch {
      // fall through to flat fee
    }
  }
  setFee(calcFlatDeliveryFee(address.province));
  setState('ready');
}

/**
 * Address picker, live delivery fee, coupon, payment method, and order
 * placement (02-REACT-NATIVE-PROMPTS.md Prompt 6). Wrapped in `AuthGuard` at
 * the navigator level — a guest reaching here is prompted to log in first,
 * and this screen only ever renders once `user` is resolved.
 */
export function CheckoutScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CartStackParamList>>();
  const cart = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesState, setAddressesState] = useState<FetchState>('loading');
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(undefined);

  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [feeState, setFeeState] = useState<FetchState>('ready');

  const [couponResult, setCouponResult] = useState<ApplyCouponResponse | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<SelectablePaymentMethod>('COD');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [placeOrderError, setPlaceOrderError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchAddresses(setAddresses, setSelectedAddressId, setAddressesState);
    }, []),
  );

  const selectedAddress = useMemo(
    () => addresses.find((a) => a._id === selectedAddressId),
    [addresses, selectedAddressId],
  );

  useFocusEffect(
    useCallback(() => {
      fetchDeliveryFee(selectedAddress, setDeliveryFee, setFeeState);
    }, [selectedAddress]),
  );

  const isInternational = !!selectedAddress && selectedAddress.country !== 'Nepal';
  const couponStale = couponResult !== null && couponResult.subtotal !== cart.subtotal;
  const effectiveDiscount = couponResult && !couponStale ? couponResult.discountAmount : 0;
  const effectiveCouponCode = couponResult && !couponStale ? couponResult.code : undefined;
  const grandTotal = cart.subtotal - effectiveDiscount + (deliveryFee ?? 0);

  const handlePlaceOrder = useCallback(async () => {
    if (!selectedAddress) {
      setPlaceOrderError('Select a delivery address to continue.');
      return;
    }
    setPlacingOrder(true);
    setPlaceOrderError(null);
    try {
      const order = await createOrder({
        addressId: selectedAddress._id,
        paymentMethod: isInternational ? undefined : paymentMethod,
        couponCode: effectiveCouponCode,
      });

      if (order.paymentMethod === 'KHALTI') {
        const { paymentUrl } = await initiateKhalti(order._id);
        await cart.refresh();
        navigation.replace('PaymentWebView', { gateway: 'KHALTI', orderId: order._id, paymentUrl });
      } else if (order.paymentMethod === 'ESEWA') {
        const { formUrl, fields } = await initiateEsewa(order._id);
        await cart.refresh();
        navigation.replace('PaymentWebView', {
          gateway: 'ESEWA',
          orderId: order._id,
          esewaFormUrl: formUrl,
          esewaFields: fields,
        });
      } else {
        await cart.refresh();
        navigation.replace('OrderDetail', { orderId: order._id });
      }
    } catch (err) {
      setPlaceOrderError(getErrorMessage(err));
    } finally {
      setPlacingOrder(false);
    }
  }, [selectedAddress, isInternational, paymentMethod, effectiveCouponCode, cart, navigation]);

  if (cart.items.length === 0 && !placingOrder) {
    return (
      <View style={styles.center}>
        <EmptyState icon="cart-outline" title="Your cart is empty" message="Add items to your cart before checking out." />
      </View>
    );
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={typography.h1}>Checkout</Text>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={typography.h2}>Delivery Address</Text>
          <Pressable onPress={() => navigation.navigate('AddressList')}>
            <Text style={styles.linkText}>Manage</Text>
          </Pressable>
        </View>

        {addressesState === 'loading' ? (
          <ActivityIndicator color={colors.brand600} />
        ) : addressesState === 'error' ? (
          <Text style={styles.errorText}>Couldn&apos;t load addresses.</Text>
        ) : addresses.length === 0 ? (
          <Button
            title="+ Add a delivery address"
            variant="secondary"
            onPress={() => navigation.navigate('AddressForm', undefined)}
          />
        ) : (
          <View style={{ gap: spacing.sm }}>
            {addresses.map((address) => (
              <AddressCard
                key={address._id}
                address={address}
                selected={address._id === selectedAddressId}
                onPress={() => setSelectedAddressId(address._id)}
              />
            ))}
            <Pressable onPress={() => navigation.navigate('AddressForm', undefined)}>
              <Text style={styles.linkText}>+ Add new address</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={typography.h2}>Coupon</Text>
        <CouponInput onApplied={setCouponResult} />
        {couponResult && !couponStale ? (
          <Text style={styles.couponApplied}>
            Applied &quot;{couponResult.code}&quot; — Rs. {couponResult.discountAmount.toLocaleString()} off
          </Text>
        ) : null}
        {couponStale ? (
          <Text style={styles.couponStale}>Your cart changed since applying this coupon — please re-apply it.</Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={typography.h2}>Payment Method</Text>
        <PaymentMethodPicker value={paymentMethod} onChange={setPaymentMethod} isInternational={isInternational} />
      </View>

      <View style={styles.section}>
        <Text style={typography.h2}>Order Summary</Text>
        {cart.items.map((item) => {
          const variant = item.variantId;
          const product = variant.productId;
          const price = getDiscountedPrice(variant.price ?? product.basePrice, product.discountType, product.discountValue);
          return (
            <View key={variant._id} style={styles.summaryRow}>
              <Text style={typography.body} numberOfLines={1}>
                {product.name} x{item.quantity}
              </Text>
              <Text style={typography.body}>Rs. {(price * item.quantity).toLocaleString()}</Text>
            </View>
          );
        })}
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={typography.body}>Subtotal</Text>
          <Text style={typography.body}>Rs. {cart.subtotal.toLocaleString()}</Text>
        </View>
        {effectiveDiscount > 0 ? (
          <View style={styles.summaryRow}>
            <Text style={typography.body}>Discount</Text>
            <Text style={styles.discountText}>-Rs. {effectiveDiscount.toLocaleString()}</Text>
          </View>
        ) : null}
        <View style={styles.summaryRow}>
          <Text style={typography.body}>Delivery Fee</Text>
          {feeState === 'loading' ? (
            <ActivityIndicator size="small" color={colors.brand600} />
          ) : (
            <Text style={typography.body}>Rs. {(deliveryFee ?? 0).toLocaleString()}</Text>
          )}
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={typography.h2}>Total</Text>
          <Text style={typography.priceDetail}>Rs. {grandTotal.toLocaleString()}</Text>
        </View>
      </View>

      <FormError message={placeOrderError} />

      <Button title="Place Order" onPress={handlePlaceOrder} loading={placingOrder} disabled={!selectedAddress} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkText: { color: colors.brand600, fontWeight: '600', fontSize: 13 },
  errorText: { color: colors.danger600, fontSize: 13 },
  couponApplied: { color: colors.success700, fontSize: 13 },
  couponStale: { color: colors.warning700, fontSize: 13 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  discountText: { color: colors.success700 },
  divider: { height: 1, backgroundColor: colors.gray100, marginVertical: spacing.xs },
});
