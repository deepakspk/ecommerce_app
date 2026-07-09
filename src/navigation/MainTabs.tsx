import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { HomeStack } from './HomeStack';
import { CategoriesStack } from './CategoriesStack';
import { WishlistStack } from './WishlistStack';
import { CartStack } from './CartStack';
import { AccountStack } from './AccountStack';
import { colors } from '@/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  HomeTab: 'home-outline',
  CategoriesTab: 'grid-outline',
  WishlistTab: 'heart-outline',
  CartTab: 'cart-outline',
  AccountTab: 'person-outline',
};

const LABELS: Record<keyof MainTabParamList, string> = {
  HomeTab: 'Home',
  CategoriesTab: 'Categories',
  WishlistTab: 'Wishlist',
  CartTab: 'Cart',
  AccountTab: 'Account',
};

/**
 * Each tab owns its own stack navigator (see individual *Stack.tsx files) so a
 * product/checkout/etc. can be pushed from any tab without losing the tab bar
 * (01-DOCUMENTATION.md-aligned build spec, Prompt 1's Navigation setup).
 */
export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brand600,
        tabBarInactiveTintColor: colors.gray400,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name as keyof MainTabParamList]} size={size} color={color} />
        ),
        tabBarLabel: LABELS[route.name as keyof MainTabParamList],
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="CategoriesTab" component={CategoriesStack} />
      <Tab.Screen name="WishlistTab" component={WishlistStack} />
      <Tab.Screen name="CartTab" component={CartStack} />
      <Tab.Screen name="AccountTab" component={AccountStack} />
    </Tab.Navigator>
  );
}
