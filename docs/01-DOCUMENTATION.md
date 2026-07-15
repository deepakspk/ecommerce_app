# Ecommerce Nepal — Complete Project Documentation

Audited directly against the codebase at `c:\ecommerce` (client = Vite+React 19, server = Node/Express 5 + Mongoose 9, MongoDB Atlas). This document is the source of truth used to generate the React Native customer-app rebuild prompts in `02-REACT-NATIVE-PROMPTS.md`.

---

## 1. Project Overview

**Purpose.** A full MERN-stack ecommerce platform built specifically for a retail business in Nepal — plain JavaScript (no TypeScript), MongoDB/Mongoose, Express REST API, React (Vite) storefront + admin back office. Built incrementally, one tested module at a time, per `ecommerce-build-guide-nepal.md` / `-phase2.md`.

**Main objective.** Let a Nepali merchant sell physical products (apparel-style: size/color variants) online, accept Cash-on-Delivery plus the two dominant local digital wallets (eSewa, Khalti), manage inventory/orders/returns, and run the storefront's branding/content without a code deploy (dynamic Settings, Company profile, Theme colors, Banners).

**Target users.**
- **Customers** — Nepali (and some international) shoppers browsing/buying products, tracking orders, requesting returns.
- **Admins** — staff who manage catalog, inventory, orders, returns, coupons, reporting.
- **Super Admins** — a strict superset of Admin, additionally controlling system credentials (SMTP/Cloudinary/payment gateway keys), company profile, theme colors, and who can promote/demote other admins.

**Core features (at a glance).**
- Email/password + Google OAuth + phone-OTP authentication, email verification, password reset, login lockout
- Category-tree browsing (2-level, mega-menu), full-text search, filters (price/size/color/feature-type/rating), sort
- Product detail with size/color variant selection, stock display, rich-text descriptions, reviews & ratings, Q&A, related products, recently-viewed
- Wishlist and Cart, both guest-capable (localStorage) with merge-on-login
- Multi-address book (Nepal province/district/municipality/branch cascade, or international address)
- Checkout with live delivery-fee quoting, coupon codes, 3 payment methods (COD, Khalti, eSewa)
- Order history, order detail, PDF invoice download, customer-initiated cancellation and return/refund requests
- Back-in-stock alerts, abandoned-cart reminder emails, full order-lifecycle transactional emails
- Admin catalog/inventory/order/returns/coupon/reporting/user-management/audit-log back office
- Dynamic system configuration (SMTP, Cloudinary, Khalti, eSewa, Logistics, Application URLs), company profile, theme color, homepage banners — all editable at runtime by a Super Admin, no redeploy
- NCM (Nepal Can Move) courier integration for live delivery-rate quotes and shipment tracking sync

---

## 2. Complete Feature Documentation

### 2.1 Authentication & Account

**What it does.** Lets a visitor register/sign in via email+password, Google OAuth, or phone OTP; verify their email; reset a forgotten password; and manage their own profile/avatar/password once logged in.

**Why it exists.** Nepali shoppers commonly trust phone-based login as much as email; Google OAuth removes friction for password fatigue; email verification and lockout protect account integrity.

**How it works.**
- Passwords hashed with `bcryptjs`; login issues a JWT (`HS256`, 7-day expiry by default) carrying `{sub: userId, role}`.
- 5 failed password attempts within the window locks the account for 15 minutes (`failedLoginAttempts`/`lockUntil` on `User`, checked in `authController.login`).
- Google OAuth is a server-driven redirect flow (Passport.js): client opens `GET /api/auth/google` in a browser context, Google redirects back to the server, the server redirects the browser to `${FRONTEND_URL}/oauth-callback?token=<jwt>`.
- Phone OTP: `POST /api/auth/otp/request` generates and (in dev) console-logs a 6-digit code with a short TTL; `POST /api/auth/otp/verify` exchanges phone+code for a JWT, creating the user on first use.
- A disabled account (`User.status === "DISABLED"`, set by an admin) is rejected at login **and** on every subsequent authenticated request (`protect` middleware re-checks status per-request, not just at login) — so a mid-session ban takes effect on the user's very next API call.
- There is **no refresh-token endpoint** anywhere in this backend — the access token itself is long-lived (7 days) and is the only credential; the client just persists it until it expires or the user logs out.

**User interaction flow.** Signup form → auto-logged-in immediately (email verification is encouraged but not gating) → optional "verify email" link click → profile editable any time from Settings (name/email/phone/avatar) → change password requires current password (unless the account has no password yet, e.g. OTP/Google-only accounts).

**Backend/API interaction.** See §5 Auth table. Token is sent as `Authorization: Bearer <jwt>` on every subsequent request; there is no cookie-based session.

### 2.2 Home / Product Discovery

**What it does.** The storefront root (`/`) doubles as the homepage: when no filters are active it shows a banner carousel + "shop by category" tile grid above the same product grid used by `/products`; the instant any filter/search/category is touched, it behaves as a plain listing page.

**Why it exists.** Avoids maintaining two separate "homepage" and "listing" implementations — one component, one API, a `isHome && !hasActiveFilters` flag decides which extra sections render.

**How it works.** `BannerCarousel` auto-advances every 5s, pauses on hover, supports internal (`react-router` `Link`) or external (`target="_blank"`) banner links, capped at 5 active banners server-side. `CategoryNav` renders a persistent top-level mega-menu (hover-reveal dropdowns for categories with children) on every store page, hidden below the `sm:` breakpoint in favor of the existing filter-pill row on mobile.

**User interaction flow.** Land on `/` → see banners + category tiles + product grid → tap a category tile or nav item → filtered `/products?category=slug` view → tap a subcategory pill (second row, appears once a parent category is active) → further-scoped listing.

**Backend/API interaction.** `GET /api/banners` (active, sorted), `GET /api/categories/tree` (shared via `CategoriesContext`, fetched once app-wide), `GET /api/products` with query filters.

### 2.3 Product Listing, Search & Filters

**What it does.** Paginated product grid with category filter (incl. subcategory pills), free-text search, price range, size/color dropdowns (populated from `GET /api/products/available-filters`), feature-type tabs (e.g. "New Arrivals", "Bestsellers" — admin-defined tags), minimum-rating filter, and sort (`newest`/`price-asc`/`price-desc`).

**Why it exists.** Standard ecommerce discovery; feature types give merchandising flexibility without hardcoding "New Arrivals" logic.

**How it works.** All filters are query params on a single `GET /api/products` call; the client debounces the search box (400ms, `useDebouncedValue`) to avoid a request per keystroke. Each returned product carries a precomputed `finalPrice` (after `discountType`/`discountValue`), `averageRating`/`reviewCount` (server-side aggregation, not computed client-side), and `variantCount`.

**User interaction flow.** Adjust any filter → grid re-fetches → skeleton loading state → results + pagination controls at the bottom.

**Backend/API interaction.** `GET /api/products?page&limit&category&featureType&search&size&color&minPrice&maxPrice&minRating&sort`, `GET /api/products/available-filters`, `GET /api/feature-types`.

### 2.4 Product Detail

**What it does.** Single product page: image gallery, name/price/discount, size+color variant picker (resolves to a specific `ProductVariant` with its own stock/price/SKU/image), quantity stepper, Add to Cart, wishlist toggle, share, tabbed content (rich-text description, additional-information key/value table, shipping info), reviews section, Q&A section, "Related products" rail (same category, in-stock, up to 8), and a "Recently viewed" rail (client-only, localStorage).

**Why it exists.** The core conversion page — must clearly communicate stock/price per exact variant, not per product, since a Medium/Red shirt and a Small/Blue shirt are different SKUs with independent stock.

**How it works.** `GET /api/products/:slug` returns the product, all its variants, and `relatedProducts` in one call. Selecting size+color resolves the matching variant client-side (all variants are already loaded). If the resolved variant has `stockQuantity: 0`, Add to Cart is replaced with a "Notify me when back in stock" button (`POST /api/stock-alerts`). Viewing a product appends its slug to a capped 10-item `localStorage` list (`ecommerce_recently_viewed`) consumed by the rail component on this page and the homepage.

**User interaction flow.** Arrive from listing/search/rail → pick size → pick color → see live stock/price for that combo → adjust quantity (capped at available stock) → Add to Cart (toast/inline confirmation) or Add to Wishlist (heart icon) → scroll to reviews (write one if eligible) or Q&A (ask a question).

