import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeSettingsProvider } from '@/context/ThemeSettingsContext';
import { AuthProvider } from '@/context/AuthContext';
import { CategoriesProvider } from '@/context/CategoriesContext';
import { CompanySettingsProvider } from '@/context/CompanySettingsContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { ToastHost } from '@/components/ui';

// react-native-screens improves navigation perf, especially on mid-range Android
// devices common in the target market (02-REACT-NATIVE-PROMPTS.md Prompt 1,
// Performance considerations).
enableScreens();

/**
 * Provider composition root — final nesting order, outermost to innermost
 * (01-DOCUMENTATION.md §9 / 02-REACT-NATIVE-PROMPTS.md Prompt 11):
 *
 *   <ThemeSettingsProvider>       Prompt 11 — public, no auth dependency
 *     <CompanySettingsProvider>   Prompt 3  — public, no auth dependency
 *       <CategoriesProvider>      Prompt 3  — public, no auth dependency
 *         <AuthProvider>          Prompt 2  — owns user/token/loading
 *           <CartProvider>        Prompt 5  — depends on useAuth()
 *             <WishlistProvider>  Prompt 5  — depends on useAuth()
 *               <RootNavigator />
 *
 * The three outer providers all fire their one-shot GET on mount independently
 * (no `await`-chaining between them), so cold-start-to-interactive is the
 * slowest of the three round trips, not their sum.
 *
 * Caching strategy (explicit and intentional — the backend itself has no
 * response-caching layer, and neither does the web app, §9):
 *   - Auth user:                       fetched once on launch (`GET /me`), held in AuthContext,
 *                                       manually refreshed after profile edits.
 *   - Categories / CompanySettings /
 *     ThemeSettings:                   fetched once per app session on launch, shared via context,
 *                                       no re-fetch unless the app is fully relaunched — public,
 *                                       rarely-changing data.
 *   - Cart / Wishlist:                 held in context, re-fetched from server on login/merge,
 *                                       otherwise mutated optimistically-then-confirmed by each
 *                                       action's own response — this app is the only writer of its
 *                                       own cart, so no periodic re-fetch is needed.
 *   - Product listings/detail,
 *     reviews, questions:              fetched fresh on every screen visit, never cached — catalog
 *                                       and stock data goes stale quickly and must always reflect
 *                                       current server truth.
 *   - Orders:                          re-fetched on screen focus (`useFocusEffect`), not just on
 *                                       mount — status can change from outside this app session
 *                                       (courier sync, admin action).
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeSettingsProvider>
        <CompanySettingsProvider>
          <CategoriesProvider>
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <ErrorBoundary>
                    <RootNavigator />
                  </ErrorBoundary>
                  <ToastHost />
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </CategoriesProvider>
        </CompanySettingsProvider>
      </ThemeSettingsProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
