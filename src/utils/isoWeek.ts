import {
  addWeeks,
  endOfISOWeek,
  format,
  getISOWeek,
  getISOWeekYear,
  isValid,
  parseISO,
  startOfISOWeek,
} from 'date-fns';

const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);
const MS_PER_DAY = 86_400_000;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface IsoWeekParts {
  isoYear: number;
  isoWeek: number;
}

/** Excel serial date (e.g. 44933) → 'YYYY-MM-DD', computed in UTC (no TZ shift). */
export function excelSerialToIsoDate(serial: number): string {
  if (!Number.isFinite(serial)) throw new Error(`Invalid Excel serial date: ${serial}`);
  const d = new Date(EXCEL_EPOCH_MS + Math.round(serial) * MS_PER_DAY);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
    d.getUTCDate(),
  ).padStart(2, '0')}`;
}

/** Normalize a number (Excel serial), Date, or string to 'YYYY-MM-DD'. */
export function toIsoDateString(input: string | number | Date): string {
  if (typeof input === 'number') return excelSerialToIsoDate(input);
  if (input instanceof Date) {
    if (!isValid(input)) throw new Error(`Invalid Date value: ${String(input)}`);
    return format(input, 'yyyy-MM-dd');
  }
  const trimmed = input.trim();
  if (ISO_DATE_RE.test(trimmed)) {
    if (Number.isNaN(Date.parse(trimmed))) throw new Error(`Invalid calendar date: "${input}"`);
    return trimmed;
  }
  const parsed = parseISO(trimmed);
  if (!isValid(parsed)) throw new Error(`Unrecognized date format: "${input}"`);
  return format(parsed, 'yyyy-MM-dd');
}

function localDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** ISO-8601 (year, week) for a calendar date or Excel serial. */
export function computeIsoWeek(input: string | number | Date): IsoWeekParts {
  const date = input instanceof Date ? input : localDate(toIsoDateString(input));
  return { isoYear: getISOWeekYear(date), isoWeek: getISOWeek(date) };
}

/** Monday→Sunday calendar bounds of an ISO week (anchored on Jan 4). */
export function isoWeekBounds(isoYear: number, isoWeek: number): {
  weekStart: string;
  weekEnd: string;
} {
  const monday = addWeeks(startOfISOWeek(new Date(isoYear, 0, 4)), isoWeek - 1);
  return { weekStart: format(monday, 'yyyy-MM-dd'), weekEnd: format(endOfISOWeek(monday), 'yyyy-MM-dd') };
}
