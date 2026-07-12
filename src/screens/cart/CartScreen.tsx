import { useCallback, useState } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { CartStackParamList, MainTabParamList } from '@/navigation/types';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { CartLineItem } from '@/components/CartLineItem';
import { getErrorMessage } from '@/utils/errorHelpers';
import { CartItem } from '@/types/cart';
import { Button, EmptyState, FormError } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

/**
 * "Proceed to Checkout" always navigates to `Checkout` regardless of auth
 * state — the destination screen is wrapped in `AuthGuard` (Prompt 2) which
 * handles the actual login gate and auto-renders once login succeeds. The
 * button label just reflects what will happen (02-REACT-NATIVE-PROMPTS.md
 * Prompt 5/6). Cart state is never touched by the login detour.
 */
export function CartScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CartStackParamList>>();
  const { items, loading, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const [mutationError, setMutationError] = useState<string | null>(null);

  const handleChangeQuantity = useCallback(
    async (variantId: string, quantity: number) => {
      try {
        setMutationError(null);
        await updateQuantity(variantId, quantity);
      } catch (err) {
        setMutationError(getErrorMessage(err));
      }
    },
    [updateQuantity],
  );

  const handleRemove = useCallback(
    (variantId: string) => {
      Alert.alert('Remove item', 'Remove this item from your cart?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setMutationError(null);
              await removeItem(variantId);
            } catch (err) {
              setMutationError(getErrorMessage(err));
            }
          },
        },
      ]);
    },
    [removeItem],
  );

  const handleClear = useCallback(() => {
    Alert.alert('Clear cart', 'Remove all items from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            setMutationError(null);
            await clearCart();
          } catch (err) {
            setMutationError(getErrorMessage(err));
          }
        },
      },
    ]);
  }, [clearCart]);

  const handleCheckout = useCallback(() => {
    navigation.navigate('Checkout');
  }, [navigation]);

  if (!loading && items.length === 0) {
    return (
      <View style={styles.flex}>
        <EmptyState
          icon="cart-outline"
          title="Your cart is empty"
          message="Browse the catalog to find something you'll love."
          actionLabel="Browse Products"
          onAction={() =>
            navigation.getParent<NavigationProp<MainTabParamList>>()?.navigate('HomeTab', { screen: 'Home' })
          }
        />
        <Pressable style={styles.ordersLink} onPress={() => navigation.navigate('OrdersList')}>
          <Text style={styles.ordersLinkText}>View My Orders</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={items}
        keyExtractor={(item: CartItem) => item.variantId._id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={typography.h1}>Cart</Text>
            <View style={styles.headerActions}>
              <Pressable onPress={() => navigation.navigate('OrdersList')}>
                <Text style={styles.ordersLinkText}>My Orders</Text>
              </Pressable>
              {items.length > 0 ? (
                <Pressable onPress={handleClear}>
                  <Text style={styles.clearText}>Clear all</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <CartLineItem
            item={item}
            onChangeQuantity={(quantity) => handleChangeQuantity(item.variantId._id, quantity)}
            onRemove={() => handleRemove(item.variantId._id)}
          />
        )}
      />

      {mutationError ? (
        <View style={styles.errorBannerWrap}>
          <FormError message={mutationError} />
        </View>
      ) : null}

      <View style={styles.footer}>
        <View style={styles.subtotalRow}>
          <Text style={typography.body}>Subtotal</Text>
          <Text style={typography.priceDetail}>Rs. {subtotal.toLocaleString()}</Text>
        </View>
        <Button title={user ? 'Proceed to Checkout' : 'Log in to Checkout'} onPress={handleCheckout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  clearText: { color: colors.danger600, fontWeight: '600', fontSize: 13 },
  ordersLink: { alignItems: 'center', paddingVertical: spacing.md },
  ordersLinkText: { color: colors.brand600, fontWeight: '600', fontSize: 13 },
  errorBannerWrap: { marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  footer: {
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
  },
  subtotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
