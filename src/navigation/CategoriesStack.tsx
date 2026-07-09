import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CategoriesStackParamList } from './types';
import { ProductListScreen } from '@/screens/home/ProductListScreen';
import { ProductDetailScreen } from '@/screens/product/ProductDetailScreen';

const Stack = createNativeStackNavigator<CategoriesStackParamList>();

/** Reuses `ProductListScreen`/`ProductDetailScreen` from `HomeStack` (02-REACT-NATIVE-PROMPTS.md Prompt 4) — no category preselected at the tab root. */
export function CategoriesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProductList" component={ProductListScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </Stack.Navigator>
  );
}
