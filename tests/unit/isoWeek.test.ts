import {
  computeIsoWeek,
  excelSerialToIsoDate,
  isoWeekBounds,
  toIsoDateString,
} from '../../src/utils/isoWeek';

describe('isoWeek utils', () => {
  it('converts Excel serial dates deterministically (no TZ shift)', () => {
    expect(excelSerialToIsoDate(44933)).toBe('2023-01-07');
  });

  it('normalizes mixed inputs to YYYY-MM-DD', () => {
    expect(toIsoDateString(44933)).toBe('2023-01-07');
    expect(toIsoDateString('2023-01-18')).toBe('2023-01-18');
  });

  it('computes the ISO week', () => {
    expect(computeIsoWeek('2023-01-07')).toEqual({ isoYear: 2023, isoWeek: 1 });
    expect(computeIsoWeek('2023-01-18')).toEqual({ isoYear: 2023, isoWeek: 3 });
  });

  it('computes Monday→Sunday week bounds', () => {
    expect(isoWeekBounds(2023, 3)).toEqual({ weekStart: '2023-01-16', weekEnd: '2023-01-22' });
  });
});
