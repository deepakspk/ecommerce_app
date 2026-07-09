import { AxiosError } from 'axios';

/**
 * Backend validation error shape (01-DOCUMENTATION.md §4):
 * 400 { message: "Validation failed", errors: [{ path/param, msg, ... }] }
 */
interface ApiErrorBody {
  message?: string;
  errors?: { path?: string; param?: string; msg?: string }[];
}

export function getErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    if (!err.response) {
      return err.code === 'ECONNABORTED'
        ? 'Request timed out. Please try again.'
        : 'Network error. Check your connection and try again.';
    }
    const body = err.response.data as ApiErrorBody | undefined;
    if (body?.message) return body.message;
    if (err.response.status === 401) return 'Please log in to continue.';
    if (err.response.status === 403) return "You don't have permission to do that.";
    if (err.response.status === 404) return 'Not found.';
    return 'Something went wrong. Please try again.';
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

export function getFieldErrors(err: unknown): Record<string, string> {
  if (!isAxiosError(err)) return {};
  const body = err.response?.data as ApiErrorBody | undefined;
  const list = body?.errors;
  if (!Array.isArray(list)) return {};
  const out: Record<string, string> = {};
  for (const item of list) {
    const field = item.path || item.param;
    if (field && item.msg && !out[field]) out[field] = item.msg;
  }
  return out;
}

/** HTTP status of a failed request, if any — lets callers branch on documented error codes (e.g. 401/423/403). */
export function getStatusCode(err: unknown): number | undefined {
  return isAxiosError(err) ? err.response?.status : undefined;
}

function isAxiosError(err: unknown): err is AxiosError {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { isAxiosError?: boolean }).isAxiosError === true
  );
}