**Backend/API interaction.** `GET /api/products/:slug`; `GET/POST /api/products/:productId/reviews`, `GET /api/products/:productId/reviews/eligibility`; `GET/POST /api/products/:productId/questions`; `POST /api/stock-alerts`; cart/wishlist add calls.

### 2.5 Reviews & Ratings

**What it does.** Star rating (1–5) + optional comment per product, gated to customers who actually received that product.

**Why it exists.** Trust signal; prevents fake/incentivized reviews from non-buyers.

**How it works.** Eligibility is computed **server-side**, never trusted from the client: the server resolves every `ProductVariant` belonging to the product, then checks whether the requesting user has an `Order` with `status: "DELIVERED"` containing at least one of those variants. One review per user per product — a second submission **edits** the existing review (upsert), it does not create a duplicate or error. `averageRating`/`reviewCount` are pre-aggregated into every product list/detail response.

**User interaction flow.** Open a product you've received → see "Write a review" (if eligible) or "Purchase this product to leave a review" (if not) → submit rating (+ optional comment) → review appears immediately in the paginated, newest-first list under the product.

**Backend/API interaction.** `GET /api/products/:productId/reviews/eligibility` (protected), `POST /api/products/:productId/reviews`, `GET /api/products/:productId/reviews`.

### 2.6 Product Questions (Q&A)

**What it does.** Any logged-in customer can ask a public question on a product page; an admin answers it; the Q&A thread is visible to all visitors.

**Why it exists.** Pre-purchase questions (fit, material, delivery time) reduce support-channel load and help other shoppers.

**How it works.** `question` (≤500 chars) is required to ask; `answer` (≤2000 chars) is admin-only, written by whichever admin responds (`answeredById`, `answeredAt` stamped). Unanswered questions still display (with an "awaiting answer" state).

**User interaction flow.** Scroll to Q&A tab → read existing Q&A → (if logged in) submit a new question → wait for an admin answer to appear on a future visit.

**Backend/API interaction.** `GET/POST /api/products/:productId/questions` (list public, create protected).

### 2.7 Wishlist

**What it does.** Save products (not specific variants — no size/color/quantity) for later, independent of Cart.

**Why it exists.** Classic "save for later" — a product-level bookmark, since committing to a specific variant only matters at Add-to-Cart time.

**How it works.** Architecturally mirrors Cart exactly: guest wishlist lives in `localStorage["ecommerce_guest_wishlist"]`; a logged-in user's wishlist lives server-side (`Wishlist{userId, items:[{productId}]}`); on login, the guest list is POSTed to `/api/wishlist/merge` (dedupes automatically) and the localStorage key is cleared. No stock or quantity logic applies.

**User interaction flow.** Tap heart icon on any `ProductCard` or the product detail page → toggles instantly → view full list at `/wishlist` → "Move to Cart" on a wishlist item re-fetches the product to resolve a variant to add, or remove individually / clear all.

**Backend/API interaction.** `GET/POST/DELETE /api/wishlist*`, `POST /api/wishlist/merge`.

### 2.8 Cart

**What it does.** Holds `{variantId, quantity}` line items, computes subtotal, persists across sessions for logged-in users, works fully for anonymous guests.

**Why it exists.** Standard ecommerce cart; the guest-cart-then-merge design lets someone shop before creating an account without losing their selections.

**How it works.** Guest items live in `localStorage["ecommerce_guest_cart"]` as denormalized objects (variant + product snapshot, so the cart page can render without extra fetches). On login, `prevUserIdRef` (a ref tracking the previous resolved-auth-state) detects the `logged-out → logged-in` transition and calls `POST /api/cart/merge`; the server merges quantities (`min(serverQty + guestQty, stockQuantity)`, dropping unknown/zero items) into the user's server-side `Cart` document, then the guest key is cleared and the server cart is reloaded. **Note:** on logout the guest key is *not* repopulated from the server cart — logging out simply reveals whatever was already in the (untouched) guest key. Every add/update enforces `quantity ≤ variant.stockQuantity` server-side (and client-side as a UX nicety), returning a specific "insufficient stock" message including the current stock and what's already in the cart.

**User interaction flow.** Add to Cart from listing/detail → cart icon badge updates → `/cart`: adjust quantity (+/− stepper), remove a line, clear cart → "Proceed to Checkout" (requires login — guests are prompted to log in, cart items are preserved through that detour) or "Login to Checkout".

**Backend/API interaction.** `GET/POST /api/cart`, `PUT/DELETE /api/cart/items/:variantId`, `DELETE /api/cart`, `POST /api/cart/merge`, `POST /api/cart/apply-coupon` (preview only).

### 2.9 Addresses

**What it does.** A saved-address book: label, recipient name/phone, and either a Nepal cascading Province→District→City/Municipality→(courier Branch)→Area/Street→Landmark, or a generic international country + free-form fields. One address can be flagged default.

**Why it exists.** Nepal's addressing convention (and the fact that delivery is fulfilled by a courier partner with fixed pickup branches) doesn't map to a generic "street/city/zip" form — landmarks matter for last-mile delivery, and the "branch" field lets the app fetch a real courier rate quote instead of a flat estimate.

**How it works.** `country` defaults to `"Nepal"`; when Nepal, `province` must be one of the 7 official provinces (validated server-side, case-insensitive) and `district`/`city` are required. If the resolved district has courier branch coverage, a `branchName` is required too (used later for live delivery-rate lookups at checkout). Deleting the default address auto-promotes the most recently added remaining address to default.

**User interaction flow.** `/addresses` (or inline inside Checkout/Settings): Add Address → pick country → (Nepal) cascading province/district/municipality/branch selects populate from a static dataset (`nepalGeoData.js`, 7 provinces / 77 districts / 753 municipalities) → save → set as default or edit/delete any saved address.

**Backend/API interaction.** `GET/POST /api/addresses`, `PUT/DELETE /api/addresses/:id`, `PATCH /api/addresses/:id/default`.

### 2.10 Checkout

**What it does.** Turns a cart into an `Order`: pick a saved address, see a live delivery-fee quote, optionally apply a coupon, pick a payment method, place the order.

**Why it exists.** The single highest-stakes flow in the app — correctness here (stock, pricing, coupon validity) must be bulletproof even under concurrent requests.

**How it works.**
- **Delivery fee** resolves in priority order: (1) international address → flat fee from a Super-Admin-configurable setting (default Rs. 3000); (2) domestic address with a courier `branchName` → a live rate quote from the NCM logistics provider; (3) fallback flat fee — Rs. 100 if province is Bagmati, else Rs. 200. Any live-quote failure silently falls back to the flat fee rather than blocking checkout.
- **Coupon** apply is a *preview* (`POST /api/cart/apply-coupon`) — it validates against the current cart subtotal and returns the computed discount but does not persist anything. If the cart changes after applying (subtotal drifts), the UI marks the coupon "stale" and withholds the discount until re-applied.
- **Payment method** is a COD/Khalti/eSewa radio choice — entirely hidden for international orders, which are forced to a `MANUAL` payment method (the merchant arranges payment out-of-band) since neither gateway supports non-Nepal settlement in this build.
- **Order placement** (`POST /api/orders`) runs inside a single MongoDB transaction end-to-end: re-validates every cart item still has sufficient stock, re-validates the coupon (a second, authoritative check — it could have expired or hit its limit between preview and submit), computes `total = max(0, subtotal − discountAmount + deliveryFee)`, creates the `Order` with **snapshotted** address fields and item prices/names (so later address edits or price changes never rewrite order history), decrements variant stock + writes an `InventoryLog` entry per item, increments the coupon's `usedCount`, and only then clears the cart. Any failure aborts the whole transaction — nothing is partially applied.
- For COD (and international/MANUAL), the customer is taken straight to the order-confirmation page. For Khalti/eSewa, the order is created first (as `PENDING`/`PENDING`) and the browser is then redirected into the gateway's hosted checkout (see §2.11).

**User interaction flow.** Cart → Checkout → select/add address → see delivery fee update live → (optional) enter coupon code → apply → choose payment method → Place Order → (COD) order confirmation page; (Khalti/eSewa) redirected to the gateway, then back to a callback page, then order confirmation.

