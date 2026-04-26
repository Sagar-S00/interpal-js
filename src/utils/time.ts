/**
 * Parses a raw timestamp value from the API into a `Date`.
 *
 * - `Date` objects are returned as-is.
 * - **Numbers** are treated as **Unix seconds** (the Interpal API convention).
 *   Values larger than `1e10` are assumed to already be milliseconds and are
 *   used directly, which guards against silently mis-parsing millisecond
 *   timestamps as seconds (which would produce dates ~30 years in the future).
 * - Strings are passed through `new Date()`.
 * - `null` / `undefined` return `undefined`.
 *
 * @param value - The raw timestamp to parse
 * @returns A `Date`, or `undefined` if the value cannot be parsed
 */
export const parseTimestamp = (value?: string | number | Date | null): Date | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'number') {
    // Values > 1e10 are likely already milliseconds (year 2001 in ms = ~1_000_000_000_000)
    const ms = value > 1e10 ? value : value * 1_000;
    return new Date(ms);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date;
};


