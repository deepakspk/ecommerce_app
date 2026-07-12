import { apiClient } from './client';
import { Address, AddressInput } from '@/types/address';

export function getAddresses() {
  return apiClient.get<{ addresses: Address[] }>('/addresses').then((res) => res.data.addresses);
}

export function createAddress(input: AddressInput) {
  return apiClient.post<{ address: Address }>('/addresses', input).then((res) => res.data.address);
}

export function updateAddress(id: string, input: AddressInput) {
  return apiClient.put<{ address: Address }>(`/addresses/${id}`, input).then((res) => res.data.address);
}

export function deleteAddress(id: string) {
  return apiClient.delete<{ message: string }>(`/addresses/${id}`).then((res) => res.data);
}

export function setDefaultAddress(id: string) {
  return apiClient.patch<{ address: Address }>(`/addresses/${id}/default`).then((res) => res.data.address);
}
