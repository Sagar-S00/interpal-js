/**
 * Normalizes an API response that may be either a plain array or an object
 * containing an array under a specific key.
 *
 * Many Interpal API endpoints return either:
 *   - A bare array:  `[{ id: '1', ... }, ...]`
 *   - A wrapper object: `{ results: [...] }`, `{ messages: [...] }`, etc.
 *
 * This utility handles both shapes so callers do not need to repeat the
 * Array.isArray check everywhere.
 *
 * @param data - The raw value returned from the API
 * @param key  - The object key to look up when data is not an array (default: `'results'`)
 * @returns    The extracted array cast to `T[]`, or an empty array if nothing matches
 *
 * @example
 * const users = normalizeList<UserData>(apiResponse, 'results');
 * const msgs  = normalizeList<MessageData>(apiResponse, 'messages');
 */
export function normalizeList<T>(data: unknown, key = 'results'): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (data !== null && typeof data === 'object') {
    const nested = (data as Record<string, unknown>)[key];
    if (Array.isArray(nested)) {
      return nested as T[];
    }
  }

  return [];
}
