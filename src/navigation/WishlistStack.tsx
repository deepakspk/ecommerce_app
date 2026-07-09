import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WishlistStackParamList } from './types';
import { PlaceholderScreen } from '@/screens/PlaceholderScreen';

const Stack = createNativeStackNavigator<WishlistStackParamList>();

/** Real WishlistScreen lands in Prompt 5. */
export function WishlistStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WishlistRoot">
        {() => <PlaceholderScreen label="Wishlist" />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
