/**
 * Conversion between stored JSON and `OrsaData`. Stored data is never trusted:
 * unknown fields are dropped and invalid entries skipped, so a partially damaged
 * file degrades gracefully instead of crashing the app.
 */
import { isISODate } from './dates';
import { emptyData, SCHEMA_VERSION, sortedPeriods, type OrsaData } from './records';
import {
  DEFAULT_SETTINGS,
  FLOW_LEVELS,
  MOODS,
  PAIN_MAX,
  PAIN_MIN,
  type DailyLog,
  type FlowLevel,
  type Mood,
  type PeriodEntry,
  type Settings,
} from './types';

export class StoredDataError extends Error {
  constructor(reason: string) {
    // The message never contains user data, only the reason.
    super(`Stored data is unreadable: ${reason}`);
    this.name = 'StoredDataError';
  }
}

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function readPeriod(value: unknown): PeriodEntry | undefined {
  if (!isObject(value)) return undefined;
  const { id, startDate, endDate } = value;
  if (typeof id !== 'string' || typeof startDate !== 'string' || !isISODate(startDate)) return undefined;
  const period: PeriodEntry = { id, startDate };
  if (typeof endDate === 'string' && isISODate(endDate) && endDate >= startDate) period.endDate = endDate;
  return period;
}

function readLog(value: unknown): DailyLog | undefined {
  if (!isObject(value)) return undefined;
  const { date, flow, pain, mood, note, updatedAt } = value;
  if (typeof date !== 'string' || !isISODate(date)) return undefined;
  const log: DailyLog = { date, updatedAt: typeof updatedAt === 'string' ? updatedAt : '' };
  if (typeof flow === 'string' && (FLOW_LEVELS as readonly string[]).includes(flow)) log.flow = flow as FlowLevel;
  if (typeof pain === 'number' && Number.isInteger(pain) && pain >= PAIN_MIN && pain <= PAIN_MAX) log.pain = pain;
  if (typeof mood === 'string' && (MOODS as readonly string[]).includes(mood)) log.mood = mood as Mood;
  if (typeof note === 'string' && note.trim()) log.note = note;
  return log;
}

function readSettings(value: unknown): Settings {
  const settings: Settings = { ...DEFAULT_SETTINGS };
  if (!isObject(value)) return settings;
  const { themePreference } = value;
  if (themePreference === 'system' || themePreference === 'light' || themePreference === 'dark') {
    settings.themePreference = themePreference;
  }
  return settings;
}

export function serialize(data: OrsaData): string {
  return JSON.stringify(data);
}

/** Parses stored JSON. Throws `StoredDataError` if it is not readable at all. */
export function deserialize(raw: string): OrsaData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new StoredDataError('invalid JSON');
  }
  if (!isObject(parsed)) throw new StoredDataError('not an object');
  const version = parsed.schemaVersion;
  if (typeof version !== 'number') throw new StoredDataError('missing schema version');
  if (version > SCHEMA_VERSION) throw new StoredDataError('saved by a newer version of Orsa');
  // Future schema migrations go here (version < SCHEMA_VERSION).

  const data = emptyData();
  if (Array.isArray(parsed.periods)) {
    const seen = new Set<string>();
    for (const item of parsed.periods) {
      const period = readPeriod(item);
      if (period && !seen.has(period.id)) {
        seen.add(period.id);
        data.periods.push(period);
      }
    }
    data.periods = sortedPeriods(data.periods);
  }
  if (isObject(parsed.logs)) {
    for (const [key, item] of Object.entries(parsed.logs)) {
      const log = readLog(item);
      if (log && log.date === key) data.logs[key] = log;
    }
  }
  data.settings = readSettings(parsed.settings);
  return data;
}