**Backend/API interaction.** `GET /api/addresses`, `GET /api/logistics/international-fee`, `POST /api/logistics/rate`, `POST /api/cart/apply-coupon`, `POST /api/orders`, then payment initiate/verify (§2.11).

### 2.11 Payments — COD, Khalti, eSewa

**What it does.** Three ways to pay: Cash on Delivery (no gateway interaction at all — just an order flag), Khalti ePayment v2, eSewa ePayment v2.

**Why it exists.** COD is still the most-trusted method for a large share of Nepali shoppers; Khalti and eSewa are the two dominant digital wallets, each with meaningfully different integration shapes.

**How it works — critical shared rule: never trust the redirect.** For both gateways, the browser being redirected back to a "success" URL is **not proof of payment** — a server-to-server verification call is mandatory before an `Order.paymentStatus` is ever set to `PAID`.
- **Khalti:** `POST /api/payments/khalti/initiate` (server-side, secret key never leaves the backend) returns a hosted `paymentUrl` + `pidx`; the client does a full-page/webview redirect to it. After the user pays, Khalti redirects to a callback URL with `?pidx=`. The client calls `POST /api/payments/khalti/verify {pidx}`, which does a server-to-server **lookup** call to Khalti. Status mapping: `Completed→PAID`, `Refunded→REFUNDED`, `Expired`/`User canceled→FAILED`, `Pending`/`Initiated`→left `PENDING` (client can re-poll or the customer can retry).
- **eSewa:** eSewa doesn't return a redirect URL — the merchant must auto-submit a real signed HTML `<form method="POST">` (hidden fields, HMAC-SHA256 signature over `total_amount,transaction_uuid,product_code`) directly to eSewa's endpoint. `POST /api/payments/esewa/initiate` returns `{formUrl, fields}`; the client builds and submits that form (a webview navigation, effectively). eSewa redirects back with a base64-encoded `data` param (success) or just a bare `transaction_uuid` query param (failure) — the client extracts `transaction_uuid` either way and calls `POST /api/payments/esewa/verify {transactionUuid}`, which does the equivalent server-to-server status check. Status mapping: `COMPLETE→PAID`, `FULL_REFUND`/`PARTIAL_REFUND→REFUNDED`, `CANCELED`/`NOT_FOUND→FAILED`, `PENDING`/`AMBIGUOUS`→left `PENDING`.
- Every attempt (Khalti or eSewa) creates a `Payment` document recording gateway, amount, transaction/gateway references, and the full raw gateway response, independent of the parent `Order`.
- If verification resolves to `FAILED`, a "payment failed" email fires; the customer can retry payment from the Order detail page (re-invokes initiate) as long as `paymentStatus` is still `PENDING`/`FAILED`.

**User interaction flow.** Choose Khalti/eSewa at checkout → redirected to gateway's hosted page → authenticate + confirm in-wallet → redirected back → app verifies → order confirmation shows real payment status; if it didn't resolve to PAID, a "Pay with {gateway}" retry button is offered.

**Backend/API interaction.** `POST /api/payments/khalti/initiate`, `POST /api/payments/khalti/verify`, `POST /api/payments/esewa/initiate`, `POST /api/payments/esewa/verify`.

### 2.12 Coupons

**What it does.** Percentage or fixed-amount discount codes with optional minimum order value, max discount cap (for percentage types), total usage limit, and per-user usage limit, within an optional date window.

**Why it exists.** Standard promotional lever; the validation is intentionally checked twice (preview at cart, authoritative at order creation) because state (limits, expiry) can change between those two moments, especially under concurrent checkouts.

**How it works.** `computeDiscount`: `PERCENTAGE` → `subtotal × value/100`, capped by `maxDiscountAmount` if set, then capped again to never exceed the subtotal; `FIXED` → flat `value`, same subtotal cap; result rounded to 2 decimals. `perUserLimit` is enforced by counting the user's *total* orders ever placed with that code (any status counts, not just delivered/paid). Redemption (`usedCount++`) happens exactly once, inside the same transaction that creates the order — never at preview time.

**User interaction flow.** Enter a code at Cart or Checkout → Apply → see discount reflected in the order summary → (if cart changes afterward) re-apply prompt → discount is snapshotted onto the final order (`couponCode`, `discountAmount`), immune to later coupon edits.

**Backend/API interaction.** `POST /api/cart/apply-coupon`; implicitly re-validated inside `POST /api/orders`.

### 2.13 Orders — History, Detail, Cancellation, Returns, Invoice

**What it does.** Lists a customer's past orders; a detail view per order with items/pricing/address/payment/status; a downloadable PDF invoice; self-service cancellation while early in the pipeline; a return/refund request once delivered.

**Why it exists.** Post-purchase self-service reduces support load and is expected UX for any ecommerce app.

**How it works.**
- **Status pipeline:** `PENDING → CONFIRMED → PACKED → PICKED → SHIPPED → ARRIVED → OUT_FOR_DELIVERY → DELIVERED`, with `CANCELLED` reachable from any state before `OUT_FOR_DELIVERY` (that terminal-approach state and `DELIVERED` cannot be cancelled). Admin transitions follow a strict adjacency map (no skipping stages); `DELIVERED`/`CANCELLED` are terminal — no further edits.
- **Customer cancellation** (`POST /api/orders/:id/cancel`) is allowed only while `PENDING` or `CONFIRMED`. Cancelling restocks every ordered variant and writes matching `InventoryLog` entries, all inside one transaction with the status flip.
- **Shipment tracking sync:** when the order has an associated courier `Shipment` (NCM), status updates from the courier only ever move the order status *forward* (never regress it), and each forward transition into `PICKED`/`SHIPPED`/`ARRIVED`/`OUT_FOR_DELIVERY`/`DELIVERED` fires a matching lifecycle email. `deliveredAt` is stamped the moment status first reaches `DELIVERED` — this timestamp anchors the return-eligibility window.
- **Return/refund request** (`POST /api/orders/:id/return`) is allowed only when `status === "DELIVERED"` and within a configurable window (default 7 days, `RETURN_WINDOW_DAYS`) of `deliveredAt`. Customers pick specific items + quantities (validated against what was actually ordered) + a reason per item; only one active request (`REQUESTED`/`APPROVED`/`PICKED_UP`) is allowed per order at a time. Admin then transitions it through `APPROVED → PICKED_UP → REFUNDED`; on `REFUNDED` the order's `paymentStatus` flips to `REFUNDED` and a refund `Payment` record is written (this build logs the refund as an admin action — it does not call back into the Khalti/eSewa gateway to trigger a real refund).
- **Invoice** (`GET /api/orders/:id/invoice`) streams a server-generated PDF (line items, totals breakdown, bill-to) directly — no client-side PDF generation.

**User interaction flow.** `/orders` list (each row: date, item count, total, status badge, "Cancel" if eligible) → tap into `/orders/:id` → full breakdown, "Download Invoice", "Cancel order" (if eligible) or, once `DELIVERED`, a "Request return" form (pick items + reason) or view the status of an already-submitted request.

**Backend/API interaction.** `GET /api/orders`, `GET /api/orders/:id`, `GET /api/orders/:id/invoice`, `POST /api/orders/:id/cancel`, `GET/POST /api/orders/:id/return`.

### 2.14 Notifications (Transactional Email)

**What it does.** Fire-and-forget emails at every meaningful order/account lifecycle moment; no SMS or push in this build.

**Why it exists.** Keeps the customer informed without requiring them to poll the app.

**How it works.** All sent via a shared `sendEmail` utility (SMTP settings are Super-Admin-configurable, applied live without a restart). Triggers: order confirmed (right after placement), payment failed (gateway verification resolves FAILED), order-status emails for `PICKED`/`SHIPPED`/`ARRIVED`/`OUT_FOR_DELIVERY`/`DELIVERED` (no email for `PENDING`/`CONFIRMED`/`PACKED`/`CANCELLED` transitions), return-request `APPROVED`/`REJECTED`, back-in-stock (see §2.15), and an abandoned-cart reminder (see below). Every send is wrapped so a failure is logged but never blocks or fails the triggering API request.
**Abandoned-cart rule:** a logged-in user's cart with items, untouched for ≥24h, and not reminded in the last 7 days, and with no order placed in the last 24h, gets exactly one reminder email per eligible window (checked hourly via `setInterval`, no external scheduler dependency).

