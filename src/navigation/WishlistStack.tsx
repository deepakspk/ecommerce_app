import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WishlistStackParamList } from './types';
import { WishlistScreen } from '@/screens/wishlist/WishlistScreen';
import { ProductDetailScreen } from '@/screens/product/ProductDetailScreen';

const Stack = createNativeStackNavigator<WishlistStackParamList>();

export function WishlistStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WishlistRoot" component={WishlistScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </Stack.Navigator>
  );
}
