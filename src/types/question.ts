/** Mirrors the backend's ProductQuestion model (01-DOCUMENTATION.md §5). */
export interface ProductQuestion {
  _id: string;
  productId: string;
  userId: string;
  question: string;
  answer?: string;
  answeredById?: string;
  answeredAt?: string;
  createdAt: string;
  user?: { name: string };
}