### 2.15 Back-in-Stock Alerts

**What it does.** "Notify me" on an out-of-stock variant; one email the moment an admin restocks it.

**Why it exists.** Recovers demand that would otherwise bounce off an out-of-stock page.

**How it works.** `POST /api/stock-alerts {variantId}` creates a `StockAlert{userId, variantId, notifiedAt: null}` (deduped — a second click while one is still pending is a friendly no-op). When an admin's stock adjustment causes a variant to cross from 0 to >0, every un-notified alert for that variant gets emailed once and `notifiedAt` is stamped — it's one-shot; the customer must re-subscribe for a future restock.

### 2.16 Dynamic Branding — Company Profile, Theme Color, Banners (Super Admin controlled, customer-visible effect)

**What it does.** A Super Admin can, without a code deploy: set the company name/registration/contact/social links (rendered in the Footer/Navbar), pick a single primary brand hex color (derived into a full 50–800 shade ramp and applied via CSS custom properties across every button/link/badge that already used the brand color token), and manage up to 5 homepage banner images.
**Why it matters for the customer app.** These three settings are public, unauthenticated `GET` endpoints (`/api/settings/company`, `/api/settings/theme`, `/api/banners`) specifically so any client — including a future mobile app — can render current branding without needing admin credentials. A React Native rebuild should fetch and apply these the same way the web app does (see §9 State Management).

### 2.17 Admin Back Office (context only — out of scope for the React Native customer app)

Not rebuilt in the mobile app, but documented for completeness since it shapes the shared backend: Dashboard stats, Product/Variant CRUD with image upload + Excel bulk-upload, Category/FeatureType management, Inventory adjustment + audit trail, Order management (manual creation, status transitions, mark-paid, invoice), Returns queue, Coupon CRUD, User management (role/status, with a SUPER_ADMIN-only 3-way role including itself), system Audit Log, Sales/inventory Reports + CSV export, System Settings (SMTP/Cloudinary/Khalti/eSewa/Logistics/Application, SUPER_ADMIN only, AES-256-GCM-encrypted secrets), Company Settings, Theme Settings, Banner management, and NCM shipment creation/label-printing/tracking-sync. All gated behind `protect + requireRole("ADMIN")`, with a further `requireRole("SUPER_ADMIN")` layer on Settings/Company/Theme.

---

## 3. Complete Customer User Flow

```
App Launch
 ├─ No token stored → treated as guest
 │    └─ Guest cart/wishlist read from localStorage
 └─ Token stored → GET /auth/me to rehydrate user; on 401/failure, token cleared, falls back to guest

Home ("/")
 ├─ Banner carousel + category tile grid + product grid (no active filters)
 ├─ Tap category tile / mega-menu item → Products (filtered)
 ├─ Tap product card → Product Detail
 ├─ Search box → Products (search query)
 └─ Navbar icons: Wishlist, Cart, Account/Login

Browsing → Products Listing
 ├─ Filters: category, subcategory, feature type, search, price range, size, color, min rating
 ├─ Sort: newest / price asc / price desc
 ├─ Pagination
 └─ Tap product card → Product Detail

Product Detail
 ├─ Select size → select color → resolves ProductVariant (price + stock)
 ├─ In stock → set quantity → Add to Cart
 ├─ Out of stock → "Notify me" (requires login) → POST /stock-alerts
 ├─ Wishlist toggle (heart icon)
 ├─ Tabs: Description / Additional Info / Shipping
 ├─ Reviews: read all → (if eligible, i.e. delivered order exists) write/edit a review
 ├─ Q&A: read all → (if logged in) ask a question
 ├─ Related products rail → Product Detail (recursive)
 └─ Recently viewed rail → Product Detail (recursive)

Cart ("/cart")
 ├─ Adjust quantity / remove line / clear cart
 ├─ Not logged in → "Login to Checkout" → Login (cart preserved) → back to Cart → merge fires automatically
 └─ Logged in → "Proceed to Checkout" → Checkout

Authentication
 ├─ Login: email+password, or "Continue with Google" (webview → redirect w/ token), or "Login with OTP"
 ├─ OTP Login: enter phone → request code → enter 6-digit code → verify → logged in
 ├─ Signup: name/email/password(/phone) → auto-logged-in → optional email-verify link
 ├─ Forgot Password → email link → Reset Password (token from link) → Login
 └─ On success from any path → returns to wherever the user was headed (Cart/Checkout) or Home

Checkout ("/checkout", requires login)
 ├─ Select saved address or Add Address (opens Address form)
 ├─ Delivery fee auto-computed from selected address
 ├─ Optional: enter + apply coupon code
 ├─ Choose payment method: COD / Khalti / eSewa (hidden, forced MANUAL, if international address)
 ├─ Place Order → POST /orders (stock + coupon re-validated, order created, cart cleared)
 ├─ COD/MANUAL → straight to Order Detail (confirmation)
 └─ Khalti/eSewa → redirect to gateway → pay → redirect back to Callback page → verify → Order Detail

Orders ("/orders", requires login)
 ├─ List: date, items, total, status badge, Cancel (if eligible)
 └─ Tap a row → Order Detail
      ├─ Full item/price/address/payment breakdown
      ├─ Download Invoice (PDF)
      ├─ Cancel order (if PENDING/CONFIRMED)
      ├─ Retry payment (if Khalti/eSewa still PENDING/FAILED)
      └─ Request return (if DELIVERED, within return window) → status shown once submitted

Profile / Account ("/account", "/settings", "/addresses", "/wishlist", requires login except browsing)
 ├─ Account: profile summary, recent orders, cart/wishlist preview, default address
 ├─ Settings: edit profile (name/email/phone/avatar), change password, embedded Address Book
 ├─ Addresses: full Address Book (add/edit/delete/set default)
 ├─ Wishlist: list, move-to-cart, remove, clear
 └─ Logout → clears token client-side (no server call) → back to guest state, guest cart/wishlist untouched
```

---

## 4. API Documentation

**Base URL:** `${API_URL}/api` (web client env var `VITE_API_URL`, defaults to `http://localhost:5000/api`). **Auth transport:** `Authorization: Bearer <JWT>` header only — no cookies, no CSRF tokens, no refresh-token endpoint. **Validation error shape:** `400 { "message": "Validation failed", "errors": [ {field, msg, ...} ] }` (express-validator). **Rate limiting:** global 300 req/15min on all of `/api/*`, plus tighter limits on login (10/15min) and OTP request (5/10min).

### 4.1 Auth — `/api/auth`

| Method & Path | Auth | Request Body | Success Response | Notable Errors |
|---|---|---|---|---|
| POST `/signup` | public | `name`*, `email`* (valid), `password`* (≥8), `phone` (optional, Nepali format) | `201 {token, user}` | `409` email in use |
| POST `/login` | public, rate-limited | `email`*, `password`* | `200 {token, user}` | `401` bad credentials · `423` locked (15 min after 5 fails) · `403` disabled |
| GET `/verify-email/:token` | public | — | `200 {message}` | `400` invalid/expired |
| POST `/forgot-password` | public | `email`* | `200 {message}` (generic, no enumeration) | — |
| POST `/reset-password/:token` | public | `password`* (≥8) | `200 {message}` | `400` invalid/expired |
| POST `/otp/request` | public, rate-limited | `phone`* (Nepali) | `200 {message}` | — |
| POST `/otp/verify` | public | `phone`*, `code`* (6 chars) | `200 {token, user}` | `400` invalid/expired · `403` disabled |
| GET `/google` | public | — | redirect into Google OAuth | — |
| GET `/google/callback` | public | — | **redirect** to `${FRONTEND_URL}/oauth-callback?token=<jwt>` (or `/login?error=...`) | — |
| GET `/me` | protect | — | `200 {user}` | `401` |
| PUT `/profile` | protect | multipart: `name`, `email`, `phone` (all optional) + file `avatar` | `200 {user}` | `400` email/phone in use |
| POST `/change-password` | protect | `newPassword`* (≥8), `currentPassword` (required if one is set) | `200 {message}` | `400`/`401` |

