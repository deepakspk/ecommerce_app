import { apiClient } from './client';
import { User } from '@/types/user';

/**
 * One typed function per `/auth` endpoint (01-DOCUMENTATION.md §4.1).
 * Response shapes are returned exactly as documented — no reshaping here.
 */
export interface AuthResponse {
  token: string;
  user: User;
}

export function signup(input: { name: string; email: string; password: string; phone?: string }) {
  return apiClient.post<AuthResponse>('/auth/signup', input).then((res) => res.data);
}

export function login(input: { email: string; password: string }) {
  return apiClient.post<AuthResponse>('/auth/login', input).then((res) => res.data);
}

export function requestOtp(phone: string) {
  return apiClient
    .post<{ message: string }>('/auth/otp/request', { phone })
    .then((res) => res.data);
}

export function verifyOtp(input: { phone: string; code: string }) {
  return apiClient.post<AuthResponse>('/auth/otp/verify', input).then((res) => res.data);
}

export function forgotPassword(email: string) {
  return apiClient
    .post<{ message: string }>('/auth/forgot-password', { email })
    .then((res) => res.data);
}

export function resetPassword(token: string, password: string) {
  return apiClient
    .post<{ message: string }>(`/auth/reset-password/${encodeURIComponent(token)}`, { password })
    .then((res) => res.data);
}

export function getMe() {
  return apiClient.get<{ user: User }>('/auth/me').then((res) => res.data);
}
