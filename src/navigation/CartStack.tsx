import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CartStackParamList } from './types';
import { CartScreen } from '@/screens/cart/CartScreen';
import { CheckoutScreen } from '@/screens/checkout/CheckoutScreen';
import { AddressListScreen } from '@/screens/checkout/AddressListScreen';
import { AddressFormScreen } from '@/screens/checkout/AddressFormScreen';
import { PaymentWebViewScreen } from '@/screens/checkout/PaymentWebViewScreen';
import { AuthGuard } from '@/components/AuthGuard';
import { PlaceholderScreen } from '@/screens/PlaceholderScreen';

const Stack = createNativeStackNavigator<CartStackParamList>();

/** Checkout (and everything reachable from it) requires login — wrapped in `AuthGuard` (Prompt 2). OrderDetail is a Prompt 7 screen, stubbed here. */
export function CartStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout">
        {() => (
          <AuthGuard>
            <CheckoutScreen />
          </AuthGuard>
        )}
      </Stack.Screen>
      <Stack.Screen name="AddressList">
        {() => (
          <AuthGuard>
            <AddressListScreen />
          </AuthGuard>
        )}
      </Stack.Screen>
      <Stack.Screen name="AddressForm">
        {() => (
          <AuthGuard>
            <AddressFormScreen />
          </AuthGuard>
        )}
      </Stack.Screen>
      <Stack.Screen name="PaymentWebView" component={PaymentWebViewScreen} />
      <Stack.Screen name="OrderDetail">{() => <PlaceholderScreen label="Order Detail" />}</Stack.Screen>
    </Stack.Navigator>
  );
}