`user` shape: `{id, name, email, phone, role, avatarUrl, emailVerified, phoneVerified}`. `role` ∈ `CUSTOMER|ADMIN|SUPER_ADMIN`.

### 4.2 Products, Categories, Feature Types

| Method & Path | Auth | Params | Response |
|---|---|---|---|
| GET `/products` | public | `page,limit,category,featureType,search,size,color,minPrice,maxPrice,minRating,sort` | `{products[], total, page, pages}` |
| GET `/products/available-filters` | public | — | `{sizes[], colors[], priceMin, priceMax}` |
| GET `/products/:slug` | public | — | `{product, variants[], relatedProducts[]}` |
| GET `/categories`, `/categories/root` | public | — | `{categories[]}` (root only, active) |
| GET `/categories/tree` | public | — | `{tree[]}` (nested, with `subcategories`) |
| GET `/categories/search?q=` | public | — | `{categories[]}` |
| GET `/categories/:id`, `/:id/children`, `/:id/breadcrumbs` | public | — | `{category}` / `{children[]}` / `{breadcrumbs[]}` |
| GET `/feature-types` | public | — | `{featureTypes[]}` (active, sorted) |

### 4.3 Reviews & Questions (nested under products)

| Method & Path | Auth | Body | Response |
|---|---|---|---|
| GET `/products/:productId/reviews` | public | `page,limit(≤50)` | `{reviews[], total, page, pages}` |
| GET `/products/:productId/reviews/eligibility` | protect | — | `{hasPurchased, alreadyReviewed, existingReview}` |
| POST `/products/:productId/reviews` | protect | `rating`* (1–5 int), `comment` (≤1000) | `{review}` (upsert) — `403` if no delivered order |
| GET `/products/:productId/questions` | public | `page,limit(≤50)` | `{questions[], total, page, pages}` |
| POST `/products/:productId/questions` | protect | `question`* (≤500) | `201 {question}` |

### 4.4 Cart & Wishlist (all `protect`)

| Method & Path | Body | Response |
|---|---|---|
| GET `/cart` | — | `{items[]}` (variant + product populated) |
| POST `/cart/items` | `variantId`*, `quantity` (default 1) | `{message, itemCount}` — `400` insufficient stock |
| PUT `/cart/items/:variantId` | `quantity`* | `{message}` |
| DELETE `/cart/items/:variantId` | — | `{message}` |
| DELETE `/cart` | — | `{message}` |
| POST `/cart/merge` | `items:[{variantId,quantity}]` | `{message}` |
| POST `/cart/apply-coupon` | `code`* | `{code, subtotal, discountAmount, total}` (preview) |
| GET `/wishlist` | — | `{items[]}` |
| POST `/wishlist/items` | `productId`* | `{message, itemCount}` |
| DELETE `/wishlist/items/:productId` | — | `{message}` |
| DELETE `/wishlist` | — | `{message}` |
| POST `/wishlist/merge` | `items:[{productId}]` | `{message}` |

### 4.5 Addresses (all `protect`)

| Method & Path | Body | Response |
|---|---|---|
| GET `/addresses` | — | `{addresses[]}` (default first) |
| POST `/addresses` | `recipientName`*, `phone`*, `country`*, `province`/`district`* (if Nepal), `city`*, `branchName`(required if district has courier coverage), `area`,`street`,`landmark`,`label`,`isDefault` | `201 {address}` |
| PUT `/addresses/:id` | same fields | `{address}` |
| DELETE `/addresses/:id` | — | `{message}` (reassigns default) |
| PATCH `/addresses/:id/default` | — | `{address}` |

### 4.6 Orders (all `protect`)

| Method & Path | Body | Response | Notable Errors |
|---|---|---|---|
| POST `/orders` | `addressId`*, `paymentMethod` (`COD`\|`KHALTI`\|`ESEWA`, default COD; forced `MANUAL` for non-Nepal), `couponCode` | `201 {order}` | `400` empty cart / insufficient stock / bad coupon · `404` address |
| GET `/orders` | — | `{orders[]}` (own, newest first) | |
| GET `/orders/:id` | — | `{order}` | `404` |
| GET `/orders/:id/invoice` | — | streamed PDF | `404` |
| POST `/orders/:id/cancel` | — | `{order}` | `400` not PENDING/CONFIRMED |
| GET `/orders/:id/return` | — | `{returnRequests[]}` | |
| POST `/orders/:id/return` | `items:[{variantId,quantity,reason}]`* | `201 {returnRequest}` | `400` not DELIVERED / outside window / bad item · `409` already in progress |

### 4.7 Payments (all `protect`)

| Method & Path | Body | Response |
|---|---|---|
| POST `/payments/khalti/initiate` | `orderId`* | `{paymentUrl, pidx}` |
| POST `/payments/khalti/verify` | `pidx`* | `{status, order}` |
| POST `/payments/esewa/initiate` | `orderId`* | `{formUrl, fields}` |
| POST `/payments/esewa/verify` | `transactionUuid`* | `{status, order}` |

### 4.8 Misc customer endpoints

| Method & Path | Auth | Response |
|---|---|---|
| POST `/stock-alerts` | protect | `{variantId}*` → `201 {message}` |
| GET `/banners` | public | `{banners[]}` |
| GET `/settings/company` | public | `{company}` (or `{}`) |
| GET `/settings/theme` | public | `{theme}` (defaults if unset) |
| GET `/logistics/international-fee` | protect | `{fee}` |
| GET `/logistics/branches?district=` | protect | `{branches[]}` |
| POST `/logistics/rate` | protect | `{branchName}*` → `{charge}` |
| GET `/health` | public | server liveness check |

### 4.9 Admin API (summary only — not used by the customer app)

All under `/api/admin/*`, `protect + requireRole("ADMIN")` (Settings/Company/Theme additionally require `SUPER_ADMIN`): Categories, Feature Types, Products (+ variants, + bulk Excel upload), Dashboard stats, Orders (manual create/update/status/mark-paid/invoice), Inventory (+adjustment log), Coupons, Returns, Users (role/status), Audit Log, Reports (+CSV export), System Settings, Company Settings, Theme Settings, Banners, Logistics/Shipments (create/track/label/return), plus `GET /admin/ping`.

---

## 5. Data Models

Exact Mongoose schemas as currently defined in `server/src/models/`.

### User
```
_id, name, email(unique,sparse), phone(unique,sparse), passwordHash, avatarUrl,
googleId(unique,sparse), role: CUSTOMER|ADMIN|SUPER_ADMIN (default CUSTOMER),
status: ACTIVE|DISABLED (default ACTIVE), emailVerified, emailVerificationToken/Expires,
passwordResetToken/Expires, phoneVerified, otpCode/otpExpires,
failedLoginAttempts, lockUntil, createdAt
```
```json
{ "_id": "665f1...", "name": "Ramesh Shrestha", "email": "ramesh@example.com",
  "phone": "9801234567", "role": "CUSTOMER", "status": "ACTIVE",
  "emailVerified": true, "phoneVerified": false, "createdAt": "2026-06-01T10:00:00Z" }
```

### Address
```
_id, userId->User, label, recipientName, phone, country(default "Nepal"),
province, district, city, branchName, postalCode, area, street, landmark, isDefault
```
```json
{ "_id": "a1", "userId": "665f1...", "label": "Home", "recipientName": "Ramesh Shrestha",
  "phone": "9801234567", "country": "Nepal", "province": "bagmati", "district": "Kathmandu",
  "city": "Kathmandu", "branchName": "Kathmandu Branch", "area": "Baneshwor",
  "street": "Mid Baneshwor Road", "landmark": "Near City Center", "isDefault": true }
```

### Category
```
_id, name, slug(unique), description, image, parent->Category(nullable),
level, path:[ObjectId->Category], isActive, sortOrder, seoTitle, seoDescription, timestamps
```
```json
{ "_id": "c1", "name": "Shirts", "slug": "shirts", "parent": null, "level": 0,
  "isActive": true, "sortOrder": 0 }
```

### FeatureType
```
_id, name, slug(unique), sortOrder, isActive, createdAt
```

