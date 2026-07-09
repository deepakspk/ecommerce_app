# React Native Customer App — Sequential Build Prompts

These 12 prompts rebuild **only the customer-facing side** of the Ecommerce Nepal platform (documented in `01-DOCUMENTATION.md`) as a standalone React Native app, talking to the **exact same existing Express/MongoDB backend** — zero server changes required. No admin panel, no admin APIs, no vendor panel.

Run them **in order**, one per session, test on a real device/simulator before moving to the next, commit after each. Do not ask for "all of this at once."

## Fixed technical decisions (apply to every prompt below)

| Decision | Choice | Why |
|---|---|---|
| Framework | **Expo (managed workflow, latest SDK)**, TypeScript | Fastest path to a production build (EAS Build/Submit), OTA updates, first-class camera/image/secure-storage modules without native config |
| Navigation | **React Navigation v7** — native-stack + bottom-tabs | Explicit, file-by-file route definitions (mirrors the web app's `App.jsx` route table 1:1), not file-based routing — easier to keep in sync with this spec |
| State management | **React Context + hooks**, mirroring the web app's Auth/Cart/Wishlist/Categories/CompanySettings/ThemeSettings contexts exactly | This codebase's established pattern everywhere is "low abstraction, no extra state library" — Redux/Zustand would be inconsistent with the rest of the platform for no real benefit at this app's size |
| Server-state caching | Plain `fetch`-on-focus + local state (matches the web app, which has **no** response caching layer either) | Keeps mobile behavior 1:1 with web; do not introduce TanStack Query unless a later prompt explicitly asks for it |
| HTTP client | `axios` | Same library as the web app; interceptor support for the Bearer token |
| Token storage | `expo-secure-store` (**never** `AsyncStorage`) | The JWT is long-lived (7 days) with no revocation beyond an account-disable check — it must sit in the OS keychain/keystore, not plain-text storage. This is the one deliberate deviation from the web app's `localStorage`, because the web and mobile threat models differ |
| Images | `expo-image` | Better caching/perf than `Image`; product/banner images are Cloudinary URLs, reuse the same `f_auto,q_auto,w_<n>` transform pattern as the web app |
| Forms/validation | Plain controlled components + a shared `utils/validators.ts` (ported directly from the web app's `validators.js`) | No form library needed — the web app doesn't use one either |
| Payment & OAuth webviews | `react-native-webview`, intercepting navigation via `onShouldStartLoadWithRequest` | Khalti/eSewa/Google OAuth are all server-driven redirect flows against `FRONTEND_URL`-based callback URLs — intercepting the URL pattern client-side needs **zero backend changes** (see Prompt 6 for the exact mechanism) |

**Base project folder** (referenced by every prompt): `customer-app/`, with all app code under `customer-app/src/`.

**API base URL:** `process.env.EXPO_PUBLIC_API_URL` (e.g. `http://<lan-ip>:5000/api` in dev, the deployed URL in prod) — same shape as the web app's `VITE_API_URL`, just Expo's env-var convention.

**Every prompt's code must**: validate on the client as a UX nicety only (the server is always the source of truth — every endpoint documented in `01-DOCUMENTATION.md §4` already validates server-side); show a loading state and a visible error state for every network call (never swallow a failure silently); handle empty states explicitly; be typed (no `any` unless unavoidable); use the shared `theme/` tokens instead of ad hoc inline colors; keep components small and composed from the shared `components/ui/` primitives once Prompt 9 introduces them (for Prompts 2–8, inline minimal styling is fine and gets refactored to shared primitives in Prompt 9 — call this out explicitly in each prompt so no one over-builds early).

---

## Prompt 1 — Project Setup

**Objective.** Scaffold the Expo/TypeScript project, install and configure the full dependency set, set up linting/formatting, environment config, the design-token theme, and the navigation + state-management skeletons — no real screens or API calls yet.

**Features to implement.** Nothing user-facing. This is pure scaffolding.

**Folder structure to create** (empty/stub files where noted):
```
customer-app/
├── App.tsx
├── app.config.ts
├── babel.config.js
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
├── .env.example
├── src/
│   ├── api/client.ts
│   ├── navigation/{RootNavigator.tsx, AuthStack.tsx, MainTabs.tsx, HomeStack.tsx, CartStack.tsx, AccountStack.tsx, types.ts}
│   ├── context/ (empty, populated in later prompts)
│   ├── hooks/ (empty)
│   ├── screens/ (empty subfolders: auth/, home/, product/, cart/, checkout/, orders/, profile/)
│   ├── components/ui/ (empty)
│   ├── theme/{colors.ts, spacing.ts, typography.ts, index.ts}
│   ├── utils/{storage.ts, validators.ts, errorHelpers.ts}
│   ├── constants/ (empty)
│   └── types/api.ts (empty stub — will hold shared TS interfaces mirroring the Mongoose models in `01-DOCUMENTATION.md §5`)
```

**Dependencies to install.** `expo`, `react-navigation` (`@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`), `react-native-screens`, `react-native-safe-area-context`, `axios`, `expo-secure-store`, `expo-image`, `react-native-webview`, `expo-image-picker` (needed by Prompt 8's avatar upload), `@expo/vector-icons` (icons — no external icon asset pipeline needed). Dev: `typescript`, `eslint`, `eslint-config-universe` (or `@react-native/eslint-config`), `prettier`.

**Environment configuration.** `.env.example` with `EXPO_PUBLIC_API_URL=http://localhost:5000/api`; wire `app.config.ts` to read it (Expo auto-exposes `EXPO_PUBLIC_*` vars, no extra plugin needed).

**Theme setup.** `theme/colors.ts` hardcodes the *default* brand ramp exactly matching the web app's Tailwind `@theme` defaults (from `01-DOCUMENTATION.md §10`): `brand50 #eff6ff … brand600 #2563eb … brand800`, plus `success/warning/danger/info` semantic scales and a gray scale. `theme/typography.ts` defines a type scale mirroring the web app's H1/H2/H3/body/muted/label/price roles (§8 of the documentation). `theme/spacing.ts` a small numeric scale (4/8/12/16/24/32). Export a single `theme` object from `theme/index.ts`. (This is the static fallback; Prompt 11 wires the live `ThemeSettingsContext` on top of it — don't build that yet.)

**Navigation setup.** `RootNavigator.tsx`: a native-stack containing `MainTabs` as the base route, with `AuthStack` presented `modal` (`presentation: "modal"`) on top when triggered. `MainTabs.tsx`: bottom-tab navigator with 5 tabs — Home, Categories, Wishlist, Cart, Account — each tab pointing at its own stack navigator (`HomeStack`, a `CategoriesStack` you add now as a stub, `WishlistStack` stub, `CartStack`, `AccountStack`) so a product can be pushed from any tab without losing the tab bar. `AuthStack.tsx`: stub stack with placeholder `Login`/`Signup` screens (real screens land in Prompt 2). Define all route param types centrally in `navigation/types.ts` (e.g. `HomeStackParamList`, `RootStackParamList`) — every screen prop type is imported from here, never inlined.

**State management setup.** Do not build real Context providers yet — just confirm the provider-composition file exists (`App.tsx` renders `<RootNavigator/>` directly for now) and document in a code comment the intended nesting order for later prompts, matching the web app's order from `01-DOCUMENTATION.md §9`: `ThemeSettingsProvider > CompanySettingsProvider > CategoriesProvider > AuthProvider > CartProvider > WishlistProvider > RootNavigator`.

**API integration.** `api/client.ts`: create the axios instance with `baseURL: process.env.EXPO_PUBLIC_API_URL`, a request interceptor that reads the token via `utils/storage.ts#getToken()` (built now, backed by `expo-secure-store`, async — note this is a meaningful difference from the web app's synchronous `localStorage` read, so every caller of the interceptor chain must tolerate an async token fetch) and sets `Authorization: Bearer <token>` when present. No endpoints called yet.

**Validation / Error handling.** Port `utils/validators.ts` (email, password ≥8 chars, Nepali phone regex `^(\+977)?9[78]\d{8}$`, 6-digit OTP) and `utils/errorHelpers.ts` (`getErrorMessage(err)`/`getFieldErrors(err)`, reading the same `{message, errors[]}` shape documented in §4) directly from the web app's equivalents — these are pure functions, framework-agnostic.

**Best practices / Clean architecture.** Path aliases (`@/api`, `@/theme`, etc.) via `tsconfig.json` `paths` + Babel module-resolver, so nothing imports via `../../../..`. ESLint + Prettier configured and passing on the empty scaffold. No business logic lives in screen components at this stage — none exist yet.

**Performance considerations.** Enable Hermes (Expo default), confirm `react-native-screens` is enabled (`enableScreens()`), so navigation doesn't lag on lower-end Android devices common in the target market.

**Done when:** `npx expo start` runs, the empty tab bar renders with 5 placeholder tabs, ESLint/TypeScript are clean, and a placeholder Login screen can be opened modally from a temporary button on the Home tab.

---

## Prompt 2 — Authentication Module

**Objective.** Full auth: email/password login+signup, phone OTP login, Google OAuth (via webview), forgot/reset password, email-verification acknowledgement screen, session persistence, and a reusable "require login" guard used by every screen that needs it.

**Features to implement.** Login, Signup, Forgot Password, Reset Password (deep-link/token entry), OTP Login (two-stage: request → verify), Google OAuth, session rehydration on app launch, logout, protected-screen guard.

**Folder structure / files to create.**
```
src/context/AuthContext.tsx
src/hooks/useAuth.ts
src/api/auth.ts
src/screens/auth/{LoginScreen.tsx, SignupScreen.tsx, ForgotPasswordScreen.tsx, ResetPasswordScreen.tsx, OtpLoginScreen.tsx, GoogleAuthWebViewScreen.tsx}
src/components/AuthGuard.tsx
src/types/user.ts
```

**API integration** (endpoints from `01-DOCUMENTATION.md §4.1`, all under `/auth`): `POST /signup`, `POST /login`, `POST /otp/request`, `POST /otp/verify`, `POST /forgot-password`, `POST /reset-password/:token`, `GET /me`. `api/auth.ts` exports one typed function per endpoint, each returning the exact response shape documented (`{token, user}` etc.).

**Google OAuth — no backend changes needed.** The backend's `GET /auth/google` → Passport → redirects the browser to `${FRONTEND_URL}/oauth-callback?token=<jwt>`. In the app: `GoogleAuthWebViewScreen` opens `react-native-webview` pointed at `${EXPO_PUBLIC_API_URL}/auth/google`; attach `onShouldStartLoadWithRequest` and check if the target URL's path is `/oauth-callback` (matching whatever `FRONTEND_URL` is currently configured — read it once from the public `GET /settings/company`-adjacent app config, or simply pattern-match on `.../oauth-callback?token=`) — if it matches, **cancel the webview navigation** (`return false`), parse the `token` query param, call `AuthContext.loginWithToken(token)`, and dismiss the modal. If the URL doesn't match, allow normal navigation (`return true`) so Google's own auth pages load fine inside the webview.

**Password reset deep link.** The emailed reset link points at `${FRONTEND_URL}/reset-password/:token` (a web URL). Since this app doesn't intercept arbitrary web links by default, `ResetPasswordScreen` should also accept **manual token entry** (paste-the-token-from-email as a fallback text input) in addition to supporting a proper deep link if `app.config.ts` registers a custom scheme/universal link for `/reset-password/:token` — implement the manual-entry fallback now; note the deep-link enhancement as optional/stretch since it requires coordinating a real domain with the backend team.

**State management.** `AuthContext` state: `user`, `token`, `loading`. Actions: `signup`, `login`, `loginWithOtp(phone, code)`, `loginWithToken(token)`, `logout`, `refreshMe`. On mount: read token from `expo-secure-store` via `utils/storage.ts`; if present, call `GET /me`; on any failure, clear the stored token and fall back to a logged-out state (mirrors the web app's `refreshMe` exactly, documented in §9). `logout()` is client-only — clears secure storage, resets context state, no server call (matches backend: there's no logout endpoint).

**Navigation.** `AuthStack` (built as a stub in Prompt 1) now gets real screens: `Login → Signup`, `Login → ForgotPassword`, `Login → OtpLogin`, `Login → GoogleAuthWebView`, `ForgotPassword → ResetPassword`. `AuthGuard.tsx`: a wrapper component (`<AuthGuard><RealScreen/></AuthGuard>` or a HOC) that checks `useAuth().user` — if absent, presents `AuthStack` modally instead of rendering children, and re-renders the protected content automatically once login succeeds (listen to context state, not a one-shot check). This guard will wrap Cart-checkout, Addresses, Settings, Orders, and Account screens in later prompts — build it generically now.

**UI requirements.** Simple, clean forms matching the web app's visual language (from `01-DOCUMENTATION.md §10`/`UI_STYLE_GUIDE.md`): labeled inputs, primary blue button, secondary "Continue with Google" button, inline field errors (red text under the field, from `getFieldErrors`), a top-level `FormError` banner for request-level failures (e.g. `401`, `423 locked`), loading spinner replacing button label while a request is in flight. OTP screen: phone input → "Send Code" → 6-digit code input (auto-advance boxes or a single 6-char field, either is acceptable) → "Verify".

**Validation.** Client-side pre-checks using `utils/validators.ts` (don't submit an obviously-invalid email/password/phone — but always let the server's response be authoritative for the actual error message shown).

**Error handling.** Map documented error cases explicitly: `409` (signup, email in use) → inline email-field error; `401` (login) → "Invalid email or password" banner; `423` (login, locked) → "Too many attempts — try again in 15 minutes" banner; `403` (any auth call, disabled account) → "This account has been disabled" banner with no retry action; OTP `400` → "Invalid or expired code".

**Best practices.** Never log the JWT or password to the console, even in dev. Debounce the "Verify" OTP button to prevent double-submit. Clear password fields from state on unmount of auth screens.

**Performance.** Auth screens are cheap — no special concerns beyond avoiding re-renders of the whole app tree when `AuthContext.loading` flips (memoize context value).

**Done when:** a fresh install can sign up, log out, log back in with email/password, log in with OTP, log in with Google (webview flow works against a real dev backend + real Google OAuth credentials), and reopening the app after a force-quit stays logged in until the token is cleared or expires.

---

## Prompt 3 — Home Module

**Objective.** The Home tab: banner carousel, category tile grid, feature-type rails (e.g. "New Arrivals"), and the entry point to search — everything a guest sees with zero taps.

**Features to implement.** Home screen, category browsing entry points, banner carousel, search bar (navigates into the listing screen with a query, built fully in Prompt 4), feature-type product rails, recently-viewed rail placeholder (real implementation lands in Prompt 4 once ProductDetail exists to populate it).

**Folder structure / files.**
```
src/context/{CategoriesContext.tsx, CompanySettingsContext.tsx}
src/hooks/{useCategories.ts, useCompanySettings.ts}
src/api/{categories.ts, banners.ts, featureTypes.ts, settings.ts}
src/screens/home/HomeScreen.tsx
src/components/{BannerCarousel.tsx, CategoryTile.tsx, ProductRail.tsx, ProductCard.tsx, SearchBar.tsx}
src/types/{category.ts, banner.ts, product.ts}
```

**API integration.** `GET /banners`, `GET /categories/tree`, `GET /feature-types`, `GET /products?featureType=<slug>&limit=8` (one call per active feature type, or however many rails you choose to show — cap at a sane number, e.g. first 4 feature types), `GET /settings/company` (for `CompanySettingsContext`, used by Home's header/footer branding and later by Prompt 8's account/legal screens).

**State management.** `CategoriesContext`: fetch `GET /categories/tree` once on mount, expose `{categories, loading}` — shared by Home, the Categories tab (Prompt 4), and any category picker elsewhere, exactly mirroring the web app's single-fetch-shared-everywhere pattern (§9). `CompanySettingsContext`: fetch `GET /settings/company` once, expose `{company, loading}`, default to `{}` gracefully (matches the backend's graceful-empty-object behavior documented in §2.16) so nothing crashes on a fresh, unconfigured install.

**Navigation.** `HomeStack`: `Home → ProductList` (tapping a category tile or "See All" on a rail navigates into the Categories/listing stack — cross-tab navigation from Home into the Categories tab's stack, or duplicate a `ProductList` screen inside `HomeStack` itself; simplest correct approach: give `HomeStack` its own `ProductList` route so Home stays self-contained, and have the Categories tab's stack reuse the same screen component). `Home → ProductDetail` (tapping any `ProductCard` in a rail) — `ProductDetail` itself is built in Prompt 4, so wire the navigation call now with a `productSlug` param per `navigation/types.ts`, and stub the destination screen.

**UI requirements.** `BannerCarousel`: horizontal `FlatList` with paging enabled (or a small carousel lib is unnecessary — plain `FlatList` + `onMomentumScrollEnd` index tracking is sufficient), auto-advance every 5s via `setInterval` cleared on unmount and paused while the user is actively touching it, dot indicators, tap-to-navigate (internal path → in-app navigation; external `http(s)://` link → open in the system browser via `Linking.openURL`), gracefully renders nothing if `banners.length === 0` (matches web behavior, §2.2). `CategoryTile` grid: 2 or 3 columns, image or letter-avatar fallback (mirrors the web app's fallback behavior noted in memory — most categories won't have an image set). `ProductRail`: horizontal `FlatList` of `ProductCard`s. `ProductCard`: image, name, price (with strikethrough original price + discount badge when `discountType` is set — use the server's precomputed `finalPrice`, don't recompute discount math on-device), star rating row (only rendered when `reviewCount > 0`, matching web behavior).

**Validation / Error handling.** Each independent fetch (banners, categories, feature-type rails) fails independently — one failed rail must not blank the whole Home screen; show a small inline retry affordance per failed section, not a full-screen error, since Home is composed of several unrelated data sources.

**Best practices.** `CategoriesContext` and `CompanySettingsContext` are placed high in the provider tree (per Prompt 1's documented nesting order) since they have no auth dependency and are needed before the user necessarily logs in.

**Performance.** Use `FlatList` (not `ScrollView` + `.map`) for every rail and the category grid — this app's catalog can grow, and `FlatList`'s windowing matters on mid-range Android devices. Use `expo-image`'s built-in disk cache for all product/banner images with a Cloudinary width transform matched to the actual rendered tile size (don't download full-resolution images for a 100px tile).

**Done when:** Home renders banners (or nothing, gracefully, if none exist), a tappable category grid, and at least one feature-type rail, all against the real dev backend, with pull-to-refresh re-fetching everything.

---

## Prompt 4 — Product Module

**Objective.** Full product discovery and detail: listing with filters/search/sort, category browsing, product detail with variant selection, reviews, Q&A, related/recently-viewed rails, and wishlist toggling.

**Features to implement.** Product listing (filters: category, subcategory, feature type, price range, size, color, min rating; sort: newest/price-asc/price-desc; search; pagination), category tab/pill navigation, product detail (image gallery, variant size/color picker with per-variant stock/price, quantity stepper, add-to-cart entry point — real cart wiring lands in Prompt 5, stub the action here), reviews (read + eligibility-gated write), product Q&A (read + ask), related products, recently-viewed (real implementation now that ProductDetail exists), wishlist toggle (stub the context call — real WishlistContext lands in Prompt 5, but build the `WishlistButton` UI and wire it once Prompt 5 lands, noted here for sequencing).

**Folder structure / files.**
```
src/api/{products.ts, reviews.ts, questions.ts, stockAlerts.ts}
src/screens/home/ProductListScreen.tsx     (also reused by the Categories tab)
src/screens/product/ProductDetailScreen.tsx
src/components/{FilterSheet.tsx, SortSheet.tsx, FilterPill.tsx, StarRating.tsx, ReviewList.tsx, ReviewForm.tsx, QuestionList.tsx, QuestionForm.tsx, VariantPicker.tsx, RecentlyViewedRail.tsx, EmptyState.tsx, Pagination.tsx}
src/hooks/useDebouncedValue.ts
src/utils/{recentlyViewed.ts, variantLabel.ts, pricing.ts}
src/types/{review.ts, question.ts, variant.ts}
```

**API integration** (`01-DOCUMENTATION.md §4.2–4.3`): `GET /products` (all query params), `GET /products/available-filters`, `GET /products/:slug` (returns `{product, variants[], relatedProducts[]}` in one call — no extra requests needed for the variant picker or the related rail), `GET/POST /products/:productId/reviews`, `GET /products/:productId/reviews/eligibility` (call only when a user is logged in), `GET/POST /products/:productId/questions`, `POST /stock-alerts` (for the out-of-stock "Notify me" button — requires login, route through `AuthGuard`).

**State management.** No new global context here — product/listing/detail state is local to these screens (`useState`/`useEffect`, matching the web app's per-page fetch pattern, §9). `recentlyViewed.ts` ports the web app's localStorage logic to `expo-secure-store`-adjacent plain storage — actually use plain `AsyncStorage` here specifically (not secure store — this is non-sensitive, purely a UX list of slugs, and `AsyncStorage` is the right tool for non-sensitive local caches; secure store is reserved for the auth token). Cap at 10 slugs, same as web.

**Navigation.** `ProductListScreen` accepts route params for initial filters (category slug, search query, feature type) so both a category tile tap (Prompt 3) and a search submission land here pre-filtered. `ProductListScreen → ProductDetailScreen(productSlug)`. `ProductDetailScreen → ProductDetailScreen(relatedProductSlug)` (tapping a related-product card — a recursive push, standard for PDP-to-PDP navigation). Add a header search icon on `ProductListScreen` that opens a search input (inline or a dedicated `SearchScreen` — inline is simpler and matches the web app's persistent search box).

**UI requirements.** Listing: `FlatList` grid (2 columns) of `ProductCard`, pull-to-refresh, infinite scroll (`onEndReached` loading the next page) **or** numbered `Pagination` — prefer infinite scroll on mobile (more native-feeling than tapping page numbers), but the choice must still respect the server's `page`/`pages` response fields. `FilterSheet`/`SortSheet`: bottom sheets (a simple `Modal` with `presentationStyle="pageSheet"` or a custom animated sheet — no need for a heavy library) triggered from a filter/sort bar above the grid. Subcategory pills appear once a parent category is active, mirroring the web app's second-row behavior (§2.3). Product detail: image gallery (horizontal paged `FlatList` of `expo-image`s + dot indicator), size/color pickers as tappable pill rows (disable/gray out a color option once selecting it would resolve to a variant with 0 stock, mirroring the "show, but flag out-of-stock" web behavior), live stock/price display for the resolved variant, quantity stepper capped at `variant.stockQuantity`, tabs (Description/Additional Info/Shipping) as a simple segmented control, `ReviewList`+`ReviewForm` (form only rendered if `eligibility.hasPurchased && !eligibility.alreadyReviewed`, edit mode if `alreadyReviewed`, and a clear "purchase this product to review it" message otherwise — never hide the section entirely), `QuestionList`+`QuestionForm` (ask box only for logged-in users, routed through `AuthGuard` on submit-attempt rather than hiding the whole section from guests, so a guest can still read Q&A).

**Validation.** Review: rating required 1–5, comment optional ≤1000 chars (mirror server limit, show a live character counter). Question: required, ≤500 chars.

**Error handling.** `404` on `GET /products/:slug` (e.g. a stale recently-viewed slug pointing at a deleted/deactivated product) → drop it from the recently-viewed rail silently (matches web behavior, §2.4) rather than showing a broken tile; everywhere else, a full inline error state with retry.

**Best practices.** Debounce the search input (400ms, matching the web app's `useDebouncedValue`) before firing `GET /products`. Memoize the resolved-variant lookup (`useMemo` keyed on selected size+color) rather than re-scanning the variants array on every render.

**Performance.** `FlatList` `getItemLayout`/`keyExtractor` set correctly for the grid; image gallery uses `expo-image`'s `contentFit="cover"` and a fixed aspect ratio container to avoid layout shift while images load; cap Cloudinary transform width to the actual gallery display size (not the source image's full resolution).

**Done when:** a user can search/filter/sort/paginate the catalog, open any product, select a size+color to see correct stock/price, read reviews and Q&A, submit a review if eligible (test against a real delivered order in the dev DB), and see related + recently-viewed rails populate correctly.

---

## Prompt 5 — Cart Module

**Objective.** Full cart: guest cart in local storage, server cart for logged-in users, merge-on-login, add/update/remove/clear, live subtotal, and the Wishlist feature (built alongside Cart since they share an architecture).

**Features to implement.** Add to cart (from `ProductDetailScreen`, wiring the stub from Prompt 4), Cart screen (quantity stepper, remove, clear, subtotal), guest→server merge on login, Wishlist (toggle from `ProductCard`/`ProductDetailScreen`, dedicated Wishlist tab screen, move-to-cart action).

**Folder structure / files.**
```
src/context/{CartContext.tsx, WishlistContext.tsx}
src/hooks/{useCart.ts, useWishlist.ts}
src/api/{cart.ts, wishlist.ts}
src/screens/cart/CartScreen.tsx
src/screens/wishlist/WishlistScreen.tsx   (lives under the Wishlist tab's own stack)
src/components/{CartLineItem.tsx, WishlistButton.tsx, QuantityStepper.tsx}
src/utils/guestStorage.ts
```

**API integration** (`01-DOCUMENTATION.md §4.4`): `GET/POST /cart`, `PUT/DELETE /cart/items/:variantId`, `DELETE /cart`, `POST /cart/merge`, `GET/POST/DELETE /wishlist*`, `POST /wishlist/merge`.

**State management — port the exact web-app pattern (§9), adapted for React Native's async storage.**
- `CartContext`: state `{items[], loading}`, derived `itemCount`/`subtotal` via `utils/pricing.ts` (port `getDiscountedPrice` from the web app, keep price math identical). Guest items live in `AsyncStorage["ecommerce_guest_cart"]` as denormalized objects (variant+product snapshot, same shape as web). A `prevUserIdRef` (`useRef`) tracks the previous resolved auth state exactly as the web app does: on the `logged-out → logged-in` transition, POST the guest items to `/cart/merge`, clear the guest key, reload the server cart; on `logged-in → logged-out`, just fall back to displaying whatever's in the (untouched) guest key — **do not** write the server cart into guest storage on logout, matching documented web behavior (§7.3). Every mutation enforces `quantity ≤ variant.stockQuantity` client-side as a UX nicety; the server is authoritative and returns a specific insufficient-stock message to surface if the client check was somehow stale.
- `WishlistContext`: identical shape/pattern, `AsyncStorage["ecommerce_guest_wishlist"]`, no quantity/stock concept, exposes `isWishlisted(productId)`/`toggleItem(product)` in addition to add/remove/clear.

Use `AsyncStorage` (not `expo-secure-store`) for both guest keys — this is non-sensitive shopping-cart data, not a credential; reserve secure store for the auth token only (per Prompt 1's decision table).

**Navigation.** `CartStack`: `Cart → (login guard) → Checkout` (Checkout itself is built in Prompt 6 — wire the navigation call and route param types now). `WishlistScreen` lives in its own tab stack; "Move to Cart" re-fetches the product (`GET /products/:slug`) to resolve a default/first-available variant before calling `CartContext.addItem`, matching the web app's approach (§2.7) since a wishlist entry has no variant of its own.

**UI requirements.** `CartLineItem`: thumbnail, name, variant label (size/color, via `variantLabel.ts`), `QuantityStepper` (+/− buttons, disabled at 0/max-stock), remove (swipe-to-delete or an explicit button — swipe is more native but an explicit trash icon is simpler and equally acceptable), line total. Cart screen footer: subtotal, a full-width primary CTA that reads "Proceed to Checkout" (logged in) or "Log in to Checkout" (guest, opens `AuthStack` via `AuthGuard` and preserves the cart exactly as-is through that detour — do not clear or touch cart state on the login prompt). Empty cart → `EmptyState` with a "Browse Products" action into the Home/Categories tab. `WishlistButton`: heart icon toggle, filled red when active (matches the web app's visual treatment), usable from `ProductCard` (absolute-positioned overlay) and inline on `ProductDetailScreen`.

**Validation / Error handling.** Add-to-cart against a variant whose stock changed since the page loaded (`400` insufficient stock) → inline toast/banner with the server's exact message (includes current stock), not a generic failure; do not optimistically show success before the server confirms.

**Best practices.** Keep `CartContext`/`WishlistContext` provider placement exactly per the documented nesting order (§9): both depend on `useAuth()`, so both must sit inside `AuthProvider`.

**Performance.** Debounce rapid +/- taps on the quantity stepper (e.g. 300ms) so a fast double-tap doesn't fire two overlapping `PUT` requests that could race.

**Done when:** a guest can build a cart and wishlist entirely offline-of-auth, logging in merges both correctly (verify against a real account with a pre-existing server-side cart to confirm the merge-not-replace behavior), and quantity/removal/clear all reflect correctly with the server as source of truth.

---

## Prompt 6 — Checkout Module

**Objective.** Address management, live delivery-fee quoting, coupon application, the COD/Khalti/eSewa payment choice, and order placement — including the in-app webview handling for both online gateways with zero backend changes.

**Features to implement.** Address book (add/edit/delete/set-default, Nepal cascading province/district/municipality/branch or international fields), checkout screen (address picker, delivery fee, coupon, payment method, place order), Khalti in-app payment flow, eSewa in-app payment flow, order confirmation hand-off.

**Folder structure / files.**
```
src/api/{addresses.ts, orders.ts, payments.ts, logistics.ts}
src/screens/checkout/{AddressListScreen.tsx, AddressFormScreen.tsx, CheckoutScreen.tsx, PaymentWebViewScreen.tsx}
src/components/{AddressCard.tsx, CouponInput.tsx, PaymentMethodPicker.tsx}
src/constants/{nepalGeoData.ts, countries.ts}
src/types/{address.ts, order.ts, payment.ts}
```

**API integration** (`01-DOCUMENTATION.md §4.5–4.7`): `GET/POST /addresses`, `PUT/DELETE /addresses/:id`, `PATCH /addresses/:id/default`, `GET /logistics/international-fee`, `POST /logistics/rate`, `POST /cart/apply-coupon`, `POST /orders`, `POST /payments/khalti/initiate`, `POST /payments/khalti/verify`, `POST /payments/esewa/initiate`, `POST /payments/esewa/verify`.

**Address form.** Port `nepalGeoData.ts` (7 provinces/77 districts/753 municipalities) and `countries.ts` verbatim from the web app's `client/src/data/`. Cascading pickers (province → district → municipality/city → branch, using native `Picker`-style selects or a searchable bottom sheet for the 753-item municipality list — a plain dropdown is unusable at that size, so implement the municipality/district selectors as a searchable modal list). `country` defaults to `"Nepal"`; switching to any other country swaps the form to generic free-text fields, mirroring the web app exactly (§2.9). `branchName` required whenever the district has courier coverage — surface this the same way the server enforces it: submit and show the server's validation error if omitted, or (better UX) call the logistics branch-lookup to know upfront whether it's required.

**Delivery fee logic (client-side orchestration, mirrors §2.10 exactly).** On address selection: if `country !== "Nepal"` → `GET /logistics/international-fee`; else if the address has a `branchName` → `POST /logistics/rate {branchName}`, falling back silently to the flat calculation on any error; else → local flat calculation (Rs. 100 if province is `"bagmati"` case-insensitive, else Rs. 200) — port this exact fallback formula so the UI never shows a blank/zero fee while a network call is pending or failing.

**Coupon.** `CouponInput`: code entry + Apply button → `POST /cart/apply-coupon`, display the returned discount in the order summary; if the cart changes after applying (compare the previewed `subtotal` against the live cart subtotal), mark the discount stale and prompt re-apply, exactly matching web behavior (§2.10/§2.12) — never silently keep a discount that might not still be valid.

**Payment method & order placement.** `PaymentMethodPicker`: COD/Khalti/eSewa radios, entirely **hidden** for an international address (show an informational note instead — "Our team will contact you to arrange payment" — and force no `paymentMethod` field on the request so the server applies `MANUAL` automatically, per §2.10/§2.11). On "Place Order": `POST /orders {addressId, paymentMethod, couponCode?}`, then branch:
- **COD / international:** clear the local cart context, navigate straight to the Order Detail screen (built in Prompt 7).
- **Khalti:** call `POST /payments/khalti/initiate {orderId}` → `{paymentUrl}`; push `PaymentWebViewScreen` with that URL.
- **eSewa:** call `POST /payments/esewa/initiate {orderId}` → `{formUrl, fields}`; `PaymentWebViewScreen` must load an HTML string that auto-submits a POST form with those hidden fields to `formUrl` (use the webview's `source={{html: ...}}` with a generated form + inline `<script>document.forms[0].submit()</script>`, since `react-native-webview` can't do a raw signed POST navigation directly the way a browser's `<form>` submit can from a real DOM).

**PaymentWebViewScreen — the no-backend-changes interception mechanism.** Attach `onShouldStartLoadWithRequest` (fires before every navigation inside the webview, including the gateway's own redirect back to the app's configured `FRONTEND_URL`). Check the target URL's path against the two known callback patterns from `01-DOCUMENTATION.md §2.11`: `.../payment/khalti/callback?pidx=...` and `.../payment/esewa/callback?...`. When matched: **return `false`** (blocks the webview from actually loading that page — it doesn't need to, since that page is meant for the *web* app, not this app), extract `pidx` (Khalti) or `transaction_uuid`/base64 `data` param (eSewa, same decode logic as the web app's `EsewaCallbackPage`), then call `POST /payments/khalti/verify {pidx}` or `POST /payments/esewa/verify {transactionUuid}` directly from the app, and navigate to Order Detail with the verified result. If the URL doesn't match a callback pattern, return `true` and let the gateway's own pages (login, OTP, confirm) load normally inside the webview. Handle the user backgrounding/cancelling the webview (Android back button / iOS swipe-down) by leaving the order in its already-created `PENDING` state — Prompt 7's Order Detail screen already has a "Pay with {gateway}" retry action for exactly this case.

**Validation.** Address form: required fields enforced client-side per country branch (mirror server rules exactly, §4.5) before allowing submit, but still surface server-side validation errors verbatim (don't assume client-side coverage is complete).

**Error handling.** `POST /orders` `400` insufficient-stock or invalid-coupon → inline banner on `CheckoutScreen`, do not navigate away, do not clear the cart (only clear cart on confirmed success). Network failure mid-payment-webview → don't lose the order; the order already exists server-side as `PENDING`, so surface a clear "we couldn't confirm your payment — check Order status" message and route to Order Detail rather than retrying blindly.

**Best practices.** Never construct or sign eSewa's HMAC on-device — the signed `fields` always come from the server's `initiate` response; the app only ever renders and auto-submits them.

**Performance.** The municipality searchable-list must filter locally (data is static, no network) with a debounced text filter for smoothness at 753 entries.

**Done when:** a COD order round-trips end to end; a Khalti sandbox payment (test credentials from the project's `khalti_note.md`) completes and correctly verifies without ever trusting the redirect alone; an eSewa sandbox payment (UAT constants from `esewa.note.md`) completes via the auto-submitted form + interception; an international address hides payment method selection and forces the flat international fee.

---

## Prompt 7 — Orders Module

**Objective.** Order history, order detail, PDF invoice download/share, customer-initiated cancellation, and the return/refund request flow.

**Features to implement.** Orders list, Order detail (status, items, address, payment breakdown), invoice download, cancel order, request return, payment retry for stuck Khalti/eSewa orders, order status tracking display.

**Folder structure / files.**
```
src/screens/orders/{OrdersListScreen.tsx, OrderDetailScreen.tsx, ReturnRequestScreen.tsx}
src/components/{OrderStatusBadge.tsx, OrderTimeline.tsx, ReturnItemPicker.tsx}
src/utils/downloadInvoice.ts
```

**API integration** (`01-DOCUMENTATION.md §4.6`): `GET /orders`, `GET /orders/:id`, `GET /orders/:id/invoice`, `POST /orders/:id/cancel`, `GET/POST /orders/:id/return`, plus `payments.ts` (already built in Prompt 6) for the retry action.

**Order status model.** Port the exact enum and forward-only sequence from `01-DOCUMENTATION.md §5`/`§7.1`: `PENDING → CONFIRMED → PACKED → PICKED → SHIPPED → ARRIVED → OUT_FOR_DELIVERY → DELIVERED`, with `CANCELLED` reachable only up to (not including) `OUT_FOR_DELIVERY`. `OrderTimeline` renders this sequence with the current status highlighted — a simple vertical stepper is sufficient, no need to fetch granular courier tracking events (those are admin/`Shipment`-level detail not exposed to the customer API beyond the order's own `status` field).

**Eligibility gating (compute client-side from data already on the order, mirroring server rules exactly — never guess):**
- Cancel button visible only if `order.status` is `PENDING` or `CONFIRMED`.
- Return button visible only if `order.status === "DELIVERED"` **and** `now <= deliveredAt + RETURN_WINDOW_DAYS` (default 7 — do not hardcode a window number in the client if avoidable; simplest correct approach is to always attempt the action and let the server's `400` response communicate window-closed, since the exact window is a server-configured setting the client doesn't have direct read access to. Show the Return button whenever `status === "DELIVERED"` and no active `ReturnRequest` exists, and let a `400` on submit surface the real reason).
- Payment retry button visible only if `paymentMethod` is `KHALTI`/`ESEWA` and `paymentStatus` is `PENDING` or `FAILED`.

**Navigation.** `AccountStack`/`CartStack` (wherever Orders is reached from — likely its own tab-stack entry point plus a link from the Account tab, per Prompt 8) `→ OrdersListScreen → OrderDetailScreen(orderId) → ReturnRequestScreen(orderId)`. `OrderDetailScreen`'s payment-retry button re-enters the exact same `PaymentWebViewScreen` flow built in Prompt 6 (reuse it, don't duplicate).

**UI requirements.** `OrdersListScreen`: `FlatList`, each row shows date/item-count/total/`OrderStatusBadge`, tappable into detail, inline "Cancel" affordance on eligible rows (with a confirmation dialog before firing the request — cancellation is consequential). `OrderDetailScreen`: full item breakdown (thumbnail/name/variant/qty/price), address block, payment method+status, `OrderTimeline`, action buttons row (Download Invoice, Cancel, Retry Payment, Request Return — only whichever are currently eligible), and — if a `ReturnRequest` already exists for this order — its status and any admin note, instead of the request form. `ReturnRequestScreen`: `ReturnItemPicker` (checkbox + quantity stepper capped at ordered quantity + required reason text per line item), submit button disabled until at least one item is selected with a reason.

**Invoice download.** `GET /orders/:id/invoice` returns a raw PDF stream. `downloadInvoice.ts`: fetch with the auth header (via `expo-file-system`'s `downloadAsync` or an authenticated `fetch` + write to `FileSystem.documentDirectory`, since a plain `<a href>` download doesn't exist on mobile and won't carry the Bearer token anyway — same reasoning the web app documents for its blob-download utility, §9/`downloadBlob.js`), then hand off to `expo-sharing`'s `shareAsync` so the user can save/share/print it via the OS share sheet.

**Validation / Error handling.** Cancel `400` (status changed since the screen loaded, e.g. it just got confirmed server-side) → refresh the order and show the server's exact message rather than a stale local error. Return `409` (already in progress) → show the existing request's status instead of the form. Return `400` (window passed / wrong status / bad item/qty) → surface the exact server message inline on the form.

**Best practices.** Re-fetch `GET /orders/:id` on screen focus (React Navigation's `useFocusEffect`), not just on mount — status can change server-side (courier sync, admin action) while the user is elsewhere in the app.

**Performance.** Orders list paginates or lazy-loads if a customer's history grows long — check whether `GET /orders` is already paginated server-side (if not documented as paginated, treat the response as the full list and render it in a `FlatList` regardless; `FlatList`'s windowing handles a long flat list fine without needing server pagination).

**Done when:** the full order lifecycle is navigable end to end: a placed order appears in the list, cancel works within its window, a delivered test order (seed one directly in the dev DB if needed) allows a return request, invoice downloads and opens/shares correctly, and a stuck Khalti/eSewa order can be retried.

---

## Prompt 8 — Profile Module

**Objective.** Account tab: profile view/edit (with avatar upload), the Address Book (reusing Prompt 6's components), change password, notification/back-in-stock alert visibility, static legal content, and logout.

**Features to implement.** Account/profile screen, edit profile (name/email/phone/avatar), change password, address book access, order history access, terms/legal screen, logout.

**Folder structure / files.**
```
src/screens/profile/{AccountScreen.tsx, EditProfileScreen.tsx, ChangePasswordScreen.tsx, TermsScreen.tsx}
src/components/{Avatar.tsx, AccountMenuItem.tsx}
src/utils/avatar.ts
```

**API integration.** `GET /auth/me` (already in `api/auth.ts` from Prompt 2), `PUT /auth/profile` (multipart — name/email/phone + optional `avatar` file, via `expo-image-picker` to select/take a photo, uploaded as multipart form data through axios exactly as the web app does with `FormData`), `POST /auth/change-password`.

**Navigation.** `AccountStack`: `Account → EditProfile`, `Account → ChangePassword`, `Account → AddressList` (Prompt 6's screens, reused here as the Address Book entry point — do not duplicate), `Account → OrdersList` (Prompt 7's screen), `Account → Terms`, plus a `Logout` action (confirmation dialog, then `AuthContext.logout()` and pop to the root/Home tab — logging out should never trap the user on a now-inaccessible protected screen, so navigate to a public screen immediately after). The entire `AccountStack` root screen is wrapped in `AuthGuard` (Prompt 2) — a guest tapping the Account tab is prompted to log in rather than seeing a broken/empty profile.

**UI requirements.** `AccountScreen`: `Avatar` (photo or initials-color fallback, port `utils/avatar.ts`'s deterministic hash-to-color logic from the web app) + name/email header, a menu list (`AccountMenuItem` rows: Orders, Addresses, Wishlist, Change Password, Terms, Logout), matching the web app's `DashboardPage`/`SettingsPage` content scope (§2 — profile summary, recent orders, default address, cart/wishlist preview are all reasonable inclusions here, consolidated into one screen for mobile rather than split across `/account` and `/settings` as on web, since a mobile Account tab is conventionally one screen with drill-ins). `EditProfileScreen`: avatar picker (tap to open `expo-image-picker`, camera or library), name/email/phone fields, save button. `ChangePasswordScreen`: current password (omit the field entirely if the account has no password set, e.g. Google/OTP-only — mirror the server's conditional requirement, §4.1) + new password + confirm.

**Validation.** Email/phone format via `utils/validators.ts`; new password ≥8 chars; confirm-password must match before allowing submit (client-side only — the server doesn't take a confirm field).

**Error handling.** `PUT /profile` `400` (email/phone already in use by another account) → inline field error, not a generic banner. `POST /change-password` `400`/`401` (wrong current password) → inline error on the current-password field specifically.

**Best practices.** Compress/resize the picked avatar image client-side (`expo-image-picker`'s built-in quality/size options) before upload — don't send a full-resolution phone-camera photo for a small avatar.

**Performance.** Avatar upload shows a progress/loading state on the `Avatar` component itself (optimistic local preview via the picked image's local URI while the upload is in flight, then swap to the server's returned Cloudinary URL on success).

**Done when:** a logged-in user can view/edit their profile including a real avatar upload, change their password, reach the Address Book and Order history from one Account screen, read Terms, and log out cleanly back to a guest-usable Home screen.

---

## Prompt 9 — Shared Components

**Objective.** Extract and consolidate the ad hoc styling used across Prompts 2–8 into a single shared component library under `components/ui/`, matching the web app's `utils/ui.js` single-source-of-truth philosophy (`01-DOCUMENTATION.md §8`/`UI_STYLE_GUIDE.md`) — a consolidation pass, not new features.

**Features to implement.** None new — this prompt is a refactor. Every screen built in Prompts 2–8 gets updated to import from these shared primitives instead of any inline/duplicated styling.

**Folder structure / files.**
```
src/components/ui/{Button.tsx, Input.tsx, Select.tsx, Card.tsx, Badge.tsx, Pagination.tsx, EmptyState.tsx, LoadingSkeleton.tsx, FormError.tsx, Modal.tsx, BottomSheet.tsx, Toast.tsx, StarRating.tsx}
src/components/ui/index.ts   (barrel export)
```

**Component specs (mirror the web app's tokens exactly, `01-DOCUMENTATION.md §8`):**
- `Button`: `variant="primary"|"secondary"|"danger"|"ghost"`, `size="sm"|"md"`, loading state (spinner replaces label, button stays same width to avoid layout jump), disabled state.
- `Input`/`Select`: consistent border/radius/focus-ring styling, label + helper/error text slot, error state visually distinct (red border + `FieldError` text).
- `Card`: consistent padding/border/radius wrapper, used everywhere a bordered white surface currently exists (product cards, cart line items, order rows, address cards).
- `Badge`: `kind="order"|"payment"|"return"` + `status` prop, reading one consolidated status→color map (port `ORDER_STATUS_COLORS`/`PAYMENT_STATUS_COLORS`/`RETURN_STATUS_COLORS` from the web app's `ui.js`, §8) — replaces any inline status-color logic written ad hoc in Prompts 4/7.
- `Pagination`: reusable numbered pager (if Prompt 4 ended up using infinite scroll instead, this component is still needed for admin-adjacent... no — customer app has no admin; keep `Pagination` only if any screen still benefits from it, e.g. reviews list pagination on `ProductDetailScreen`).
- `EmptyState`: icon + title + message + optional action button — replaces the ad hoc empty-cart/empty-wishlist/empty-orders text built per-screen in earlier prompts.
- `LoadingSkeleton`: a shimmering placeholder block, applied to the product grid (Prompt 4) and orders list (Prompt 7) in place of a bare "Loading…" string, matching the web app's stated goal of extending its one real skeleton (`ProductsPage`) to every list screen (`UI_STYLE_GUIDE.md` Phase 4).
- `FormError`: banner variant (top of a screen/form) — already used ad hoc since Prompt 2; formalize it here as the single implementation every screen imports.
- `Modal`/`BottomSheet`: generalize whatever one-off sheet Prompt 4's `FilterSheet`/`SortSheet` and Prompt 7's cancel/return confirmation dialogs each built independently, into one reusable primitive.
- `Toast`: a lightweight, non-blocking success/error message (e.g. "Added to cart", "Removed from wishlist") — the web app doesn't have a formal toast system documented, so use judgment here: a simple bottom-anchored auto-dismissing banner is sufficient, but it must never be the *only* signal for a failure (per this project's standing UX rule: always show a durable, visible error state too — a toast can supplement but never replace an inline error banner for anything the user needs to act on).

**Refactor pass.** Go back through every screen from Prompts 2–8 and replace inline buttons/inputs/cards/badges/empty-states/loading-strings with the new shared components. This should be a behavior-neutral visual-consistency pass — no new API calls, no new navigation.

**State management / API integration.** None — pure UI layer.

**Validation / Error handling.** N/A beyond ensuring `FormError`/`Toast`/error-state styling stayed behaviorally identical after the refactor (don't regress any error path while consolidating its presentation).

**Best practices.** Every new shared component gets a typed props interface exported alongside it (`ButtonProps`, `BadgeProps`, etc.) so screens get compile-time safety on variant/status strings, not just runtime.

**Performance.** `LoadingSkeleton` uses a lightweight opacity/translateX animation (`Animated` or `react-native-reanimated` if already a dependency — don't add a new animation library just for this).

**Done when:** grepping the `screens/` and `components/` (non-`ui/`) folders for inline color hex codes or duplicated button/input/badge styling returns nothing — every visual primitive is sourced from `components/ui/`.

---

## Prompt 10 — API Layer

**Objective.** Harden the API layer built incrementally across Prompts 2–8 into a single, consistent, well-typed client: centralized error normalization, consistent auth-header attachment (including the async secure-store read), retry behavior for transient failures, and a documented mapping of every backend endpoint used by this app.

**Features to implement.** None new — this is an infrastructure-hardening pass on `api/client.ts` and every `api/*.ts` module built so far.

**Folder structure / files (consolidating what already exists, adding):**
```
src/api/client.ts        (hardened, see below)
src/api/types.ts         (shared request/response TS types, one interface per endpoint response — cross-reference every table in 01-DOCUMENTATION.md §4)
src/api/index.ts         (barrel export of all resource modules)
```

**API integration hardening.**
- **Auth header:** the interceptor added in Prompt 1 read the token synchronously in spirit but `expo-secure-store` is async — confirm/fix this now: axios request interceptors can be async (return a Promise), so `client.ts`'s interceptor should `await getToken()` before setting the header. Verify this actually resolves before every request fires, including the very first request after app launch (a race here would silently send unauthenticated requests right after login).
- **Response error normalization:** a shared response interceptor that catches every failure and normalizes it into a single `ApiError` shape (`{status, message, fieldErrors?}`) using the same `getErrorMessage`/`getFieldErrors` logic from Prompt 1, so no screen has to know whether it's looking at a network error, a validation `400`, or a `5xx` — they all arrive as one predictable shape.
- **401 handling:** since this backend has no refresh-token endpoint (`01-DOCUMENTATION.md §4` — confirmed, don't build a fictional refresh flow), a `401` on any authenticated request should clear the stored token and route the user back to a logged-out state (reuse `AuthContext.logout()`'s clearing logic, but do **not** silently retry the request — there is nothing to refresh to). This is a deliberate, documented gap in the current backend, not a bug in the mobile app to work around cleverly.
- **Retry:** add a light retry-once-with-backoff only for **idempotent GET requests** that fail with a network error (not a `4xx`/`5xx` from the server) — never auto-retry a `POST` (order creation, payment initiate, etc.), since a duplicate submission on a non-idempotent endpoint is a real business risk (e.g. double-charging or double-ordering). Simplest safe implementation: a small wrapper used explicitly by GET-only calls, not a blanket axios-retry interceptor.
- **Timeouts:** set a sane request timeout (e.g. 15s) so a dead connection doesn't hang a screen's loading state indefinitely; surface a clear "request timed out" message distinct from other network errors.

**Documentation cross-check.** Produce (as code comments or a short `api/README.md` if useful — optional, not required) a checklist confirming every customer-facing endpoint listed in `01-DOCUMENTATION.md §4.1–4.8` has a corresponding typed function somewhere in `api/*.ts`, and that nothing under `§4.9` (admin-only) was accidentally called anywhere in this app.

**Validation.** N/A (validation lives in the screens/forms, already built).

**Error handling.** This whole prompt *is* the error-handling hardening pass — the deliverable is that every screen already built (Prompts 2–8) now receives errors through the single normalized `ApiError` shape without needing per-screen special-casing of axios's raw error object.

**Best practices.** No business logic in `api/client.ts` beyond auth/error/retry plumbing — response shaping specific to one resource stays in that resource's own `api/<resource>.ts` file.

**Performance.** Confirm axios isn't creating a new instance per request anywhere (a common accidental regression) — one shared instance, configured once.

**Done when:** every screen's network error paths (test by toggling airplane mode mid-request, and by forcing a `401` by manually clearing the stored token) show a consistent, clear error state, and a `401` cleanly drops the user back to a logged-out state without a crash or an infinite loading spinner.

---

## Prompt 11 — State Management

**Objective.** Finalize the global state layer: wire the live `ThemeSettingsContext` (dynamic brand color) on top of Prompt 1's static theme fallback, confirm the exact provider nesting order end-to-end, and define this app's caching strategy explicitly (what refetches on focus vs. what's fetched once and shared).

**Features to implement.** Live dynamic theming (brand color re-skinning without an app update), a documented/enforced caching strategy across every context and screen built so far.

**Folder structure / files.**
```
src/context/ThemeSettingsContext.tsx
src/hooks/useThemeSettings.ts
src/utils/colorShades.ts
```

**Dynamic theming.** Port `colorShades.ts` (hex↔HSL conversion, `deriveBrandScale(hex)`) directly from the web app's `client/src/utils/colorShades.js` (§10 of the documentation — treats the admin-picked hex as the "600" shade, derives 50/100/500/700/800 by lightness interpolation only). `ThemeSettingsContext` fetches `GET /settings/theme` once on app launch and, unlike the web app's CSS-custom-property trick (not available in React Native), **update the app's theme object in memory** (e.g. a small Zustand-free approach: store the derived scale in `ThemeSettingsContext` state and have `theme/colors.ts`'s consumers read `brand600` etc. through a `useTheme()` hook rather than a static import, so every `components/ui/*` primitive re-renders with the new color the moment the context resolves). Accept the same documented trade-off as web (§2.16): a brief flash of the default color on cold start is acceptable, not worth over-engineering around.

**Provider nesting — finalize and verify against §9 exactly:**
```tsx
<ThemeSettingsProvider>
  <CompanySettingsProvider>
    <CategoriesProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <RootNavigator />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </CategoriesProvider>
  </CompanySettingsProvider>
</ThemeSettingsProvider>
```
Update `App.tsx` to this exact composition (Prompt 1 stubbed this comment, this prompt makes it real).

**Caching strategy (define explicitly, since the backend itself has none — §9 notes the web app has no response-caching layer either, and this app should match that intentionally, not accidentally):**
| Data | Strategy |
|---|---|
| Auth user | Fetched once on launch (`GET /me`), held in context, manually refreshed after profile edits |
| Categories, Company settings, Theme settings | Fetched once per app session on launch, shared via context, no re-fetch unless the app is fully relaunched (these change rarely and are explicitly public/cacheable) |
| Cart, Wishlist | Held in context, re-fetched from server on login/merge, otherwise mutated optimistically-then-confirmed by each action's own response — no periodic re-fetch needed since this app is the only writer of its own cart |
| Product listings, product detail, reviews, questions | Fetched fresh per screen visit (no cache) — catalog/stock data goes stale quickly and must always reflect current server truth, matching why the web app never caches these either |
| Orders | Re-fetch on screen focus (`useFocusEffect`), not just on mount — status can change from outside this app session (courier sync, admin action), per Prompt 7 |

**Validation / Error handling.** N/A — this prompt operates one layer above individual requests.

**Best practices.** Memoize every context's provided value (`useMemo`) so a state change in one context (e.g. `CartContext` updating `items`) doesn't cause unrelated consumers (e.g. a component only reading `ThemeSettingsContext`) to re-render.

**Performance.** Confirm there is no redundant duplicate fetch of `categories`/`company`/`theme` anywhere (a common mistake when a screen built in an earlier prompt fetched one of these locally before the shared context existed — grep for direct `api/categories.ts`/`api/settings.ts` calls outside their context provider and remove them, routing through the shared hook instead).

**Done when:** changing the primary brand color in the (existing, web-only) admin Theme Settings page and relaunching the mobile app reflects the new color across every `components/ui/` primitive with no app-store update, and no screen anywhere issues a redundant duplicate fetch of session-scoped shared data.

---

## Prompt 12 — Final Integration

**Objective.** Connect every module into a cohesive, production-ready app; verify the full customer journey end to end; harden for release; prepare build/deployment configuration.

**Features to implement.** None new — integration, testing, hardening, and build prep only.

**Testing checklist (walk manually against a real dev backend, plus write basic automated coverage where practical — this project's own backend has no test suite documented in §13, so keep the mobile app's coverage focused on the highest-risk pure-logic units rather than chasing full coverage):**
- [ ] Guest can browse Home → Categories → Product Detail → Reviews/Q&A (read-only) with zero login prompts.
- [ ] Guest can build a Cart and Wishlist entirely offline of auth; both persist across an app restart (still logged out).
- [ ] Signup → auto-logged-in → email-verify link flow (manual token entry path) → profile visible.
- [ ] Login (password), OTP login, Google OAuth (webview interception) all reach the same authenticated state.
- [ ] Logging in with a pre-existing guest cart/wishlist correctly merges into a pre-existing server-side cart/wishlist (additive, not overwritten) — test against an account that already has server-side items.
- [ ] Full checkout: COD, Khalti sandbox, eSewa sandbox, and one international address (payment method hidden, flat fee applied, `MANUAL` payment method) — all four produce a correctly-priced `Order` with the right `paymentStatus`.
- [ ] Coupon apply → stale-on-cart-change → re-apply, at checkout.
- [ ] Order list/detail reflect real-time status; cancel within window succeeds and outside window is correctly blocked (server-enforced, client just reflects it); return request submits and shows status; invoice downloads and opens via the OS share sheet.
- [ ] Back-in-stock alert can be requested on an out-of-stock variant (verify the email fires when an admin restocks it in the dev DB, from the web admin panel).
- [ ] Profile edit including avatar upload; change password (both with and without an existing password, e.g. an OTP-only test account); logout returns to a fully usable guest state.
- [ ] Disabled-account scenario: disable a test user from the web admin panel mid-session, confirm the very next authenticated request in the mobile app is rejected and the app routes to a logged-out state with a clear message (per §7.9 — this is a documented, deliberate backend behavior, verify the mobile app honors it correctly rather than caching a stale "still logged in" state).
- [ ] Airplane-mode / slow-network behavior on at least: product list, add-to-cart, place-order — every one must show a clear, durable error state, never a silent failure or an infinite spinner.

**Performance optimization.**
- Profile app startup: `ThemeSettingsProvider`/`CompanySettingsProvider`/`CategoriesProvider` fetches should run in parallel (`Promise.all` or independent effects), not serially, so cold-start-to-interactive isn't the sum of three round trips.
- Confirm every list screen (`ProductListScreen`, `OrdersListScreen`, cart/wishlist) uses `FlatList` with correct `keyExtractor`, and that no screen accidentally re-renders the entire list on every keystroke of an unrelated input.
- Audit `expo-image` usage: every product/banner/avatar image request should carry a Cloudinary width transform matched to its actual rendered size (per Prompts 3/4/8) — grep for any raw untransformed Cloudinary URL slipping through.
- Bundle size sanity check (`npx expo export` + inspect) — confirm no accidental heavy dependency (e.g. a full charting library, unused from the admin-only Reports feature which this app correctly never builds) made it into `package.json`.

**Error handling — final pass.** Confirm the global error boundary: wrap `RootNavigator` in a React error boundary that shows a friendly "Something went wrong" screen with a restart action, rather than a blank white screen, for any uncaught render error. Confirm every screen touched across Prompts 2–8 was actually migrated to Prompt 9's shared `FormError`/`EmptyState`/`LoadingSkeleton` — do a final grep for any leftover bare "Loading…" string or ad hoc error `<Text>`.

**Production readiness / build configuration.**
- `app.config.ts`: real app name/icon/splash screen, bundle identifiers (`ios.bundleIdentifier`/`android.package`), version/build numbers.
- Environment separation: confirm `EXPO_PUBLIC_API_URL` is genuinely different (and correct) across a local-dev build, a staging build if one exists, and a production build pointed at the real deployed backend from `render.yaml`.
- EAS Build configuration (`eas.json`) for at least a `preview` (internal testing, e.g. TestFlight/internal Android track) and a `production` profile.
- Deep-link/URL-scheme registration if the optional Prompt 2 password-reset deep link or any future universal-link work is being carried forward — otherwise explicitly confirm the manual-token-entry fallback is the shipped behavior, not a placeholder.
- Confirm `expo-secure-store` is genuinely used for the token on both iOS and Android (not silently falling back to something insecure on one platform) and that no `console.log` anywhere prints a token, password, or payment field, even in a dev build.
- Icon/splash/store-listing assets are a business/design deliverable outside this document's scope — flag them as an open item rather than inventing placeholder branding.

**Clean architecture / final review.** Confirm the folder structure matches the cumulative structure implied by Prompts 1–11 with no stray files; confirm no screen component directly imports `axios` (everything routes through `api/*.ts`); confirm no screen duplicates logic that a shared hook/util already provides (recheck `pricing.ts`, `variantLabel.ts`, `validators.ts`, `errorHelpers.ts` usage is consistent everywhere).

**Done when:** the full testing checklist above passes against the real dev backend, a preview EAS build installs and runs correctly on a physical Android and iOS device, and the app is ready to hand to app-store review (pending final icon/store-listing assets).

---

*These 12 prompts are meant to be run sequentially, each in its own session, testing and committing after every step — the same discipline the original web platform was built with (see `ecommerce-build-guide-nepal.md §1`: "never ask anyone to build the whole thing"). None of them require modifying `c:\ecommerce\server`.*
