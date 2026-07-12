const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api';

/** The API's origin (no `/api` suffix) — some endpoints (banners, categories) serve relative image paths off of this, not Cloudinary. */
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

/** Resolves a possibly-relative image path (e.g. `/banners/x.svg`) against the API's origin; absolute URLs pass through unchanged. */
export function resolveAssetUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url}`;
}
