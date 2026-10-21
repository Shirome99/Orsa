/**
 * Situations where Orsa gently suggests talking to a health professional
 * (CLAUDE.md: "suggérer avec douceur … sans alarmer"). These are observations on
 * the user's own records, never a diagnosis.
 */
import { addDays, diffInDays, type ISODate } from './dates';
import { lifeModeOn, sortedPeriods } from './records';
import type { DailyLog, LifeModeEntry, PeriodEntry } from './types';

export const CARE_LOOKBACK_DAYS = 90;
export const STRONG_PAIN_THRESHOLD = 8;
export const STRONG_PAIN_MIN_DAYS = 3;
export const HEAVY_FLOW_MIN_DAYS = 5;
/** Without a period for this long (natural cycle modes), a check-up may be worth it. */
export const LONG_ABSENCE_DAYS = 90;

export type CareSuggestion =
  | { kind: 'strongPain'; days: number }
  | { kind: 'heavyFlow'; days: number }
  | { kind: 'longAbsence'; days: number };

export function careSuggestions(
  logs: Readonly<Record<ISODate, DailyLog>>,
  periods: readonly PeriodEntry[],
  lifeModes: readonly LifeModeEntry[],
  todayDate: ISODate,
): CareSuggestion[] {
  const since = addDays(todayDate, -(CARE_LOOKBACK_DAYS - 1));
  const recent = Object.values(logs).filter((l) => l.date >= since && l.date <= todayDate);
  const suggestions: CareSuggestion[] = [];

  const strongPainDays = recent.filter((l) => (l.pain ?? 0) >= STRONG_PAIN_THRESHOLD).length;
  if (strongPainDays >= STRONG_PAIN_MIN_DAYS) suggestions.push({ kind: 'strongPain', days: strongPainDays });

  const heavyDays = recent.filter((l) => l.flow === 'heavy').length;
  if (heavyDays >= HEAVY_FLOW_MIN_DAYS) suggestions.push({ kind: 'heavyFlow', days: heavyDays });

  // Absence only makes sense when periods are expected (not under hormonal contraception,
  // postpartum or perimenopause, where long gaps can be expected).
  const mode = lifeModeOn(lifeModes, todayDate).mode;
  const lastStart = sortedPeriods(periods)
    .filter((p) => p.startDate <= todayDate)
    .at(-1)?.startDate;
  if ((mode === 'natural' || mode === 'tryingToConceive') && lastStart) {
    const days = diffInDays(todayDate, lastStart);
    if (days >= LONG_ABSENCE_DAYS) suggestions.push({ kind: 'longAbsence', days });
  }

  return suggestions;
}
