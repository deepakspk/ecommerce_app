import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CartStackParamList } from './types';
import { PlaceholderScreen } from '@/screens/PlaceholderScreen';

const Stack = createNativeStackNavigator<CartStackParamList>();

/** Real CartScreen lands in Prompt 5; Checkout is added to this stack in Prompt 6. */
export function CartStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Cart">{() => <PlaceholderScreen label="Cart" />}</Stack.Screen>
    </Stack.Navigator>
  );
}
