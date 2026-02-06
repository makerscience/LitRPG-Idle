// BigNum utilities — thin wrapper around break_infinity.js Decimal.
// No subclassing. D() is the shorthand constructor, format() is for display.

import Decimal from 'break_infinity.js';

/** Shorthand Decimal constructor. Accepts number, string, or Decimal. */
export function D(value) {
  return new Decimal(value ?? 0);
}

/** Alias of D() for readability at deserialization call sites. */
export function fromJSON(str) {
  return D(str);
}

/**
 * Human-readable display string for a Decimal value.
 *  - Below 1K: exact integer or up to `places` decimals
 *  - 1K–999.9T: suffix notation (K, M, B, T)
 *  - Above: scientific notation (e.g. 1.23e15)
 */
export function format(decimal, places = 0) {
  const d = D(decimal);

  if (d.lt(1e3)) {
    return places > 0 ? d.toFixed(places) : d.floor().toString();
  }

  const suffixes = [
    { threshold: 1e15, suffix: '' },   // fall through to scientific
    { threshold: 1e12, suffix: 'T' },
    { threshold: 1e9,  suffix: 'B' },
    { threshold: 1e6,  suffix: 'M' },
    { threshold: 1e3,  suffix: 'K' },
  ];

  for (const { threshold, suffix } of suffixes) {
    if (d.gte(threshold)) {
      if (!suffix) {
        // Scientific notation for very large numbers
        return d.toExponential(2);
      }
      const scaled = d.div(threshold);
      return scaled.toFixed(scaled.lt(10) ? 2 : scaled.lt(100) ? 1 : 0) + suffix;
    }
  }

  return d.toString();
}

export { Decimal };
