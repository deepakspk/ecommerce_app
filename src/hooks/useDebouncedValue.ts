import { useEffect, useState } from 'react';

/** Matches the web app's `useDebouncedValue` (01-DOCUMENTATION.md §2.3) — 400ms default for search inputs. */
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
