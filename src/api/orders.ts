import { apiClient } from './client';
import { Order, PaymentMethod } from '@/types/order';

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
