/** Mirrors the backend's Review model (01-DOCUMENTATION.md §5). */
export interface Review {
  _id: string;
  productId: string;
  userId: string;
  orderId: string;
  rating: number;
  comment?: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  user?: { name: string };
}

/** `GET /products/:productId/reviews/eligibility` (01-DOCUMENTATION.md §4.3). */
export interface ReviewEligibility {
  hasPurchased: boolean;
  alreadyReviewed: boolean;
  existingReview: Review | null;
}
