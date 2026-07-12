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

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  phone?: string;
  /** Local file URI from expo-image-picker — sent as multipart, never a remote URL. */
  avatarUri?: string;
}

/** `PUT /auth/profile` is multipart (01-DOCUMENTATION.md §4.1) — name/email/phone/avatar all optional, sent only when provided. */
export function updateProfile(input: UpdateProfileInput) {
  const form = new FormData();
  if (input.name !== undefined) form.append('name', input.name);
  if (input.email !== undefined) form.append('email', input.email);
  if (input.phone !== undefined) form.append('phone', input.phone);
  if (input.avatarUri) {
    const filename = input.avatarUri.split('/').pop() ?? 'avatar.jpg';
    const ext = /\.(\w+)$/.exec(filename)?.[1]?.toLowerCase() ?? 'jpg';
    form.append('avatar', {
      uri: input.avatarUri,
      name: filename,
      type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    } as unknown as Blob);
  }
  return apiClient
    .put<{ user: User }>('/auth/profile', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data.user);
}

/**
 * `currentPassword` is only required server-side if the account already has
 * one set (e.g. not an OTP/Google-only account) — there's no client-visible
 * flag for this on the `user` shape (§4.1), so it's sent only if the user
 * typed one and the server's own error communicates when it was required.
 */
export function changePassword(input: { newPassword: string; currentPassword?: string }) {
  return apiClient.post<{ message: string }>('/auth/change-password', input).then((res) => res.data);
}