### Product
```
_id, name, slug(unique), shortDescription(HTML,≤500 plain chars), description(HTML),
additionalInformation:[{label,value}], weight(kg,optional), categories:[ObjectId->Category](required, ≥1),
basePrice, discountType: PERCENTAGE|FIXED|null, discountValue, isActive,
images:[{url,altText,sortOrder}], featureTypes:[ObjectId->FeatureType], createdAt
```
```json
{ "_id": "p1", "name": "Classic Oxford Shirt", "slug": "classic-oxford-shirt",
  "shortDescription": "<p>Breathable cotton oxford, tailored fit.</p>",
  "categories": ["c1"], "basePrice": 2200, "discountType": "PERCENTAGE", "discountValue": 10,
  "isActive": true, "images": [{ "url": "https://res.cloudinary.com/.../shirt.jpg", "sortOrder": 0 }],
  "featureTypes": ["ft1"] }
```

### ProductVariant
```
_id, productId->Product, size(default "Default"), color(default "Default"),
sku(unique), price(optional, overrides basePrice), stockQuantity(default 0), imageUrl, isDefault
```
```json
{ "_id": "v1", "productId": "p1", "size": "M", "color": "Blue", "sku": "SHIRT-OX-M-BLU",
  "stockQuantity": 14, "imageUrl": "https://res.cloudinary.com/.../shirt-blue.jpg" }
```

### Cart
```
_id, userId->User(optional), sessionId(unused), items:[{variantId->ProductVariant, quantity}],
lastAbandonedEmailSentAt, timestamps
```

### Wishlist
```
_id, userId->User, items:[{productId->Product}]
```

### Order
```
_id, userId->User,
address: { recipientName, phone, country, province, district, city, branchName, postalCode, area, street, landmark },
status: PENDING|CONFIRMED|PACKED|PICKED|SHIPPED|ARRIVED|OUT_FOR_DELIVERY|DELIVERED|CANCELLED,
subtotal, discountAmount, couponCode, deliveryFee, total,
paymentMethod: ESEWA|KHALTI|COD|MANUAL,
paymentStatus: PENDING|PAID|FAILED|REFUNDED,
items: [{ variantId->ProductVariant, productName, size, color, unitPrice, quantity }],
deliveredAt, createdAt
```
```json
{ "_id": "o1", "userId": "665f1...", "status": "SHIPPED",
  "address": { "recipientName": "Ramesh Shrestha", "country": "Nepal", "province": "bagmati",
    "district": "Kathmandu", "city": "Kathmandu", "phone": "9801234567" },
  "subtotal": 4400, "discountAmount": 440, "couponCode": "WELCOME10", "deliveryFee": 100, "total": 4060,
  "paymentMethod": "KHALTI", "paymentStatus": "PAID",
  "items": [{ "variantId": "v1", "productName": "Classic Oxford Shirt", "size": "M", "color": "Blue",
    "unitPrice": 1980, "quantity": 2 }],
  "createdAt": "2026-07-01T09:00:00Z" }
```

### Payment
```
_id, orderId->Order, gateway: ESEWA|KHALTI|COD, amount, transactionId, gatewayRef,
status: PENDING|PAID|FAILED|REFUNDED, rawResponse(mixed), createdAt
```

### Coupon
```
_id, code(unique,uppercase), type: PERCENTAGE|FIXED, value, minOrderValue, maxDiscountAmount,
usageLimit, usedCount, perUserLimit, startsAt, expiresAt, isActive, timestamps
```
```json
{ "_id": "cp1", "code": "WELCOME10", "type": "PERCENTAGE", "value": 10, "minOrderValue": 1000,
  "maxDiscountAmount": 500, "usageLimit": 1000, "usedCount": 213, "perUserLimit": 1, "isActive": true }
```

### ReturnRequest
```
_id, orderId->Order, userId->User, items:[{variantId->ProductVariant, quantity, reason}],
status: REQUESTED|APPROVED|REJECTED|PICKED_UP|REFUNDED, adminNote, timestamps
```

### InventoryLog
```
_id, variantId->ProductVariant, change(signed), reason, createdAt
```

### StockAlert
```
_id, userId->User, variantId->ProductVariant, notifiedAt(nullable), createdAt
```

### Review
```
_id, productId->Product, userId->User, orderId->Order, rating(1-5), comment,
isVerifiedPurchase(default true), createdAt   -- unique index (productId, userId)
```

### ProductQuestion
```
_id, productId->Product(indexed), userId->User, question(≤500), answer(≤2000, nullable),
answeredById->User(nullable), answeredAt(nullable), timestamps
```

### Shipment (admin/courier — surfaced read-only to customer via order status)
```
_id, orderId->Order(unique), provider, providerShipmentId,
status: BOOKED|PICKED_UP|DISPATCHED|ARRIVED|IN_TRANSIT|OUT_FOR_DELIVERY|DELIVERED|RETURNED|CANCELLED|FAILED,
rawStatus, fromBranch, toBranch, codCharge, deliveryCharge,
trackingEvents:[{status,rawStatus,description,occurredAt}], meta(mixed), lastSyncedAt, timestamps
```

### AuditLog (admin-only)
```
_id, adminUserId->User, action, targetType, targetId, meta(mixed), createdAt
```

### Banner
```
_id, imageUrl, mobileImageUrl(800×400 2:1, may be ""), link, sortOrder, isActive, createdAt
```

### SystemSetting (admin-only)
```
_id, key(unique), value, group, isSecret, description, timestamps
```

### CompanySettings (singleton, public read)
```
_id, companyName, regdNo, vatPan, address, phone, email, description, logoUrl, faviconUrl,
social: { facebook, instagram, tiktok, linkedin, twitter, youtube, whatsapp }, timestamps
```

### ThemeSettings (singleton, public read)
```
_id, primaryColor(#2563eb), secondaryColor(#1e293b), accentColor(#f59e0b),
buttonColor(#2563eb), textColor(#111827), backgroundColor(#ffffff), timestamps
```

---

## 6. Folder Structure

```
c:\ecommerce\
├── client\                      Vite + React 19 SPA (storefront + admin)
│   ├── src\
│   │   ├── api\                 One thin axios module per resource (auth.js, products.js, cart.js, ...)
│   │   ├── components\          Reusable UI primitives + storefront widgets (flat, no subfolders except admin/)
│   │   │   └── admin\           Admin-only shared components
│   │   ├── context\              React Context definitions (Auth, Cart, Wishlist, Categories, CompanySettings, ThemeSettings)
│   │   ├── hooks\                Thin useContext hooks + generic hooks (debounce, click-outside)
│   │   ├── pages\                Route-level screens (customer pages flat, admin under pages/admin/)
│   │   ├── data\                 Static datasets (Nepal geo data, country list)
│   │   ├── utils\                Pure helper functions + the shared design-system tokens (ui.js)
│   │   ├── App.jsx               Route tree + provider composition root
│   │   ├── main.jsx              React DOM entry point
│   │   └── index.css             Tailwind v4 CSS-first theme (@theme tokens)
│   ├── public\                   Static files served as-is (favicon)
│   ├── index.html, vite.config.js, eslint.config.js
│   └── .env / .env.example       VITE_API_URL, etc.
├── server\
│   ├── src\
│   │   ├── config\                Third-party client setup (db, cloudinary, khalti, esewa, ncm, passport, settingsSchema)
│   │   ├── controllers\           Request handlers, one file per resource; admin/ subfolder for admin-only handlers
│   │   ├── logistics\             Courier provider abstraction (logisticsManager.js + providers/ncmProvider.js)
│   │   ├── middleware\            auth (JWT/roles), upload (multer), validate (express-validator wrapper), rateLimiter
│   │   ├── models\                Mongoose schemas, one file per collection + index.js barrel
│   │   ├── routes\                Express routers, one per resource, mounted in server.js
│   │   ├── services\              Cross-cutting business logic (orderService, couponService, deliveryFeeService, trackingService, categoryService, settingsService)
│   │   ├── utils\                 Stateless helpers (sendEmail, orderEmails, invoice, encryption, auditLog, pricing, sanitizeHtml, token, otp, abandonedCart)
│   │   └── server.js              App bootstrap: connect DB → load settings → mount routes → listen
│   ├── scripts\                   One-off/maintenance scripts (seeding, throwaway verification scripts — not part of the app)
│   └── .env / .env.example        Bootstrap-only secrets (MONGODB_URI, JWT_SECRET, ENCRYPTION_KEY, PORT, CLIENT_URL) — everything else lives in dynamic SystemSettings
├── ecommerce-build-guide-nepal.md         Original phased build spec (Prompts 0–8)
├── ecommerce-build-guide-nepal-phase2.md  Phase 2 spec (Prompts 9–16: reviews, coupons, returns, etc.)
├── UI_STYLE_GUIDE.md                      Design-system tokens + consistency roadmap
└── render.yaml                            Deployment config
```

