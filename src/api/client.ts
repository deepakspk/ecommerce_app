import axios, { AxiosRequestConfig } from 'axios';
import { getToken } from '@/utils/storage';
import { isAxiosError } from '@/utils/errorHelpers';

/**
 * Same shape as the web app's client/src/api/client.js (01-DOCUMENTATION.md §9),
 * with one necessary difference: the auth-header interceptor must be async,
 * since expo-secure-store (unlike localStorage) has no synchronous read API.
 */
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api';

// eslint-disable-next-line import/no-named-as-default-member -- axios.create is the standard API
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * There's no refresh-token endpoint on this backend (01-DOCUMENTATION.md §4)
 * — a 401 on any authenticated request means the session is dead (expired,
 * disabled account mid-session per §7.9, etc.), never something to silently
 * retry. `AuthProvider` registers itself as the handler on mount rather than
 * this module importing AuthContext directly, which would create a
 * `client -> AuthContext -> api/auth -> client` import cycle. The original
 * error still rejects normally afterward, so every existing catch-site error
 * handling (`getErrorMessage`/`getFieldErrors`/`getStatusCode`) is untouched
 * (02-REACT-NATIVE-PROMPTS.md Prompt 10).
 */
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  },
);

/** A network-level failure (no response reached the client) — distinct from a real 4xx/5xx the server returned. */
function isNetworkError(err: unknown): boolean {
  return isAxiosError(err) && !err.response;
}

const RETRY_DELAY_MS = 500;

/**
 * GET-only retry-once-with-backoff for transient network failures. Every
 * `api/*.ts` read goes through this. Never applied to POST/PUT/PATCH/DELETE —
 * retrying a non-idempotent request risks a real double-submission (a
 * duplicate order, a duplicate charge), so mutations always fail straight
 * through on the first error (02-REACT-NATIVE-PROMPTS.md Prompt 10).
 */
export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    return (await apiClient.get<T>(url, config)).data;
  } catch (err) {
    if (!isNetworkError(err)) throw err;
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return (await apiClient.get<T>(url, config)).data;
  }
}
