/**
 * Caps a Cloudinary image at the actual rendered size, matching the web app's
 * `f_auto,q_auto,w_<n>` transform pattern (01-DOCUMENTATION.md §10) — never
 * ship a full-resolution source image for a small tile/thumbnail.
 */
export function cloudinaryUrl(url: string, width: number): string {
  if (!url) return url;
  const marker = '/upload/';
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  const insertAt = idx + marker.length;
  return `${url.slice(0, insertAt)}f_auto,q_auto,w_${Math.round(width)}/${url.slice(insertAt)}`;
}
