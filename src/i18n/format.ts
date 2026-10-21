import { parseISODate, type ISODate } from '@/domain/dates';

const LOCALE = 'fr-FR';

const longDate = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
const shortDate = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long' });
const monthYear = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' });

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Mercredi 21 octobre" */
export function formatLongDate(date: ISODate): string {
  return capitalize(longDate.format(parseISODate(date)));
}

/** "21 octobre" */
export function formatShortDate(date: ISODate): string {
  return shortDate.format(parseISODate(date));
}

/** "Octobre 2026" */
export function formatMonthYear(year: number, monthIndex: number): string {
  return capitalize(monthYear.format(new Date(year, monthIndex, 1)));
}

/** Monday-first short weekday names: "lun.", "mar.", … */
export const WEEKDAY_SHORT = Array.from({ length: 7 }, (_, i) =>
  new Intl.DateTimeFormat(LOCALE, { weekday: 'short' }).format(new Date(2026, 0, 5 + i)),
);
