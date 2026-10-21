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
 * These are estimates only; they are never presented as facts.
 */
import { addDays, diffInDays, type ISODate } from './dates';
import { findPeriodContaining, sortedPeriods } from './records';
import type { PeriodEntry } from './types';

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
  /** Average cycle length in days (rounded), or the default when there is no history. */
  meanCycleLength: number;
  /** Standard deviation of the used cycle lengths, in days (one decimal). */
  standardDeviation: number;
  meanPeriodLength: number;
  basedOnHistory: boolean;
}

export interface CyclePrediction {
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
  /** Days past the estimated date, once the whole estimated window has passed. */
  daysLate: number;
  stats: CycleStats;
}

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

export function computeCycleLengths(periods: readonly PeriodEntry[]): { lengths: number[]; excluded: number } {
  const starts = sortedPeriods(periods).map((p) => p.startDate);
  const lengths: number[] = [];
  let excluded = 0;
  for (let i = 1; i < starts.length; i++) {
    const length = diffInDays(starts[i]!, starts[i - 1]!);
    if (length >= MIN_PLAUSIBLE_CYCLE && length <= MAX_PLAUSIBLE_CYCLE) lengths.push(length);
    else excluded++;
  }
  return { lengths, excluded };
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

export function computeStats(periods: readonly PeriodEntry[]): CycleStats {
  const { lengths, excluded } = computeCycleLengths(periods);
  const used = lengths.slice(-RECENT_CYCLE_COUNT);
  const periodLengths = periods
    .filter((p) => p.endDate)
    .map((p) => diffInDays(p.endDate!, p.startDate) + 1)
    .filter((n) => n >= 1 && n <= 15);

  return {
    usedCycleLengths: used,
    excludedCycleCount: excluded,
    meanCycleLength: used.length ? Math.round(mean(used)) : DEFAULT_CYCLE_LENGTH,
    standardDeviation: Math.round(standardDeviation(used) * 10) / 10,
    meanPeriodLength: periodLengths.length ? Math.round(mean(periodLengths)) : DEFAULT_PERIOD_LENGTH,
    basedOnHistory: used.length > 0,
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

/** Full estimate for today, or `undefined` when no period has been recorded yet. */
export function predictCycle(periods: readonly PeriodEntry[], todayDate: ISODate): CyclePrediction | undefined {
  const cycleStart = currentCycleStart(periods, todayDate);
  if (!cycleStart) return undefined;

  const stats = computeStats(periods);
  const confidence = confidenceFor(stats.usedCycleLengths.length, stats.standardDeviation);
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
    cycleStart,
    cycleDay: cycleDay(cycleStart, todayDate),
    phase,
    phaseConfidence,
    nextPeriod: { date: nextDate, window: nextWindow, daysUntil: Math.max(0, diffInDays(nextDate, todayDate)) },
    nextPeriodDays: { start: nextDate, end: addDays(nextDate, stats.meanPeriodLength - 1) },
    ovulation: { date: ovulationDate, window: ovulationWindow, confidence: capConfidence(confidence, 'medium') },
    fertileWindow,
    confidence,
    daysLate,
    stats,
  };
}
