import type { ISODate } from './dates';

export const FLOW_LEVELS = ['none', 'spotting', 'light', 'medium', 'heavy'] as const;
export type FlowLevel = (typeof FLOW_LEVELS)[number];

export const MOODS = ['calm', 'happy', 'energetic', 'sad', 'irritable', 'anxious', 'tired'] as const;
export type Mood = (typeof MOODS)[number];

export const PAIN_MIN = 0;
export const PAIN_MAX = 10;

/** One menstruation, recorded by the user. `endDate` is unset while it is ongoing. */
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
  note?: string;
  updatedAt: string;
}

export type ThemePreference = 'system' | 'light' | 'dark';

export interface Settings {
  themePreference: ThemePreference;
}

export const DEFAULT_SETTINGS: Settings = {
  themePreference: 'system',
};
