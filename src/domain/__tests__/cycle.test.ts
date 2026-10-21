import { addDays } from '../dates';
import {
  computeCycleLengths,
  computeStats,
  confidenceFor,
  currentCycleStart,
  cycleDay,
  predictCycle,
  standardDeviation,
} from '../cycle';
import type { PeriodEntry } from '../types';

/** Builds closed periods (5 days) from a first start and successive cycle lengths. */
function history(firstStart: string, cycleLengths: number[], periodLength = 5): PeriodEntry[] {
  const starts = [firstStart];
  for (const length of cycleLengths) starts.push(addDays(starts.at(-1)!, length));
  return starts.map((startDate, i) => ({ id: `p${i}`, startDate, endDate: addDays(startDate, periodLength - 1) }));
}

describe('cycle day', () => {
  it('counts the first day of the period as day 1', () => {
    expect(cycleDay('2026-10-21', '2026-10-21')).toBe(1);
    expect(cycleDay('2026-10-01', '2026-10-21')).toBe(21);
  });

  it('uses the latest period start on or before today', () => {
    const periods = history('2026-08-01', [30, 30]);
    expect(currentCycleStart(periods, '2026-09-15')).toBe('2026-08-31');
    expect(currentCycleStart(periods, '2026-07-01')).toBeUndefined();
  });
});

describe('statistics', () => {
  it('computes cycle lengths and excludes implausible ones', () => {
    const periods = history('2026-01-01', [28, 10, 30, 120]);
    expect(computeCycleLengths(periods)).toEqual({ lengths: [28, 30], excluded: 2 });
  });

  it('computes the sample standard deviation', () => {
    expect(standardDeviation([28])).toBe(0);
    expect(standardDeviation([26, 30])).toBeCloseTo(2.83, 2);
  });

  it('only uses the 6 most recent cycles', () => {
    const stats = computeStats(history('2025-01-01', [40, 40, 28, 28, 28, 28, 28, 28]));
    expect(stats.usedCycleLengths).toEqual([28, 28, 28, 28, 28, 28]);
    expect(stats.meanCycleLength).toBe(28);
  });

  it('falls back to defaults without history', () => {
    const stats = computeStats([{ id: 'p', startDate: '2026-10-21' }]);
    expect(stats).toMatchObject({ meanCycleLength: 28, meanPeriodLength: 5, basedOnHistory: false, standardDeviation: 0 });
  });

  it('averages recorded period lengths', () => {
    expect(computeStats(history('2026-01-01', [28], 4)).meanPeriodLength).toBe(4);
  });

  it('rates confidence from history size and regularity', () => {
    expect(confidenceFor(0, 0)).toBe('low');
    expect(confidenceFor(2, 0)).toBe('low');
    expect(confidenceFor(3, 1)).toBe('medium');
    expect(confidenceFor(6, 1.5)).toBe('high');
    expect(confidenceFor(6, 3)).toBe('medium');
    expect(confidenceFor(6, 6)).toBe('low');
  });
});

describe('predictCycle', () => {
  it('returns nothing without any period', () => {
    expect(predictCycle([], '2026-10-21')).toBeUndefined();
  });

  it('MVP: first period today gives day 1, menstruation and a low-confidence 28-day estimate', () => {
    const prediction = predictCycle([{ id: 'p', startDate: '2026-10-21' }], '2026-10-21')!;
    expect(prediction).toMatchObject({
      cycleDay: 1,
      phase: 'menstruation',
      confidence: 'low',
      daysLate: 0,
      nextPeriod: { date: '2026-11-18', window: { start: '2026-11-15', end: '2026-11-21' }, daysUntil: 28 },
      ovulation: { date: '2026-11-04' },
      fertileWindow: { start: '2026-10-30', end: '2026-11-05' },
    });
    expect(prediction.stats.basedOnHistory).toBe(false);
    // The period is recorded (certain) but the ovulation is still an estimate.
    expect(prediction.phaseConfidence).toBe('high');
    expect(prediction.ovulation.confidence).toBe('low');
  });

  it('gives high confidence and a narrow window for 6 regular cycles', () => {
    const periods = history('2026-04-01', [29, 30, 29, 30, 29, 30]);
    const lastStart = periods.at(-1)!.startDate;
    const prediction = predictCycle(periods, addDays(lastStart, 9))!;
    expect(prediction.confidence).toBe('high');
    expect(prediction.stats.meanCycleLength).toBe(30); // 29.5 rounds up
    expect(prediction.nextPeriod.date).toBe(addDays(lastStart, 30));
    expect(prediction.nextPeriod.window).toEqual({ start: addDays(lastStart, 29), end: addDays(lastStart, 31) });
    expect(prediction.cycleDay).toBe(10);
    expect(prediction.phase).toBe('follicular');
    // Estimated phases are never more than "medium".
    expect(prediction.phaseConfidence).toBe('medium');
    expect(prediction.ovulation.confidence).toBe('medium');
  });

  it('gives low confidence and a wide window for irregular cycles', () => {
    const periods = history('2026-01-01', [34, 51, 38, 45, 36]);
    const prediction = predictCycle(periods, periods.at(-1)!.startDate)!;
    expect(prediction.confidence).toBe('low');
    expect(prediction.stats.standardDeviation).toBeGreaterThan(4);
    expect(
      prediction.nextPeriod.window.end > addDays(prediction.nextPeriod.date, 5),
    ).toBe(true);
  });

  it('walks through the estimated phases of a 28-day cycle', () => {
    const periods = history('2026-01-01', [28, 28, 28]);
    const start = periods.at(-1)!.startDate;
    const phaseOn = (day: number) => predictCycle(periods, addDays(start, day - 1))!.phase;
    expect(phaseOn(1)).toBe('menstruation');
    expect(phaseOn(6)).toBe('follicular');
    expect(phaseOn(10)).toBe('fertile');
    expect(phaseOn(15)).toBe('ovulation');
    expect(phaseOn(16)).toBe('fertile');
    expect(phaseOn(20)).toBe('luteal');
    expect(phaseOn(28)).toBe('luteal');
  });

  it('reports lateness only once the whole estimated window has passed', () => {
    const periods = history('2026-01-01', [28, 28, 28]); // margin ±1 after 3 identical cycles
    const start = periods.at(-1)!.startDate;
    expect(predictCycle(periods, addDays(start, 28))!.daysLate).toBe(0); // estimated day
    expect(predictCycle(periods, addDays(start, 29))!.daysLate).toBe(0); // still inside window
    const late = predictCycle(periods, addDays(start, 33))!;
    expect(late.daysLate).toBe(5);
    expect(late.phase).toBe('unknown');
    expect(late.nextPeriod.daysUntil).toBe(0);
  });

  it('never places ovulation inside the period for very short cycles', () => {
    const periods = history('2026-01-01', [16, 16, 16], 6);
    const prediction = predictCycle(periods, periods.at(-1)!.startDate)!;
    expect(prediction.ovulation.date >= addDays(prediction.cycleStart, 6)).toBe(true);
    expect(prediction.ovulation.window.start >= addDays(prediction.cycleStart, 6)).toBe(true);
  });
});
