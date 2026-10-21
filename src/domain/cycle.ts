/**
 * Cycle calculations. Everything here is pure and deterministic: the same records
 * and the same "today" always produce the same result, which keeps it testable
 * and explainable to the user.
 */
import { diffInDays, type ISODate } from './dates';
import { sortedPeriods } from './records';
import type { PeriodEntry } from './types';

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
