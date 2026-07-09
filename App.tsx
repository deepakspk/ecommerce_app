import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from '@/navigation/RootNavigator';
import { AuthProvider } from '@/context/AuthContext';
import { CategoriesProvider } from '@/context/CategoriesContext';
import { CompanySettingsProvider } from '@/context/CompanySettingsContext';

// react-native-screens improves navigation perf, especially on mid-range Android
// devices common in the target market (02-REACT-NATIVE-PROMPTS.md Prompt 1,
// Performance considerations).
enableScreens();

/**
 * Provider composition root. Intended final nesting order, outermost to
 * innermost (01-DOCUMENTATION.md §9 / 02-REACT-NATIVE-PROMPTS.md Prompt 11):
 *
 *   <ThemeSettingsProvider>       Prompt 11 — public, no auth dependency
 *     <CompanySettingsProvider>   Prompt 3  — public, no auth dependency
 *       <CategoriesProvider>      Prompt 3  — public, no auth dependency
 *         <AuthProvider>          Prompt 2  — owns user/token/loading
 *           <CartProvider>        Prompt 5  — depends on useAuth()
 *             <WishlistProvider>  Prompt 5  — depends on useAuth()
 *               <RootNavigator />
 *
 * ThemeSettingsProvider/CartProvider/WishlistProvider land in their own prompts.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <CompanySettingsProvider>
        <CategoriesProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </CategoriesProvider>
      </CompanySettingsProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
