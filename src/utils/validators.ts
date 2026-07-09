/**
 * Ported directly from the web app's client/src/utils/validators.js
 * (01-DOCUMENTATION.md §9). Client-side checks are a UX nicety only —
 * the server (01-DOCUMENTATION.md §4) is always the source of truth.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NEPALI_PHONE_RE = /^(\+977)?9[78]\d{8}$/;
const OTP_RE = /^\d{6}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isValidPassword(value: string): boolean {
  return typeof value === 'string' && value.length >= 8;
}

export function isValidNepaliPhone(value: string): boolean {
  return NEPALI_PHONE_RE.test(value.trim());
}

export function isValidOtp(value: string): boolean {
  return OTP_RE.test(value.trim());
}
