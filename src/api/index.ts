/**
 * Barrel export of every resource module — one namespace per backend
 * resource, matching `01-DOCUMENTATION.md §4`'s table grouping exactly.
 * Existing screens keep importing named functions directly from their
 * specific `api/<resource>.ts` module; this is a convenience/discoverability
 * surface, not a required import path (02-REACT-NATIVE-PROMPTS.md Prompt 10).
 */
export * as authApi from './auth';
export * as bannersApi from './banners';
export * as campaignsApi from './campaigns';
export * as categoriesApi from './categories';
export * as featureTypesApi from './featureTypes';
export * as settingsApi from './settings';
export * as productsApi from './products';
export * as promotionsApi from './promotions';
export * as questionsApi from './questions';
export * as reviewsApi from './reviews';
export * as stockAlertsApi from './stockAlerts';
export * as cartApi from './cart';
export * as wishlistApi from './wishlist';
export * as addressesApi from './addresses';
export * as logisticsApi from './logistics';
export * as paymentsApi from './payments';
export * as ordersApi from './orders';

export { apiClient, apiGet, setUnauthorizedHandler } from './client';
export type { ApiError } from './types';
export { toApiError } from './types';
