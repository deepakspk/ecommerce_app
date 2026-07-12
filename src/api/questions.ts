import { apiClient, apiGet } from './client';
import { ProductQuestion } from '@/types/question';

export interface QuestionListResponse {
  questions: ProductQuestion[];
  total: number;
  page: number;
  pages: number;
}

export function getQuestions(productId: string, page = 1, limit = 50) {
  return apiGet<QuestionListResponse>(`/products/${productId}/questions`, { params: { page, limit } });
}

export function submitQuestion(productId: string, question: string) {
  return apiClient
    .post<{ question: ProductQuestion }>(`/products/${productId}/questions`, { question })
    .then((res) => res.data.question);
}
