import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { HomeStack } from './HomeStack';
import { WishlistStack } from './WishlistStack';
import { CartStack } from './CartStack';
import { AccountStack } from './AccountStack';
import { CampaignTabButton } from '@/components/CampaignTabButton';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useThemeSettings } from '@/hooks/useThemeSettings';
import { colors } from '@/theme';

/** Tab badge count: hidden at zero, capped at "99+" so it never overflows the dot. */
function badge(count: number): number | string | undefined {
  if (count <= 0) return undefined;
  return count > 99 ? '99+' : count;
}

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  HomeTab: 'home-outline',
  CartTab: 'cart-outline',
  CampaignTab: 'flash-outline', // never shown — CampaignTab renders a custom tabBarButton
  WishlistTab: 'heart-outline',
  AccountTab: 'person-outline',
};

const LABELS: Record<keyof MainTabParamList, string> = {
  HomeTab: 'Home',
  CartTab: 'Cart',
  CampaignTab: '',
  WishlistTab: 'Favorites',
  AccountTab: 'Account',
};

/** Never mounted — CampaignTab exists only to reserve the tab bar's center
 * slot; its custom `tabBarButton` navigates into HomeTab's Campaign screen. */
function CampaignTabPlaceholder() {
  return null;
}

/**
 * Each tab owns its own stack navigator (see individual *Stack.tsx files) so a
 * product/checkout/etc. can be pushed from any tab without losing the tab bar
 * (01-DOCUMENTATION.md-aligned build spec, Prompt 1's Navigation setup).
 * Layout mirrors the marketplace mock: Home · Cart · floating circular
 * campaign button · Favorites · Account. Categories stays reachable through
 * the Home screen's capsule row rather than a tab of its own.
 */
export function MainTabs() {
  const { colors: liveColors } = useThemeSettings();
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: liveColors.brand600,
        tabBarInactiveTintColor: colors.gray400,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name as keyof MainTabParamList]} size={size} color={color} />
        ),
        tabBarLabel: LABELS[route.name as keyof MainTabParamList],
        tabBarBadgeStyle: {
          backgroundColor: liveColors.brand600,
          color: colors.white,
          fontSize: 10,
          fontWeight: '700',
          // Default is end/top -3, which overlaps the icon's corner — nudge the
          // badge just clear of the glyph without drifting into the next tab.
          end: -9,
          top: -5,
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen
        name="CartTab"
        component={CartStack}
        options={{ tabBarBadge: badge(itemCount) }}
      />
      <Tab.Screen
        name="CampaignTab"
        component={CampaignTabPlaceholder}
        options={{ tabBarButton: () => <CampaignTabButton /> }}
      />
      <Tab.Screen
        name="WishlistTab"
        component={WishlistStack}
        options={{ tabBarBadge: badge(wishlistItems.length) }}
      />
      <Tab.Screen name="AccountTab" component={AccountStack} />
    </Tab.Navigator>
  );
}
