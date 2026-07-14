import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from './types';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { ProductListScreen } from '@/screens/home/ProductListScreen';
import { ProductDetailScreen } from '@/screens/product/ProductDetailScreen';
import { CampaignScreen } from '@/screens/home/CampaignScreen';
import { NotificationsScreen } from '@/screens/home/NotificationsScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

/** `HomeStack` owns its own `ProductList`/`ProductDetail` routes so Home stays self-contained (02-REACT-NATIVE-PROMPTS.md Prompt 3/4). */
export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ProductList" component={ProductListScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Campaign" component={CampaignScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}
