import { apiClient } from './client';
import { ProductDetail, ProductSummary } from '@/types/product';
import { ProductVariant } from '@/types/variant';

export type SortOption = 'newest' | 'price-asc' | 'price-desc';

/** All query params `GET /products` accepts (01-DOCUMENTATION.md §4.2). */
export interface ProductListParams {
  page?: number;
  limit?: number;
  category?: string;
  featureType?: string;
  search?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: SortOption;
}

export interface ProductListResponse {
  products: ProductSummary[];
  total: number;
  page: number;
  pages: number;
}

export function getProducts(params: ProductListParams) {
  return apiClient.get<ProductListResponse>('/products', { params }).then((res) => res.data);
}

export function getProductsByFeatureType(featureTypeSlug: string, limit = 8) {
  return getProducts({ featureType: featureTypeSlug, limit }).then((res) => res.products);
}

export interface AvailableFilters {
  sizes: string[];
  colors: string[];
  priceMin: number;
  priceMax: number;
}

export function getAvailableFilters() {
  return apiClient.get<AvailableFilters>('/products/available-filters').then((res) => res.data);
}

export interface ProductDetailResponse {
  product: ProductDetail;
  variants: ProductVariant[];
  relatedProducts: ProductSummary[];
}

/** Returns the product, every variant, and related products in one call — no extra requests needed (01-DOCUMENTATION.md §2.4). */
export function getProductBySlug(slug: string) {
  return apiClient.get<ProductDetailResponse>(`/products/${slug}`).then((res) => res.data);
}
