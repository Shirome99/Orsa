/**
 * Conversion between stored JSON and `OrsaData`. Stored data is never trusted:
 * unknown fields are dropped and invalid entries skipped, so a partially damaged
 * file degrades gracefully instead of crashing the app.
 */
import { isISODate } from './dates';
import { emptyData, SCHEMA_VERSION, sortedLifeModes, sortedPeriods, type OrsaData } from './records';
import {
  CONTRACEPTION_METHODS,
  DEFAULT_SETTINGS,
  ENERGY_MAX,
  ENERGY_MIN,
  FLOW_LEVELS,
  LIFE_MODES,
  MOODS,
  PAIN_MAX,
  PAIN_MIN,
  SLEEP_QUALITIES,
  TRACKABLE_ITEMS,
  type ContraceptionMethod,
  type DailyLog,
  type FlowLevel,
  type LifeMode,
  type LifeModeEntry,
  type Mood,
  type PeriodEntry,
  type Settings,
  type SleepQuality,
  type TrackableItem,
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

const isOneOf = <T extends string>(values: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (values as readonly string[]).includes(value);

const isIntIn = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;

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
  const { date, flow, pain, mood, energy, sleep, hotFlashes, nightSweats, note, updatedAt } = value;
  if (typeof date !== 'string' || !isISODate(date)) return undefined;
  const log: DailyLog = { date, updatedAt: typeof updatedAt === 'string' ? updatedAt : '' };
  if (isOneOf<FlowLevel>(FLOW_LEVELS, flow)) log.flow = flow;
  if (isIntIn(pain, PAIN_MIN, PAIN_MAX)) log.pain = pain;
  if (isOneOf<Mood>(MOODS, mood)) log.mood = mood;
  if (isIntIn(energy, ENERGY_MIN, ENERGY_MAX)) log.energy = energy;
  if (isOneOf<SleepQuality>(SLEEP_QUALITIES, sleep)) log.sleep = sleep;
  if (typeof hotFlashes === 'boolean') log.hotFlashes = hotFlashes;
  if (typeof nightSweats === 'boolean') log.nightSweats = nightSweats;
  if (typeof note === 'string' && note.trim()) log.note = note;
  return log;
}

function readLifeMode(value: unknown): LifeModeEntry | undefined {
  if (!isObject(value)) return undefined;
  const { id, mode, startDate, contraceptionMethod } = value;
  if (typeof id !== 'string' || !isOneOf<LifeMode>(LIFE_MODES, mode)) return undefined;
  if (typeof startDate !== 'string' || !isISODate(startDate)) return undefined;
  const entry: LifeModeEntry = { id, mode, startDate };
  if (mode === 'hormonalContraception' && isOneOf<ContraceptionMethod>(CONTRACEPTION_METHODS, contraceptionMethod)) {
    entry.contraceptionMethod = contraceptionMethod;
  }
  return entry;
}

function readSettings(value: unknown): Settings {
  const settings: Settings = { ...DEFAULT_SETTINGS, trackedItems: [...DEFAULT_SETTINGS.trackedItems] };
  if (!isObject(value)) return settings;
  const { themePreference, trackedItems, typicalCycleLength } = value;
  if (themePreference === 'system' || themePreference === 'light' || themePreference === 'dark') {
    settings.themePreference = themePreference;
  }
  if (Array.isArray(trackedItems)) {
    settings.trackedItems = TRACKABLE_ITEMS.filter((item): item is TrackableItem => trackedItems.includes(item));
  }
  if (isIntIn(typicalCycleLength, 15, 90)) settings.typicalCycleLength = typicalCycleLength;
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

  if (version === 1) {
    migrateFromV1(data);
  } else {
    if (Array.isArray(parsed.lifeModes)) {
      const byDate = new Map<string, LifeModeEntry>();
      for (const item of parsed.lifeModes) {
        const entry = readLifeMode(item);
        if (entry) byDate.set(entry.startDate, entry); // one mode per start date
      }
      data.lifeModes = sortedLifeModes([...byDate.values()]);
    }
    if (typeof parsed.onboardingCompletedAt === 'string') data.onboardingCompletedAt = parsed.onboardingCompletedAt;
  }
  return data;
}

/**
 * v1 had no life modes nor onboarding. Existing users were implicitly on a natural
 * cycle; they are not sent through the onboarding again if they already have data.
 */
function migrateFromV1(data: OrsaData) {
  const firstDate = [...data.periods.map((p) => p.startDate), ...Object.keys(data.logs)].sort()[0];
  if (firstDate) {
    data.lifeModes = [{ id: 'migrated-v1', mode: 'natural', startDate: firstDate }];
    data.onboardingCompletedAt = 'migrated-v1';
  }
}
