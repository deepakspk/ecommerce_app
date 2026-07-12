import { apiClient } from './client';
import { Order, PaymentMethod } from '@/types/order';
import { ReturnRequest, ReturnRequestItem } from '@/types/return';

export interface CreateOrderInput {
  addressId: string;
  paymentMethod?: PaymentMethod;
  couponCode?: string;
}

/** International addresses have `paymentMethod` force-overridden to `MANUAL` server-side regardless of what's sent. */
export function createOrder(input: CreateOrderInput) {
  return apiClient.post<{ order: Order }>('/orders', input).then((res) => res.data.order);
}

export function getOrders() {
  return apiClient.get<{ orders: Order[] }>('/orders').then((res) => res.data.orders);
}

export function getOrder(orderId: string) {
  return apiClient.get<{ order: Order }>(`/orders/${orderId}`).then((res) => res.data.order);
}

/** Only `PENDING`/`CONFIRMED` orders are eligible — the server's exact error message names the actual current status otherwise. */
export function cancelOrder(orderId: string) {
  return apiClient.post<{ order: Order }>(`/orders/${orderId}/cancel`).then((res) => res.data.order);
}

export function getReturnRequests(orderId: string) {
  return apiClient
    .get<{ returnRequests: ReturnRequest[] }>(`/orders/${orderId}/return`)
    .then((res) => res.data.returnRequests);
}

export function createReturnRequest(orderId: string, items: ReturnRequestItem[]) {
  return apiClient
    .post<{ returnRequest: ReturnRequest }>(`/orders/${orderId}/return`, { items })
    .then((res) => res.data.returnRequest);
}
