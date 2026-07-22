import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AccountStackParamList } from './types';
import { AccountScreen } from '@/screens/profile/AccountScreen';
import { EditProfileScreen } from '@/screens/profile/EditProfileScreen';
import { ChangePasswordScreen } from '@/screens/profile/ChangePasswordScreen';
import { TermsScreen } from '@/screens/profile/TermsScreen';
import { AddressListScreen } from '@/screens/checkout/AddressListScreen';
import { AddressFormScreen } from '@/screens/checkout/AddressFormScreen';
import { OrdersListScreen } from '@/screens/orders/OrdersListScreen';
import { OrderDetailScreen } from '@/screens/orders/OrderDetailScreen';
import { ReturnRequestScreen } from '@/screens/orders/ReturnRequestScreen';
import { PaymentWebViewScreen } from '@/screens/checkout/PaymentWebViewScreen';

const Stack = createNativeStackNavigator<AccountStackParamList>();

/**
 * The `Account` root has no AuthGuard: it renders its own logged-in
 * (profile menu) and logged-out (inline LoginForm) states, so a guest
 * tapping the Account tab lands on a usable login page rather than a
 * modal over a blank screen. Every route below it is only reachable from
 * the logged-in menu, so it's already gated by the time it's reached.
 * Address Book, Orders, and payment retry reuse Prompt 6/7's screens rather
 * than duplicating them (02-REACT-NATIVE-PROMPTS.md Prompt 8).
 */
export function AccountStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Account" component={AccountScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="AddressList" component={AddressListScreen} />
      <Stack.Screen name="AddressForm" component={AddressFormScreen} />
      <Stack.Screen name="OrdersList" component={OrdersListScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="ReturnRequest" component={ReturnRequestScreen} />
      <Stack.Screen name="PaymentWebView" component={PaymentWebViewScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
    </Stack.Navigator>
  );
}
