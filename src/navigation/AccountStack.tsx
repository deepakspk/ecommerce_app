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
import { AuthGuard } from '@/components/AuthGuard';

const Stack = createNativeStackNavigator<AccountStackParamList>();

/**
 * Only the `Account` root is wrapped in AuthGuard — a guest tapping the
 * Account tab is prompted to log in rather than seeing a broken/empty
 * profile, and every route below it is only reachable from there, so it's
 * already gated by the time it's reached. Address Book, Orders, and payment
 * retry reuse Prompt 6/7's screens rather than duplicating them
 * (02-REACT-NATIVE-PROMPTS.md Prompt 8).
 */
export function AccountStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Account">
        {() => (
          <AuthGuard>
            <AccountScreen />
          </AuthGuard>
        )}
      </Stack.Screen>
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
