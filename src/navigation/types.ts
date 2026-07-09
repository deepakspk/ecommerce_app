import { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Central route param registry (01-DOCUMENTATION.md-aligned build spec,
 * 02-REACT-NATIVE-PROMPTS.md Prompt 1). Every screen's prop types come from
 * here — never inlined in the screen file. Extended incrementally as each
 * feature prompt adds real screens (e.g. ProductDetail's `{ productSlug }`
 * param lands in Prompt 4).
 */

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  OtpLogin: undefined;
  GoogleAuthWebView: undefined;
};

/**
 * `ProductList` params double as the listing screen's initial filters — a
 * category tile tap, a rail's "See All", and a search submission all land
 * here pre-filtered (02-REACT-NATIVE-PROMPTS.md Prompt 3/4).
 * `ProductListScreen`/`ProductDetailScreen` are shared components mounted
 * identically in both `HomeStack` and `CategoriesStack` (Prompt 4's
 * "also reused by the Categories tab") — each stack gets its own route
 * instance rather than cross-navigating between tabs.
 */
export type ProductListRouteParams =
  { categorySlug?: string; featureType?: string; search?: string; title?: string } | undefined;

export type HomeStackParamList = {
  Home: undefined;
  ProductList: ProductListRouteParams;
  ProductDetail: { productSlug: string };
};

export type CategoriesStackParamList = {
  ProductList: ProductListRouteParams;
  ProductDetail: { productSlug: string };
};

export type WishlistStackParamList = {
  WishlistRoot: undefined;
};

export type CartStackParamList = {
  Cart: undefined;
  // Checkout — added in Prompt 6
};

export type AccountStackParamList = {
  Account: undefined;
  // EditProfile, ChangePassword, AddressList, OrdersList, Terms — added in Prompt 7 / Prompt 8
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  CategoriesTab: NavigatorScreenParams<CategoriesStackParamList>;
  WishlistTab: NavigatorScreenParams<WishlistStackParamList>;
  CartTab: NavigatorScreenParams<CartStackParamList>;
  AccountTab: NavigatorScreenParams<AccountStackParamList>;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  AuthModal: NavigatorScreenParams<AuthStackParamList>;
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- standard React Navigation global augmentation pattern
    interface RootParamList extends RootStackParamList {}
  }
}
