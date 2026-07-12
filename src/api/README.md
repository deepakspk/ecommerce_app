# API coverage — cross-check against `01-DOCUMENTATION.md §4`

One typed function per customer-facing endpoint this app actually needs, verified against every table in §4.1–§4.8. Anything under §4.9 (`/api/admin/*`) is confirmed **not** called anywhere in `src/` — this is the customer app only.

## §4.1 Auth (`api/auth.ts`)

| Endpoint | Covered | Notes |
|---|---|---|
| `POST /signup` | ✅ `signup` | |
| `POST /login` | ✅ `login` | |
| `GET /verify-email/:token` | ❌ | No verify screen was built — signup already auto-logs the user in and email verification is "encouraged but not gating" (§2.1). Unlike password reset, no manual-token-entry fallback exists for this one. Flagging as a real gap, not a deliberate omission. |
| `POST /forgot-password` | ✅ `forgotPassword` | |
| `POST /reset-password/:token` | ✅ `resetPassword` | |
| `POST /otp/request` | ✅ `requestOtp` | |
| `POST /otp/verify` | ✅ `verifyOtp` | |
| `GET /google`, `GET /google/callback` | ✅ (webview) | Never called as a typed function — `GoogleAuthWebViewScreen` points a webview at `/auth/google` directly and intercepts the callback redirect client-side. |
| `GET /me` | ✅ `getMe` | |
| `PUT /profile` | ✅ `updateProfile` | |
| `POST /change-password` | ✅ `changePassword` | |

## §4.2 Products, Categories, Feature Types (`api/products.ts`, `api/categories.ts`, `api/featureTypes.ts`)

| Endpoint | Covered | Notes |
|---|---|---|
| `GET /products` | ✅ `getProducts` | |
| `GET /products/available-filters` | ✅ `getAvailableFilters` | |
| `GET /products/:slug` | ✅ `getProductBySlug` | |
| `GET /categories/tree` | ✅ `getCategoryTree` | Fetched once via `CategoriesContext`, shared everywhere (§9). |
| `GET /categories`, `/categories/root`, `/categories/search`, `/categories/:id`, `/:id/children`, `/:id/breadcrumbs` | ❌ (deliberate) | `/categories/tree` already contains everything the app needs — these are redundant given the single-fetch-shared pattern, not a gap. |
| `GET /feature-types` | ✅ `getFeatureTypes` | |

## §4.3 Reviews & Questions (`api/reviews.ts`, `api/questions.ts`)

All five endpoints covered: `getReviews`, `getReviewEligibility`, `submitReview`, `getQuestions`, `submitQuestion`.

## §4.4 Cart & Wishlist (`api/cart.ts`, `api/wishlist.ts`)

All eleven endpoints covered: `getCart`, `addCartItem`, `updateCartItem`, `removeCartItem`, `clearCart`, `mergeCart`, `applyCoupon`, `getWishlist`, `addWishlistItem`, `removeWishlistItem`, `clearWishlist`, `mergeWishlist`.

## §4.5 Addresses (`api/addresses.ts`)

All five endpoints covered: `getAddresses`, `createAddress`, `updateAddress`, `deleteAddress`, `setDefaultAddress`.

## §4.6 Orders (`api/orders.ts`, `utils/downloadInvoice.ts`)

| Endpoint | Covered | Notes |
|---|---|---|
| `POST /orders` | ✅ `createOrder` | |
| `GET /orders` | ✅ `getOrders` | |
| `GET /orders/:id` | ✅ `getOrder` | |
| `GET /orders/:id/invoice` | ✅ `downloadInvoice` (`utils/`, not `api/orders.ts`) | Streams a raw PDF, not JSON — doesn't fit the `apiGet<T>` JSON contract, so it's a direct authenticated `FileSystem.downloadAsync` call instead. |
| `POST /orders/:id/cancel` | ✅ `cancelOrder` | |
| `GET /orders/:id/return` | ✅ `getReturnRequests` | |
| `POST /orders/:id/return` | ✅ `createReturnRequest` | |

## §4.7 Payments (`api/payments.ts`)

All four endpoints covered: `initiateKhalti`, `verifyKhalti`, `initiateEsewa`, `verifyEsewa`.

## §4.8 Misc (`api/stockAlerts.ts`, `api/banners.ts`, `api/settings.ts`, `api/logistics.ts`)

| Endpoint | Covered | Notes |
|---|---|---|
| `POST /stock-alerts` | ✅ `createStockAlert` | |
| `GET /banners` | ✅ `getBanners` | |
| `GET /settings/company` | ✅ `getCompanySettings` | |
| `GET /settings/theme` | ✅ `getThemeSettings` | Fetched once by `ThemeSettingsContext` (Prompt 11), derives a live brand50-800 ramp via `utils/colorShades.ts`. |
| `GET /logistics/international-fee` | ✅ `getInternationalFee` | |
| `GET /logistics/branches` | ✅ `getBranches` | |
| `POST /logistics/rate` | ✅ `getRate` | |
| `GET /health` | ❌ (deliberate) | Server liveness check, not customer-app-relevant. |

## §4.9 Admin

Confirmed via `grep -r "/admin/" src/` — zero matches. No admin-only endpoint is called anywhere in this app.
