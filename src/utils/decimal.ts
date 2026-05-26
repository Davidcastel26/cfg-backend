/**
 * Functional money helpers for DECIMAL(14,4) values.
 *
 * Strategy: convert to a scaled integer (× 10^4), do exact integer arithmetic,
 * then format back to a fixed-4 string. Parsing via `Math.round(n * 1e4)`
 * absorbs IEEE-754 noise (e.g. raw `1.1499999999999999` → `11500`), and the
 * scaled values stay far inside Number.MAX_SAFE_INTEGER for this dataset, so the
 * math is exact without a bignum dependency or a Value Object wrapper.
 */
export const MONEY_SCALE = 4;
const FACTOR = 10 ** MONEY_SCALE;
/** 0.01 expressed in ten-thousandths. */
const CENT_TOLERANCE = 100;

export function toScaled(value: number | string): number {
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid monetary value: ${value}`);
  }
  return Math.round(n * FACTOR);
}

/** Format a scaled integer as a fixed-4 string (no float division). */
export function fromScaled(scaled: number): string {
  const negative = scaled < 0;
  const abs = Math.abs(scaled);
  const intPart = Math.floor(abs / FACTOR);
  const frac = abs % FACTOR;
  return `${negative ? '-' : ''}${intPart}.${String(frac).padStart(MONEY_SCALE, '0')}`;
}

/** Normalize any accepted value to a canonical `"1234.5600"` string. */
export function roundMoney(value: number | string): string {
  return fromScaled(toScaled(value));
}

/** price × integer quantity, exact. */
export function multiplyMoney(price: number | string, quantity: number): string {
  return fromScaled(toScaled(price) * Math.trunc(quantity));
}

/** Sum a list of money values without floating-point drift. */
export function sumMoney(values: ReadonlyArray<number | string>): string {
  return fromScaled(values.reduce<number>((acc, v) => acc + toScaled(v), 0));
}

/** True when |a − b| exceeds 0.01 — used to flag drifted Excel totals. */
export function moneyDiffers(a: number | string, b: number | string): boolean {
  return Math.abs(toScaled(a) - toScaled(b)) > CENT_TOLERANCE;
}
