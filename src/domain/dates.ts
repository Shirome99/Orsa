/**
 * Calendar-date helpers working on local "YYYY-MM-DD" strings.
 *
 * Health data is about calendar days, not instants: storing plain local dates
 * avoids timezone and DST shifts (a period logged on the 3rd must stay on the 3rd).
 */

/** A local calendar date formatted as YYYY-MM-DD. */
export type ISODate = string;

const MS_PER_DAY = 86_400_000;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

export function isISODate(value: string): value is ISODate {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number) as [number, number, number, number];
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export function toISODate(date: Date): ISODate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseISODate(value: ISODate): Date {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) throw new Error('Invalid ISO date');
  const [, y, m, d] = match.map(Number) as [number, number, number, number];
  return new Date(y, m - 1, d);
}

export function today(now: Date = new Date()): ISODate {
  return toISODate(now);
}

export function addDays(value: ISODate, days: number): ISODate {
  const date = parseISODate(value);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** Number of days from `from` to `to` (positive when `to` is later). */
export function diffInDays(to: ISODate, from: ISODate): number {
  const a = parseISODate(to);
  const b = parseISODate(from);
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcA - utcB) / MS_PER_DAY);
}

export function compareISODate(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isBetween(value: ISODate, start: ISODate, end: ISODate): boolean {
  return value >= start && value <= end;
}

/** Returns the dates of a month grid (weeks starting on Monday), padded with adjacent-month days. */
export function monthGrid(year: number, monthIndex: number): ISODate[] {
  const first = new Date(year, monthIndex, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = toISODate(new Date(year, monthIndex, 1 - mondayOffset));
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cellCount = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;
  return Array.from({ length: cellCount }, (_, i) => addDays(start, i));
}
