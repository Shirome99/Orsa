/**
 * Cycle calculations. Everything here is pure and deterministic: the same records
 * and the same "today" always produce the same result, which keeps it testable
 * and explainable to the user.
 *
 * Method (deliberately simple so it can be explained in one sentence):
 * - cycle length = days between two consecutive period starts;
 * - prediction = average of the recent plausible cycles, uncertainty = their
 *   standard deviation;
 * - ovulation is placed ~14 days before the next estimated period (the luteal
 *   phase varies less than the follicular phase).
 * The user's life mode decides what may be estimated at all (see CLAUDE.md).
 * These are estimates only; they are never presented as facts.
 */
import { addDays, diffInDays, type ISODate } from './dates';
import { isExcludedFromCycleStats } from './lifeModes';
import { findPeriodContaining, lifeModeOn, sortedLifeModes, sortedPeriods } from './records';
import type { LifeMode, LifeModeEntry, PeriodEntry } from './types';

export const DEFAULT_CYCLE_LENGTH = 28;
export const DEFAULT_PERIOD_LENGTH = 5;
export const LUTEAL_PHASE_LENGTH = 14;
export const MIN_PLAUSIBLE_CYCLE = 15;
export const MAX_PLAUSIBLE_CYCLE = 90;
/** Only the most recent cycles are used: they reflect the current situation best. */
export const RECENT_CYCLE_COUNT = 6;
/** Uncertainty (± days) used while there are fewer than 3 cycles of history. */
export const LOW_HISTORY_MARGIN = 3;
export const MAX_MARGIN = 7;
/** Cycles needed after leaving hormonal contraception / postpartum before the warning disappears. */
export const CYCLES_TO_SETTLE_AFTER_MODE_CHANGE = 3;

export type Confidence = 'low' | 'medium' | 'high';
export type CyclePhase = 'menstruation' | 'follicular' | 'fertile' | 'ovulation' | 'luteal' | 'unknown';

export interface DateRange {
  start: ISODate;
  end: ISODate;
}

export interface CycleStats {
  /** Plausible cycle lengths used for the estimate, oldest first. */
  usedCycleLengths: number[];
  /** Cycles ignored because they are implausibly short or long (likely missing or extra entries). */
  excludedCycleCount: number;
  /** Cycles ignored because they were lived under hormonal contraception / postpartum, or before it. */
  excludedByModeCount: number;
  /** Average cycle length in days (rounded): from history, else the user's typical length, else 28. */
  meanCycleLength: number;
  /** Standard deviation of the used cycle lengths, in days (one decimal). */
  standardDeviation: number;
  meanPeriodLength: number;
  source: 'history' | 'typical' | 'default';
  /** True when stats only start after leaving hormonal contraception / postpartum. */
  restartedAfterModeChange: boolean;
}

export interface CycleOptions {
  lifeModes?: readonly LifeModeEntry[];
  /** Usual cycle length given by the user, used only without history. */
  typicalCycleLength?: number;
}

/** Full estimate (natural cycle, trying to conceive, perimenopause). */
export interface CycleEstimate {
  kind: 'estimate';
  mode: LifeMode;
  cycleStart: ISODate;
  cycleDay: number;
  phase: CyclePhase;
  /** Confidence of the phase; phases derived from ovulation are never "high". */
  phaseConfidence: Confidence;
  nextPeriod: { date: ISODate; window: DateRange; daysUntil: number };
  /** Days of the next estimated period, for the calendar. */
  nextPeriodDays: DateRange;
  ovulation: { date: ISODate; window: DateRange; confidence: Confidence };
  fertileWindow: DateRange;
  confidence: Confidence;
  /** The life mode lowered the confidence (perimenopause). */
  confidenceCappedByMode: boolean;
  /** First cycles after hormonal contraception / postpartum: may be irregular. */
  settlingAfterModeChange: boolean;
  /** Days past the estimated date, once the whole estimated window has passed. */
  daysLate: number;
  stats: CycleStats;
}

