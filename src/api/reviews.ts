import { apiClient, apiGet } from './client';
import { Review, ReviewEligibility } from '@/types/review';

export interface ReviewListResponse {
  reviews: Review[];
  total: number;
  page: number;
  pages: number;
}

export function getReviews(productId: string, page = 1, limit = 10) {
  return apiGet<ReviewListResponse>(`/products/${productId}/reviews`, { params: { page, limit } });
}

/** Only call when logged in — protected endpoint (01-DOCUMENTATION.md §4.3). */
export function getReviewEligibility(productId: string) {
  return apiGet<ReviewEligibility>(`/products/${productId}/reviews/eligibility`);
}

/** Upsert — a second submission edits the existing review rather than erroring (01-DOCUMENTATION.md §2.5). */
export function submitReview(productId: string, input: { rating: number; comment?: string }) {
  return apiClient
    .post<{ review: Review }>(`/products/${productId}/reviews`, input)
    .then((res) => res.data.review);
}
