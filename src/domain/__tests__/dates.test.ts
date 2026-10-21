import {
  addDays,
  diffInDays,
  isISODate,
  monthGrid,
  parseISODate,
  toISODate,
} from '../dates';

describe('dates', () => {
  it('round-trips local dates', () => {
    expect(toISODate(parseISODate('2026-03-29'))).toBe('2026-03-29');
  });

  it('adds days across months, years and DST changes', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30');
    expect(addDays('2026-10-24', 3)).toBe('2026-10-27');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('computes day differences regardless of DST', () => {
    expect(diffInDays('2026-03-30', '2026-03-28')).toBe(2);
    expect(diffInDays('2026-10-27', '2026-10-24')).toBe(3);
    expect(diffInDays('2026-01-01', '2026-01-29')).toBe(-28);
  });

  it('validates ISO dates', () => {
    expect(isISODate('2026-02-28')).toBe(true);
    expect(isISODate('2026-02-30')).toBe(false);
    expect(isISODate('2026-2-3')).toBe(false);
  });

  it('builds a Monday-first month grid', () => {
    // October 2026 starts on a Thursday.
    const grid = monthGrid(2026, 9);
    expect(grid[0]).toBe('2026-09-28');
    expect(grid[3]).toBe('2026-10-01');
    expect(grid.length % 7).toBe(0);
    expect(grid).toContain('2026-10-31');
  });
});