---

## 7. Business Logic

### 7.1 Order lifecycle
Status sequence: `PENDING → CONFIRMED → PACKED → PICKED → SHIPPED → ARRIVED → OUT_FOR_DELIVERY → DELIVERED`; `CANCELLED` reachable from any state up to (not including) `OUT_FOR_DELIVERY`/`DELIVERED`. Admin transitions follow a strict adjacency map — no stage-skipping. `DELIVERED`/`CANCELLED` are terminal; order contents/address/fee become locked. Order placement, stock decrement, coupon redemption, and InventoryLog writes all happen inside one MongoDB transaction — a failure anywhere aborts everything. Shipment-driven status sync only ever moves status forward, never backward, and stamps `deliveredAt` on first arrival at `DELIVERED` (the anchor for the return window).

### 7.2 Payments
COD needs no gateway. Khalti/eSewa both require a mandatory **server-to-server verification** call before `paymentStatus` can become `PAID` — the client-side redirect alone is never trusted. Every attempt is logged as an independent `Payment` document, so retries after a `FAILED`/`PENDING` result don't overwrite history.

### 7.3 Cart & Wishlist
Guest state lives entirely in `localStorage`; server state exists only for logged-in users. Merge-on-login is additive for cart (quantities sum, capped at stock) and additive-only for wishlist (existence union). Logging out does **not** sync the server cart back into the guest localStorage key — it's a client convenience cache, not a mirror.

### 7.4 Reviews
Eligibility (has this user received this product?) is always computed server-side from `Order.status === "DELIVERED"` — a client-supplied "I bought this" flag would never be trusted. One review per user per product, enforced by a unique index; resubmission edits in place.

### 7.5 Cancellation & Returns
Cancel window: `PENDING`/`CONFIRMED` only. Return window: within `RETURN_WINDOW_DAYS` (default 7) of `deliveredAt`, order must be `DELIVERED`, and only one active return request per order at a time. Refunds in this build are **manually logged admin actions**, not real gateway refund API calls.

### 7.6 Coupons
Validated twice: an unauthoritative preview at cart/checkout, then an authoritative re-check inside the same transaction that creates the order (protects against a coupon expiring or hitting its limit between preview and submit). Discount is capped so it can never exceed the subtotal, and is snapshotted onto the order — later coupon edits never retroactively change a past order's discount.

### 7.7 Delivery fee
International → flat admin-configured fee. Domestic with a courier-covered branch → live courier rate quote (falls back silently to flat fee on any lookup error). Domestic without branch coverage → flat Rs. 100 (Bagmati) / Rs. 200 (elsewhere).

### 7.8 Stock alerts & abandoned cart
Stock alerts are one-shot per restock event. Abandoned-cart reminders require ≥24h of cart inactivity, a ≥7-day cooldown between reminders, and are skipped entirely if the user checked out within the last 24h.

### 7.9 Auth & account status
Passwords hashed with bcrypt. 5 failed logins → 15-minute lock. A disabled account is rejected not just at login but on **every** subsequent authenticated request (checked inside the JWT-verification middleware itself), so an admin ban takes effect immediately even against an already-issued token. `SUPER_ADMIN` passes any `requireRole("ADMIN")` check but not vice versa.

---

## 8. UI Components (client, reusable)

| Component | Purpose |
|---|---|
| `Navbar` | Top nav — logo (or uploaded company logo), search, wishlist/cart icons with count badges, account menu, mobile hamburger |
| `CategoryNav` | Persistent mega-menu (hover-flyout dropdowns for categories with children), desktop-only |
| `Layout` | Store page shell composing Navbar + CategoryNav + page content + TrustBadges + Footer |
| `Footer` | Brand/contact/social (from Company Settings), category links, payment method badges |
| `TrustBadges` | Delivery/COD/returns/payment/support icon row |
| `BannerCarousel` | Auto-advancing homepage hero carousel, pause-on-hover, dot indicators |
| `ProductCard` | Grid tile: image, wishlist toggle, rating, price/discount, quick-add |
| `ProductRail` | Horizontal scrollable row of `ProductCard`s with arrow controls |
| `RecentlyViewedRail` | `ProductRail` sourced from localStorage recently-viewed slugs |
| `FeatureRails` | One `ProductRail` per active feature type |
| `StarRating` | Display or interactive 1–5 star control |
| `ProductReviews` | Review list + purchase-gated write/edit form |
| `ProductQuestions` | Q&A thread + ask form |
| `WishlistButton` | Heart-icon toggle wired to WishlistContext |
| `ColorSwatch` | Small circular color indicator |
| `FilterPill` | Reusable toggle-pill for category/feature filters |
| `Pagination` | Numbered pager with ellipsis collapsing |
| `EmptyState` | Icon + title + message + optional action, for empty lists |
| `FormError` / `FieldError` | Error banner / inline field error text |
| `Badge` | Colored status pill (order/payment/return/role/shipment status maps) |
| `AddressForm` | Nepal cascading province/district/municipality/branch select, or generic country form |
| `AddressBook` | List + CRUD + set-default UI wrapping `AddressForm` |
| `ItemThumb` | Small product thumbnail with load-failure fallback |
| `Avatar` | User avatar image or initials-color fallback |
| `UserMenu` | Account dropdown (dashboard/orders/settings/logout) |
| `Seo` | Per-page title/meta/OG tag injection |
| `ProtectedRoute` | Redirects to login if unauthenticated |
| `RichTextEditor` | (Admin) HTML editor for product descriptions |

**Design tokens (`utils/ui.js`):** `INPUT_CLASS`, `LABEL_CLASS`, `BUTTON_PRIMARY`/`_SECONDARY`/`_DANGER`/`_GHOST`, `CARD_CLASS`, `CONTAINER_CLASS`, `PAGE_CLASS`, `H1_CLASS`, `SECTION_HEADING_CLASS`, `MUTED_CLASS`, `BADGE_BASE`, plus consolidated status→color maps (`ORDER_STATUS_COLORS`, `PAYMENT_STATUS_COLORS`, `RETURN_STATUS_COLORS`, `SHIPMENT_STATUS_COLORS`, `USER_ROLE_COLORS`, `USER_STATUS_COLORS`) — the single source of truth referenced throughout `UI_STYLE_GUIDE.md`.

---

## 9. State Management

Pure React Context + hooks — no Redux/Zustand/MobX. Provider nesting in `App.jsx` (outermost → innermost):

```
ThemeSettingsProvider          (public, no auth dependency — applies CSS vars)
  CompanySettingsProvider      (public, no auth dependency)
    CategoriesProvider         (public, no auth dependency)
      AuthProvider             (owns user/token/loading)
        CartProvider           (depends on useAuth())
          WishlistProvider     (depends on useAuth())
            <BrowserRouter><Routes>...</Routes></BrowserRouter>
```

| Context | State | Key actions | Persistence |
|---|---|---|---|
| `AuthContext` | `user, token, loading` | `signup, login, loginWithOtp, loginWithToken, logout, refreshMe` | `localStorage["ecommerce_token"]`; rehydrates via `GET /auth/me` on boot |
| `CartContext` | `items[], loading` (derives `itemCount, subtotal`) | `addItem, updateQuantity, removeItem, clearCart` | `localStorage["ecommerce_guest_cart"]` (guest) or server (logged in); merges on login via `prevUserIdRef` transition detection |
| `WishlistContext` | `items[], itemCount, loading` | `isWishlisted, addItem, removeItem, toggleItem, clearWishlist` | `localStorage["ecommerce_guest_wishlist"]` (guest) or server; same merge pattern as Cart |
| `CompanySettingsContext` | `company, loading` | (read-only) | none — fetched once per app load |
| `ThemeSettingsContext` | `theme, loading` | (read-only) | none — re-derives CSS vars from server every load |
| `CategoriesContext` | `categories[], loading` | (read-only) | none — fetched once, shared by nav/footer/filters |

