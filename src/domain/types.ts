import type { ISODate } from './dates';

export const FLOW_LEVELS = ['none', 'spotting', 'light', 'medium', 'heavy'] as const;
export type FlowLevel = (typeof FLOW_LEVELS)[number];

export const MOODS = ['calm', 'happy', 'energetic', 'sad', 'irritable', 'anxious', 'tired'] as const;
export type Mood = (typeof MOODS)[number];

export const PAIN_MIN = 0;
export const PAIN_MAX = 10;

export const ENERGY_MIN = 1;
export const ENERGY_MAX = 5;

export const SLEEP_QUALITIES = ['poor', 'fair', 'good'] as const;
export type SleepQuality = (typeof SLEEP_QUALITIES)[number];

/** Hormonal situation of the user; it decides what the cycle algorithm may estimate. */
export const LIFE_MODES = [
  'natural',
  'hormonalContraception',
  'tryingToConceive',
  'postpartum',
  'perimenopause',
] as const;
export type LifeMode = (typeof LIFE_MODES)[number];

export const CONTRACEPTION_METHODS = ['pill', 'hormonalIud', 'implant', 'patch', 'ring', 'injection'] as const;
export type ContraceptionMethod = (typeof CONTRACEPTION_METHODS)[number];

/** A life mode in effect from `startDate` until the next entry. History is kept on purpose. */
export interface LifeModeEntry {
  id: string;
  mode: LifeMode;
  startDate: ISODate;
  contraceptionMethod?: ContraceptionMethod;
}

/** Symptoms the user can choose to track. Periods are always tracked. */
export const TRACKABLE_ITEMS = ['flow', 'pain', 'mood', 'energy', 'sleep', 'hotFlashes', 'nightSweats', 'note'] as const;
export type TrackableItem = (typeof TRACKABLE_ITEMS)[number];

export const DEFAULT_TRACKED_ITEMS: TrackableItem[] = ['flow', 'pain', 'mood', 'note'];

/** One menstruation (or bleeding), recorded by the user. `endDate` is unset while it is ongoing. */
export interface PeriodEntry {
  id: string;
  startDate: ISODate;
  endDate?: ISODate;
}

/** Symptoms logged for one calendar day. Every field is optional: users track only what they want. */
export interface DailyLog {
  date: ISODate;
  flow?: FlowLevel;
  pain?: number;
  mood?: Mood;
  energy?: number;
  sleep?: SleepQuality;
  hotFlashes?: boolean;
  nightSweats?: boolean;
  note?: string;
  updatedAt: string;
}

export type ThemePreference = 'system' | 'light' | 'dark';

export interface Settings {
  themePreference: ThemePreference;
  trackedItems: TrackableItem[];
  /** Usual cycle length given by the user, used only while there is no recorded history. */
  typicalCycleLength?: number;
}

export const DEFAULT_SETTINGS: Settings = {
  themePreference: 'system',
  trackedItems: DEFAULT_TRACKED_ITEMS,
};
