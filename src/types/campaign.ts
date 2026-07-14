import { ProductSummary } from './product';

/**
 * Mirrors `GET /campaigns/home` (docs/PROMPT-home-screen.md §API Contract):
 * only running, storefront-visible campaigns with ≥1 sellable product, in
 * admin sort order. Each carries its first 10 products plus the total
 * `productCount` so the rail can show a "+N more deals" tile.
 */
export interface Campaign {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: string;
  desktopBannerUrl?: string;
  mobileBannerUrl?: string;
  actionImageUrl?: string;
  buttonLabel?: string;
  themeColor?: string;
  products: ProductSummary[];
  productCount: number;
}
