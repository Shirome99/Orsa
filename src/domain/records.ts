/**
 * Pure operations on the user's records. They never mutate their input, so they
 * can be used directly as React state updates and unit-tested in isolation.
 */
import { addDays, diffInDays, type ISODate } from './dates';
import { DEFAULT_SETTINGS, type DailyLog, type PeriodEntry, type Settings } from './types';

export const SCHEMA_VERSION = 1;

/**
 * A period with no recorded end is considered ongoing for at most this many days.
 * Past that, its end is simply unknown (the user probably forgot to close it).
 */
export const MAX_OPEN_PERIOD_DAYS = 10;

export interface OrsaData {
  schemaVersion: typeof SCHEMA_VERSION;
  periods: PeriodEntry[];
  logs: Record<ISODate, DailyLog>;
  settings: Settings;
}

export function emptyData(): OrsaData {
  return { schemaVersion: SCHEMA_VERSION, periods: [], logs: {}, settings: { ...DEFAULT_SETTINGS } };
}

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function sortedPeriods(periods: readonly PeriodEntry[]): PeriodEntry[] {
  return [...periods].sort((a, b) => (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0));
}

/** Last day shown as a period day: the recorded end, or a bounded guess while it is open. */
export function periodDisplayEnd(period: PeriodEntry, todayDate: ISODate): ISODate {
  if (period.endDate) return period.endDate;
  const maxEnd = addDays(period.startDate, MAX_OPEN_PERIOD_DAYS - 1);
  return todayDate < maxEnd ? (todayDate < period.startDate ? period.startDate : todayDate) : maxEnd;
}

export function findPeriodContaining(
  periods: readonly PeriodEntry[],
  date: ISODate,
  todayDate: ISODate,
): PeriodEntry | undefined {
  return periods.find((p) => date >= p.startDate && date <= periodDisplayEnd(p, todayDate));
}

/** The period in progress today, if any (latest period, not ended, started recently). */
export function ongoingPeriod(periods: readonly PeriodEntry[], todayDate: ISODate): PeriodEntry | undefined {
  const latest = sortedPeriods(periods).at(-1);
  if (!latest || latest.endDate || latest.startDate > todayDate) return undefined;
  return diffInDays(todayDate, latest.startDate) < MAX_OPEN_PERIOD_DAYS ? latest : undefined;
}

/**
 * A start entered at most this many days before an existing period moves that
 * period's start earlier (the user is correcting it) instead of creating a new one.
 */
export const START_CORRECTION_DAYS = 7;

/** Records the first day of a period. No-op if the date already belongs to a recorded period. */
export function startPeriod(data: OrsaData, date: ISODate, todayDate: ISODate, id = createId()): OrsaData {
  if (findPeriodContaining(data.periods, date, todayDate)) return data;
  const corrected = data.periods.find(
    (p) => p.startDate > date && diffInDays(p.startDate, date) <= START_CORRECTION_DAYS,
  );
  if (corrected) {
    return {
      ...data,
      periods: sortedPeriods(data.periods.map((p) => (p === corrected ? { ...p, startDate: date } : p))),
    };
  }
  return { ...data, periods: sortedPeriods([...data.periods, { id, startDate: date }]) };
}

/** Records the last day of a period. Ignored if `endDate` is before the start. */
export function endPeriod(data: OrsaData, periodId: string, endDate: ISODate): OrsaData {
  return {
    ...data,
    periods: data.periods.map((p) => (p.id === periodId && endDate >= p.startDate ? { ...p, endDate } : p)),
  };
}

/** Re-opens a period whose end was recorded by mistake. */
export function reopenPeriod(data: OrsaData, periodId: string): OrsaData {
  return {
    ...data,
    periods: data.periods.map((p) => {
      if (p.id !== periodId) return p;
      const { endDate: _removed, ...rest } = p;
      return rest;
    }),
  };
}

export function removePeriod(data: OrsaData, periodId: string): OrsaData {
  return { ...data, periods: data.periods.filter((p) => p.id !== periodId) };
}

export type DailyLogInput = Omit<DailyLog, 'updatedAt'>;

function isEmptyLog(log: DailyLogInput): boolean {
  return log.flow === undefined && log.pain === undefined && log.mood === undefined && !log.note?.trim();
}

/** Saves the log of a day; an entirely empty log removes the entry. */
export function saveDailyLog(data: OrsaData, log: DailyLogInput, now: Date = new Date()): OrsaData {
  const logs = { ...data.logs };
  if (isEmptyLog(log)) {
    delete logs[log.date];
  } else {
    const entry: DailyLog = { date: log.date, updatedAt: now.toISOString() };
    if (log.flow !== undefined) entry.flow = log.flow;
    if (log.pain !== undefined) entry.pain = log.pain;
    if (log.mood !== undefined) entry.mood = log.mood;
    const note = log.note?.trim();
    if (note) entry.note = note;
    logs[log.date] = entry;
  }
  return { ...data, logs };
}

export function updateSettings(data: OrsaData, patch: Partial<Settings>): OrsaData {
  return { ...data, settings: { ...data.settings, ...patch } };
}

export type PeriodDayStatus =
  | { kind: 'future' }
  | { kind: 'outside' }
  | { kind: 'inside'; period: PeriodEntry; isStart: boolean; isRecordedEnd: boolean };

/** How a given day relates to the recorded periods; drives which period actions are offered. */
export function periodStatusOn(periods: readonly PeriodEntry[], date: ISODate, todayDate: ISODate): PeriodDayStatus {
  if (date > todayDate) return { kind: 'future' };
  const period = findPeriodContaining(periods, date, todayDate);
  if (!period) return { kind: 'outside' };
  return { kind: 'inside', period, isStart: period.startDate === date, isRecordedEnd: period.endDate === date };
}