/** Bleeding tracking only (hormonal contraception, postpartum): nothing is estimated. */
export interface BleedingTracking {
  kind: 'tracking';
  mode: LifeMode;
  cycleStart: ISODate;
  /** Days since the start of the last bleeding (day 1 = first day). */
  cycleDay: number;
}

export type CycleOverview = CycleEstimate | BleedingTracking;

/** Start of the cycle containing `todayDate` (the latest period start on or before it). */
export function currentCycleStart(periods: readonly PeriodEntry[], todayDate: ISODate): ISODate | undefined {
  return sortedPeriods(periods)
    .filter((p) => p.startDate <= todayDate)
    .at(-1)?.startDate;
}

/** Day of the cycle, the first day of the period being day 1. */
export function cycleDay(cycleStart: ISODate, todayDate: ISODate): number {
  return diffInDays(todayDate, cycleStart) + 1;
}

/**
 * Date from which cycles describe the natural cycle again: the end of the last
 * hormonal contraception / postpartum period, or `undefined` if there never was one.
 */
export function naturalStatsStart(lifeModes: readonly LifeModeEntry[]): ISODate | undefined {
  const entries = sortedLifeModes(lifeModes);
  let lastExcluded = -1;
  entries.forEach((e, i) => {
    if (isExcludedFromCycleStats(e.mode)) lastExcluded = i;
  });
  if (lastExcluded === -1) return undefined;
  // Still in an excluded mode: nothing counts yet ("9999" sorts after any date).
  return entries[lastExcluded + 1]?.startDate ?? '9999-12-31';
}

export function computeCycleLengths(
  periods: readonly PeriodEntry[],
  lifeModes: readonly LifeModeEntry[] = [],
): { lengths: number[]; excluded: number; excludedByMode: number } {
  const statsStart = naturalStatsStart(lifeModes);
  const starts = sortedPeriods(periods).map((p) => p.startDate);
  const lengths: number[] = [];
  let excluded = 0;
  let excludedByMode = 0;
  for (let i = 1; i < starts.length; i++) {
    if (statsStart && starts[i - 1]! < statsStart) {
      excludedByMode++;
      continue;
    }
    const length = diffInDays(starts[i]!, starts[i - 1]!);
    if (length >= MIN_PLAUSIBLE_CYCLE && length <= MAX_PLAUSIBLE_CYCLE) lengths.push(length);
    else excluded++;
  }
  return { lengths, excluded, excludedByMode };
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Sample standard deviation (0 for fewer than two values). */
export function standardDeviation(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1));
}

export function computeStats(periods: readonly PeriodEntry[], options: CycleOptions = {}): CycleStats {
  const lifeModes = options.lifeModes ?? [];
  const statsStart = naturalStatsStart(lifeModes);
  const { lengths, excluded, excludedByMode } = computeCycleLengths(periods, lifeModes);
  const used = lengths.slice(-RECENT_CYCLE_COUNT);
  const periodLengths = periods
    .filter((p) => p.endDate && (!statsStart || p.startDate >= statsStart))
    .map((p) => diffInDays(p.endDate!, p.startDate) + 1)
    .filter((n) => n >= 1 && n <= 15);

  const typical = options.typicalCycleLength;
  const source = used.length ? 'history' : typical ? 'typical' : 'default';
  return {
    usedCycleLengths: used,
    excludedCycleCount: excluded,
    excludedByModeCount: excludedByMode,
    meanCycleLength: used.length ? Math.round(mean(used)) : (typical ?? DEFAULT_CYCLE_LENGTH),
    standardDeviation: Math.round(standardDeviation(used) * 10) / 10,
    meanPeriodLength: periodLengths.length ? Math.round(mean(periodLengths)) : DEFAULT_PERIOD_LENGTH,
    source,
    restartedAfterModeChange: statsStart !== undefined,
  };
}

export function confidenceFor(cycleCount: number, sd: number): Confidence {
  if (cycleCount < 3) return 'low';
  if (cycleCount >= RECENT_CYCLE_COUNT && sd <= 2) return 'high';
  if (sd <= 4) return 'medium';
  return 'low';
}

