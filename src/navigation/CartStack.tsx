import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CartStackParamList } from './types';
import { CartScreen } from '@/screens/cart/CartScreen';
import { CheckoutScreen } from '@/screens/checkout/CheckoutScreen';
import { AddressListScreen } from '@/screens/checkout/AddressListScreen';
import { AddressFormScreen } from '@/screens/checkout/AddressFormScreen';
import { PaymentWebViewScreen } from '@/screens/checkout/PaymentWebViewScreen';
import { OrdersListScreen } from '@/screens/orders/OrdersListScreen';
import { OrderDetailScreen } from '@/screens/orders/OrderDetailScreen';
import { ReturnRequestScreen } from '@/screens/orders/ReturnRequestScreen';
import { AuthGuard } from '@/components/AuthGuard';

const Stack = createNativeStackNavigator<CartStackParamList>();

/**
 * Checkout, addresses, and orders all require login — each wrapped in
 * `AuthGuard` (Prompt 2). Orders lives here temporarily (a proper Account-tab
 * entry point lands in Prompt 8) since Checkout already needed OrderDetail
 * wired in from Prompt 6.
 */
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
      <Stack.Screen name="OrdersList">
        {() => (
          <AuthGuard>
            <OrdersListScreen />
          </AuthGuard>
        )}
      </Stack.Screen>
      <Stack.Screen name="OrderDetail">
        {() => (
          <AuthGuard>
            <OrderDetailScreen />
          </AuthGuard>
        )}
      </Stack.Screen>
      <Stack.Screen name="ReturnRequest">
        {() => (
          <AuthGuard>
            <ReturnRequestScreen />
          </AuthGuard>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
