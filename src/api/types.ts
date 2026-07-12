import { getErrorMessage, getFieldErrors, getStatusCode } from '@/utils/errorHelpers';

/**
 * Every failure a screen can receive — network error, validation `400`, or a
 * `5xx` — normalized into one predictable shape, so no screen needs to know
 * which kind of failure it's looking at (02-REACT-NATIVE-PROMPTS.md Prompt 10).
 * Built on top of the same `getErrorMessage`/`getFieldErrors`/`getStatusCode`
 * logic every screen already calls directly; existing call sites are
 * unaffected, `toApiError` just packages the same three calls for anything
 * new that wants the single-object shape.
 */
export interface ApiError {
  status?: number;
  message: string;
  fieldErrors?: Record<string, string>;
}

export function toApiError(err: unknown): ApiError {
  const fieldErrors = getFieldErrors(err);
  return {
    status: getStatusCode(err),
    message: getErrorMessage(err),
    ...(Object.keys(fieldErrors).length > 0 ? { fieldErrors } : {}),
  };
}