/** ± days around the estimated next period. */
export function predictionMargin(stats: CycleStats): number {
  if (stats.usedCycleLengths.length < 3) return LOW_HISTORY_MARGIN;
  return Math.min(MAX_MARGIN, Math.max(1, Math.round(stats.standardDeviation)));
}

const CONFIDENCE_ORDER: Confidence[] = ['low', 'medium', 'high'];
const capConfidence = (value: Confidence, cap: Confidence): Confidence =>
  CONFIDENCE_ORDER.indexOf(value) > CONFIDENCE_ORDER.indexOf(cap) ? cap : value;

/**
 * What Orsa can say about today, according to the life mode in effect, or
 * `undefined` when no period / bleeding has been recorded yet.
 */
export function predictCycle(
  periods: readonly PeriodEntry[],
  todayDate: ISODate,
  options: CycleOptions = {},
): CycleOverview | undefined {
  const cycleStart = currentCycleStart(periods, todayDate);
  if (!cycleStart) return undefined;

  const mode = lifeModeOn(options.lifeModes ?? [], todayDate).mode;
  if (mode === 'hormonalContraception' || mode === 'postpartum') {
    return { kind: 'tracking', mode, cycleStart, cycleDay: cycleDay(cycleStart, todayDate) };
  }

  const stats = computeStats(periods, options);
  const historyConfidence = confidenceFor(stats.usedCycleLengths.length, stats.standardDeviation);
  // Perimenopause: strong variability is expected, so confidence stays low by default.
  const confidenceCappedByMode = mode === 'perimenopause' && historyConfidence !== 'low';
  const confidence = mode === 'perimenopause' ? 'low' : historyConfidence;
  const margin = predictionMargin(stats);

  const nextDate = addDays(cycleStart, stats.meanCycleLength);
  const nextWindow = { start: addDays(nextDate, -margin), end: addDays(nextDate, margin) };

  // Ovulation cannot be estimated before the end of the period itself.
  const earliestOvulation = addDays(cycleStart, stats.meanPeriodLength);
  const rawOvulation = addDays(nextDate, -LUTEAL_PHASE_LENGTH);
  const ovulationDate = rawOvulation < earliestOvulation ? earliestOvulation : rawOvulation;
  const ovulationWindowStart = addDays(ovulationDate, -margin);
  const ovulationWindow = {
    start: ovulationWindowStart < earliestOvulation ? earliestOvulation : ovulationWindowStart,
    end: addDays(ovulationDate, margin),
  };
  const fertileWindow = { start: addDays(ovulationDate, -5), end: addDays(ovulationDate, 1) };

  const daysLate = todayDate > nextWindow.end ? diffInDays(todayDate, nextDate) : 0;

  let phase: CyclePhase;
  let phaseConfidence = capConfidence(confidence, 'medium');
  if (findPeriodContaining(periods, todayDate, todayDate)) {
    phase = 'menstruation';
    phaseConfidence = 'high'; // recorded by the user, not estimated
  } else if (daysLate > 0) {
    phase = 'unknown';
    phaseConfidence = 'low';
  } else if (todayDate === ovulationDate) {
    phase = 'ovulation';
  } else if (todayDate >= fertileWindow.start && todayDate <= fertileWindow.end) {
    phase = 'fertile';
  } else if (todayDate < fertileWindow.start) {
    phase = 'follicular';
  } else {
    phase = 'luteal';
  }

  return {
    kind: 'estimate',
    mode,
    cycleStart,
    cycleDay: cycleDay(cycleStart, todayDate),
    phase,
    phaseConfidence,
    nextPeriod: { date: nextDate, window: nextWindow, daysUntil: Math.max(0, diffInDays(nextDate, todayDate)) },
    nextPeriodDays: { start: nextDate, end: addDays(nextDate, stats.meanPeriodLength - 1) },
    ovulation: { date: ovulationDate, window: ovulationWindow, confidence: capConfidence(confidence, 'medium') },
    fertileWindow,
    confidence,
    confidenceCappedByMode,
    settlingAfterModeChange:
      stats.restartedAfterModeChange && stats.usedCycleLengths.length < CYCLES_TO_SETTLE_AFTER_MODE_CHANGE,
    daysLate,
    stats,
  };
}
