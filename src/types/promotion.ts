/**
 * Mirrors `GET /promotions` (docs/PROMPT-home-screen.md §API Contract):
 * active within their visibility window, newest first. On mobile always
 * prefer the `mobile*` URL, falling back to the `web*` one.
 */
export interface Promotion {
  _id: string;
  title?: string;
  webBannerUrl?: string;
  mobileBannerUrl?: string;
  webPopupUrl?: string;
  mobilePopupUrl?: string;
}
