/**
 * Pure operations on the user's records. They never mutate their input, so they
 * can be used directly as React state updates and unit-tested in isolation.
 */
import { addDays, diffInDays, type ISODate } from './dates';
import {
  DEFAULT_SETTINGS,
  type ContraceptionMethod,
  type DailyLog,
  type LifeMode,
  type LifeModeEntry,
  type PeriodEntry,
  type Settings,
  type TrackableItem,
} from './types';

/** v2: life mode history, tracked items, onboarding. v1 data is migrated on load. */
export const SCHEMA_VERSION = 2;

/**
 * A period with no recorded end is considered ongoing for at most this many days.
 * Past that, its end is simply unknown (the user probably forgot to close it, or
 * entered only a start date during onboarding).
 */
export const MAX_OPEN_PERIOD_DAYS = 10;
/** Days shown in the calendar for a past period whose end is unknown. */
export const UNKNOWN_END_DISPLAY_DAYS = 5;

export interface OrsaData {
  schemaVersion: typeof SCHEMA_VERSION;
  periods: PeriodEntry[];
  logs: Record<ISODate, DailyLog>;
  /** Life modes sorted by start date. Empty means "natural cycle" (the default). */
  lifeModes: LifeModeEntry[];
  settings: Settings;
  /** ISO timestamp; unset until the user has gone through the onboarding. */
  onboardingCompletedAt?: string;
}

export function emptyData(): OrsaData {
  return {
    schemaVersion: SCHEMA_VERSION,
    periods: [],
    logs: {},
    lifeModes: [],
    settings: { ...DEFAULT_SETTINGS, trackedItems: [...DEFAULT_SETTINGS.trackedItems] },
  };
}

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function sortedPeriods(periods: readonly PeriodEntry[]): PeriodEntry[] {
  return [...periods].sort((a, b) => (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0));
}

/**
 * Last day shown as a period day: the recorded end; up to today while it may still
 * be ongoing; otherwise a conventional length (its real end is unknown).
 */
export function periodDisplayEnd(period: PeriodEntry, todayDate: ISODate): ISODate {
  if (period.endDate) return period.endDate;
  if (todayDate < period.startDate) return period.startDate;
  if (diffInDays(todayDate, period.startDate) < MAX_OPEN_PERIOD_DAYS) return todayDate;
  return addDays(period.startDate, UNKNOWN_END_DISPLAY_DAYS - 1);
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

/** Keeps only the fields that carry a value (an untouched field stays absent). */
function compactLog(log: DailyLogInput): DailyLogInput {
  const entry: DailyLogInput = { date: log.date };
  if (log.flow !== undefined) entry.flow = log.flow;
  if (log.pain !== undefined) entry.pain = log.pain;
  if (log.mood !== undefined) entry.mood = log.mood;
  if (log.energy !== undefined) entry.energy = log.energy;
  if (log.sleep !== undefined) entry.sleep = log.sleep;
  if (log.hotFlashes !== undefined) entry.hotFlashes = log.hotFlashes;
  if (log.nightSweats !== undefined) entry.nightSweats = log.nightSweats;
  const note = log.note?.trim();
  if (note) entry.note = note;
  return entry;
}

/** Saves the log of a day; an entirely empty log removes the entry. */
export function saveDailyLog(data: OrsaData, log: DailyLogInput, now: Date = new Date()): OrsaData {
  const logs = { ...data.logs };
  const entry = compactLog(log);
  if (Object.keys(entry).length === 1) {
    delete logs[log.date];
  } else {
    logs[log.date] = { ...entry, updatedAt: now.toISOString() };
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

export function sortedLifeModes(entries: readonly LifeModeEntry[]): LifeModeEntry[] {
  return [...entries].sort((a, b) => (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0));
}

/** Life mode in effect on a date (natural cycle when nothing was declared before that date). */
export function lifeModeOn(entries: readonly LifeModeEntry[], date: ISODate): LifeModeEntry {
  const entry = sortedLifeModes(entries)
    .filter((e) => e.startDate <= date)
    .at(-1);
  return entry ?? { id: 'default', mode: 'natural', startDate: date };
}

/**
 * Declares a life mode starting on `startDate`. A change made on the same day replaces
 * that day's entry; choosing again the mode already in effect adds nothing.
 */
export function setLifeMode(
  data: OrsaData,
  mode: LifeMode,
  startDate: ISODate,
  contraceptionMethod?: ContraceptionMethod,
  id = createId(),
): OrsaData {
  const others = data.lifeModes.filter((e) => e.startDate !== startDate);
  const method = mode === 'hormonalContraception' ? contraceptionMethod : undefined;
  const previous = others.some((e) => e.startDate < startDate) ? lifeModeOn(others, startDate) : undefined;
  if (previous && previous.mode === mode && previous.contraceptionMethod === method) {
    return { ...data, lifeModes: sortedLifeModes(others) };
  }
  const entry: LifeModeEntry = { id, mode, startDate };
  if (method) entry.contraceptionMethod = method;
  return { ...data, lifeModes: sortedLifeModes([...others, entry]) };
}

export interface OnboardingAnswers {
  mode: LifeMode;
  contraceptionMethod?: ContraceptionMethod;
  /** First days of the last known periods (optional). */
  periodStarts: ISODate[];
  typicalCycleLength?: number;
  trackedItems: TrackableItem[];
}

export function completeOnboarding(
  data: OrsaData,
  answers: OnboardingAnswers,
  todayDate: ISODate,
  now: Date = new Date(),
): OrsaData {
  let next = data;
  const starts = [...new Set(answers.periodStarts)].filter((d) => d <= todayDate).sort();
  for (const start of starts) next = startPeriod(next, start, todayDate);
  // The declared mode covers the history entered, so those cycles are interpreted with it.
  const modeStart = starts[0] ?? todayDate;
  next = setLifeMode({ ...next, lifeModes: [] }, answers.mode, modeStart, answers.contraceptionMethod);
  const settings: Settings = { ...next.settings, trackedItems: [...answers.trackedItems] };
  if (answers.typicalCycleLength !== undefined) settings.typicalCycleLength = answers.typicalCycleLength;
  else delete settings.typicalCycleLength;
  return { ...next, settings, onboardingCompletedAt: now.toISOString() };
}
