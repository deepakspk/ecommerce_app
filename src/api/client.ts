import axios from 'axios';
import { getToken } from '@/utils/storage';

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