API client (`api/client.js`): axios instance, `baseURL` from `VITE_API_URL`, request interceptor attaches `Authorization: Bearer <token>` when present. **No response interceptor** — no global 401 handling, no token refresh; each caller handles its own error state.

---

## 10. Assets, Theming & Styling

- **No local image/icon/font assets** beyond a single placeholder `public/favicon.svg` — all product/banner/logo images are hosted on **Cloudinary**, fetched at request-time transform (`f_auto,q_auto,w_<width>`) via `utils/cloudinaryUrl.js`, with `loading="lazy"` and an `onError` fallback.
- **Icons** are inline SVG per-component — no icon library dependency.
- **Fonts** — system font stack only (`font-sans`), deliberately no webfont download, for fastest load on mixed-quality Nepal connections.
- **Styling** — Tailwind CSS v4, CSS-first configuration (`@theme` block directly in `client/src/index.css`, no `tailwind.config.js`). `@tailwindcss/typography` plugin registered for rich-text product descriptions.
- **Color/theme** — a `brand-*` scale (50/100/500/600/700/800) plus semantic `success/warning/danger/info` scales, per `UI_STYLE_GUIDE.md`. The brand scale is **dynamically overridable at runtime**: `ThemeSettingsProvider` fetches the Super-Admin-configured `primaryColor` hex, derives the full ramp (`utils/colorShades.js`, HSL lightness interpolation), and applies it via `document.documentElement.style.setProperty('--color-brand-*', ...)` — every existing Tailwind `brand-*` utility class already resolves through that CSS variable, so no per-component changes are needed to reskin the app.
- **Radius/shadow conventions** — `rounded-md` (buttons/inputs), `rounded-lg` (cards/panels), `rounded-full` (badges/avatars), `rounded-xl` (modals); flat by default, `shadow-sm/md` reserved for hover/elevation.

---

## 11. Dependencies

### Client (`client/package.json`)
| Package | Why |
|---|---|
| `react`, `react-dom` (19.x) | UI runtime |
| `react-router-dom` (7.x) | Client-side routing |
| `axios` | HTTP client with interceptor support for auth header injection |
| `tailwindcss`, `@tailwindcss/vite` | Utility-first styling, CSS-first v4 config |
| `@tailwindcss/typography` | `prose` classes for rich-text product descriptions |
| `react-helmet-async` | Per-page `<title>`/meta/OG tag injection (SEO) |
| `react-quill-new` | Rich-text editor for admin product descriptions (React-19-compatible fork of react-quill) |
| `recharts` | Admin Reports page charts |
| `qrcode`, `jsbarcode` | Admin shipment label generation (QR + barcode) |

### Server (`server/package.json`)
| Package | Why |
|---|---|
| `express` (5.x) | HTTP framework |
| `mongoose` (9.x) | MongoDB ODM, schemas/validation/transactions |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | JWT issuance/verification |
| `express-validator` | Request body/query validation chains |
| `express-rate-limit` | Login/OTP/global rate limiting |
| `helmet` | Security headers |
| `cors` | Origin allowlist (scoped to `CLIENT_URL`) |
| `multer` | Multipart file upload handling (memory storage) |
| `cloudinary` | Image hosting/transform |
| `nodemailer` | Transactional email sending (SMTP, settings-driven) |
| `passport`, `passport-google-oauth20` | Google OAuth strategy |
| `pdfkit` | Server-generated invoice PDFs |
| `sanitize-html` | Server-side HTML sanitization for rich-text fields (XSS defense before `dangerouslySetInnerHTML` on the client) |
| `exceljs` | Admin product bulk-upload via Excel |
| `dotenv` | Bootstrap-only env var loading |

---

## 12. Security

- **Password storage:** bcrypt-hashed, never stored/returned in plaintext; sensitive `User` fields (`otpCode`, reset/verify tokens, `failedLoginAttempts`) are `select:false` by default.
- **JWT:** `HS256`, 7-day default expiry, `Authorization: Bearer` transport only. **No refresh-token mechanism** — a stolen or persisted token remains valid for its full lifetime; there is no server-side revocation list beyond the account-`status` check.
- **Account protection:** 5 failed logins → 15-minute lock; disabled (`status: "DISABLED"`) accounts are rejected at login *and* on every subsequent authenticated request via the `protect` middleware, not just at issuance time.
- **Secrets at rest:** all Super-Admin-configured secrets (SMTP password, Cloudinary API secret, Khalti/eSewa secret keys, logistics API token/webhook secret) are encrypted with **AES-256-GCM** (`utils/encryption.js`, key derived from a required `ENCRYPTION_KEY` env var that itself never lives in the database it protects) before being persisted as `SystemSetting` documents. Leaving a secret field blank on save means "keep existing" (never a way to view a previously-saved secret in plaintext through the API — masked as `••••••••`).
- **Payment integrity:** both Khalti and eSewa flows require a mandatory **server-to-server verification** call before ever marking an order `PAID` — a client-supplied redirect/query-param is never trusted as proof of payment. eSewa signs outbound requests with HMAC-SHA256; secret keys never reach the client.
- **Transport/API hardening:** `helmet()` security headers, CORS locked to a `CLIENT_URL` allowlist (not wide-open), global 300 req/15min rate limit on `/api/*`, tighter limits on login/OTP endpoints specifically.
- **Input validation:** every mutating endpoint has an `express-validator` chain server-side (never trust client-side validation alone); rich-text HTML fields (`Product.description`/`shortDescription`) are sanitized server-side against an allowlist (`sanitize-html`) on every write, since they're rendered via `dangerouslySetInnerHTML`.
- **File upload:** `multer` memory storage, images only, size-capped, uploaded straight to Cloudinary (never written to local disk).
- **Authorization:** role hierarchy enforced server-side (`requireRole`) on every protected route — `SUPER_ADMIN` is a strict superset of `ADMIN` except where a route explicitly demands `SUPER_ADMIN`. Ownership checks (e.g. `Order`, `Address`) always scope queries to `req.user._id` — there is no endpoint that returns another user's private data by guessing an ID.
- **Client-side token storage (web):** JWT kept in `localStorage`, which is vulnerable to XSS-based exfiltration if the app ever introduced an unsanitized-HTML injection point — mitigated by the server-side sanitize-html allowlist above, but worth flagging when porting the *storage* strategy (not just the API) to a new client — see §13 and the React Native prompts for the mobile-appropriate alternative (secure/encrypted storage, not `AsyncStorage`).

---

## 13. Future Improvements

- **Short-lived access token + refresh-token rotation** — the current single 7-day JWT with no revocation is the single biggest security gap; a refresh-token flow (short access token + rotating refresh token in secure storage) would meaningfully reduce blast radius from a leaked token, and matters even more once a mobile client is added.
- **Real gateway refunds** — returns currently log a manual admin action instead of calling Khalti/eSewa's refund APIs; automating this would remove a manual ops step.
- **SMS delivery for OTP** — currently console-logged in development; production needs a real SMS gateway integration for Nepali carriers.
- **Push notifications** — order-status and back-in-stock alerts are email-only today; a mobile app is a natural place to add push (FCM/APNs) as a faster channel than email.
- **`sitemap.xml`/`robots.txt` generation** — explicitly scoped out of the Phase 2 "final polish" prompt, still not built.
- **Guest checkout** — checkout currently requires an account; a true guest-checkout path (email-only, no password) could reduce cart abandonment.
- **Saved payment methods / one-tap repurchase** — no stored payment instrument concept exists (each Khalti/eSewa flow is a fresh redirect).
- **Product comparison** — explicitly deferred in the Phase 2 guide as low priority.
- **Real-time order-status push** (websocket/SSE) instead of pull-on-visit for shipment tracking updates.
- **Internationalization** — UI copy is English-only and Nepal-specific address logic is hardcoded; a second locale or country would need real i18n infrastructure.
- **Automated tests** — no test suite exists in either `client` or `server` (`server`'s `npm test` is a stub); verification has historically been manual/scripted per session. Adding real unit/integration coverage (especially around the transactional order/coupon/stock logic) would reduce regression risk.

---

*This documentation reflects the codebase as of 2026-07-08. The React Native customer-app rebuild prompts in `02-REACT-NATIVE-PROMPTS.md` are written to consume the exact backend documented above with zero server-side changes required.*
