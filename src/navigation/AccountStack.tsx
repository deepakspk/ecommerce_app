import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AccountStackParamList } from './types';
import { PlaceholderScreen } from '@/screens/PlaceholderScreen';

const Stack = createNativeStackNavigator<AccountStackParamList>();

/**
 * Real AccountScreen (+ EditProfile/ChangePassword/AddressList/OrdersList/Terms)
 * lands in Prompt 7 / Prompt 8. This whole stack gets wrapped in AuthGuard once
 * that's built in Prompt 2.
 */
export function AccountStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Account">{() => <PlaceholderScreen label="Account" />}</Stack.Screen>
    </Stack.Navigator>
  );
}
