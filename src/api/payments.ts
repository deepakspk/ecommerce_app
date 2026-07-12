import { apiClient } from './client';
import { EsewaInitiateResponse, KhaltiInitiateResponse, PaymentVerifyResponse } from '@/types/payment';

export function initiateKhalti(orderId: string) {
  return apiClient.post<KhaltiInitiateResponse>('/payments/khalti/initiate', { orderId }).then((res) => res.data);
}

export function verifyKhalti(pidx: string) {
  return apiClient.post<PaymentVerifyResponse>('/payments/khalti/verify', { pidx }).then((res) => res.data);
}

export function initiateEsewa(orderId: string) {
  return apiClient.post<EsewaInitiateResponse>('/payments/esewa/initiate', { orderId }).then((res) => res.data);
}

/** Body field is `transactionUuid` (camelCase) — even though eSewa's own gateway fields use snake_case. */
export function verifyEsewa(transactionUuid: string) {
  return apiClient
    .post<PaymentVerifyResponse>('/payments/esewa/verify', { transactionUuid })
    .then((res) => res.data);
}
