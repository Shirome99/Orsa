import { addDays } from '../dates';
import {
  computeCycleLengths,
  computeStats,
  confidenceFor,
  currentCycleStart,
  cycleDay,
  naturalStatsStart,
  predictCycle,
  standardDeviation,
  type CycleEstimate,
  type CycleOptions,
} from '../cycle';
import type { LifeModeEntry, PeriodEntry } from '../types';

/** Builds closed periods (5 days) from a first start and successive cycle lengths. */
function history(firstStart: string, cycleLengths: number[], periodLength = 5): PeriodEntry[] {
  const starts = [firstStart];
  for (const length of cycleLengths) starts.push(addDays(starts.at(-1)!, length));
  return starts.map((startDate, i) => ({ id: `p${i}`, startDate, endDate: addDays(startDate, periodLength - 1) }));
}

/** predictCycle, asserting that a full estimate was produced. */
function estimate(periods: PeriodEntry[], today: string, options?: CycleOptions): CycleEstimate {
  const result = predictCycle(periods, today, options);
  if (result?.kind !== 'estimate') throw new Error(`expected an estimate, got ${result?.kind}`);
  return result;
}

const mode = (m: LifeModeEntry['mode'], startDate: string, id = m): LifeModeEntry => ({ id, mode: m, startDate });

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
    expect(computeCycleLengths(periods)).toEqual({ lengths: [28, 30], excluded: 2, excludedByMode: 0 });
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

  it('falls back to the default without history', () => {
    const stats = computeStats([{ id: 'p', startDate: '2026-10-21' }]);
    expect(stats).toMatchObject({ meanCycleLength: 28, meanPeriodLength: 5, source: 'default', standardDeviation: 0 });
  });

  it('uses the typical length given by the user while there is no history', () => {
    expect(computeStats([{ id: 'p', startDate: '2026-10-21' }], { typicalCycleLength: 33 })).toMatchObject({
      meanCycleLength: 33,
      source: 'typical',
    });
    // History always wins over the declared value.
    expect(computeStats(history('2026-01-01', [29]), { typicalCycleLength: 33 })).toMatchObject({
      meanCycleLength: 29,
      source: 'history',
    });
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

describe('predictCycle — natural cycle', () => {
  it('returns nothing without any period', () => {
    expect(predictCycle([], '2026-10-21')).toBeUndefined();
  });

  it('MVP: first period today gives day 1, menstruation and a low-confidence 28-day estimate', () => {
    const prediction = estimate([{ id: 'p', startDate: '2026-10-21' }], '2026-10-21');
    expect(prediction).toMatchObject({
      mode: 'natural',
      cycleDay: 1,
      phase: 'menstruation',
      confidence: 'low',
      daysLate: 0,
      nextPeriod: { date: '2026-11-18', window: { start: '2026-11-15', end: '2026-11-21' }, daysUntil: 28 },
      ovulation: { date: '2026-11-04' },
      fertileWindow: { start: '2026-10-30', end: '2026-11-05' },
    });
    expect(prediction.stats.source).toBe('default');
    // The period is recorded (certain) but the ovulation is still an estimate.
    expect(prediction.phaseConfidence).toBe('high');
    expect(prediction.ovulation.confidence).toBe('low');
  });

  it('a single cycle of history is used but keeps a low confidence and a wide window', () => {
    const periods = history('2026-09-01', [31]);
    const prediction = estimate(periods, periods.at(-1)!.startDate);
    expect(prediction.stats).toMatchObject({ source: 'history', meanCycleLength: 31, usedCycleLengths: [31] });
    expect(prediction.confidence).toBe('low');
    expect(prediction.nextPeriod.window).toEqual({
      start: addDays(prediction.nextPeriod.date, -3),
      end: addDays(prediction.nextPeriod.date, 3),
    });
  });

  it('gives high confidence and a narrow window for 6 regular cycles', () => {
    const periods = history('2026-04-01', [29, 30, 29, 30, 29, 30]);
    const lastStart = periods.at(-1)!.startDate;
    const prediction = estimate(periods, addDays(lastStart, 9));
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

  it('gives low confidence and a wide window for very irregular cycles', () => {
    const periods = history('2026-01-01', [34, 51, 38, 45, 36]);
    const prediction = estimate(periods, periods.at(-1)!.startDate);
    expect(prediction.confidence).toBe('low');
    expect(prediction.stats.standardDeviation).toBeGreaterThan(4);
    expect(prediction.nextPeriod.window.end > addDays(prediction.nextPeriod.date, 5)).toBe(true);
  });

  it('caps the window at ± 7 days for extremely irregular cycles', () => {
    const periods = history('2025-06-01', [20, 60, 25, 70, 22, 65]);
    const prediction = estimate(periods, periods.at(-1)!.startDate);
    expect(prediction.nextPeriod.window.end).toBe(addDays(prediction.nextPeriod.date, 7));
  });

  it('walks through the estimated phases of a 28-day cycle', () => {
    const periods = history('2026-01-01', [28, 28, 28]);
    const start = periods.at(-1)!.startDate;
    const phaseOn = (day: number) => estimate(periods, addDays(start, day - 1)).phase;
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
    expect(estimate(periods, addDays(start, 28)).daysLate).toBe(0); // estimated day
    expect(estimate(periods, addDays(start, 29)).daysLate).toBe(0); // still inside window
    const late = estimate(periods, addDays(start, 33));
    expect(late.daysLate).toBe(5);
    expect(late.phase).toBe('unknown');
    expect(late.nextPeriod.daysUntil).toBe(0);
  });

  it('never places ovulation inside the period for very short cycles', () => {
    const periods = history('2026-01-01', [16, 16, 16], 6);
    const prediction = estimate(periods, periods.at(-1)!.startDate);
    expect(prediction.ovulation.date >= addDays(prediction.cycleStart, 6)).toBe(true);
    expect(prediction.ovulation.window.start >= addDays(prediction.cycleStart, 6)).toBe(true);
  });
});

describe('predictCycle — life modes', () => {
  const regular = history('2026-04-01', [29, 30, 29, 30, 29, 30]);
  const lastStart = regular.at(-1)!.startDate;
  const day10 = addDays(lastStart, 9);

  it('hormonal contraception: bleeding tracking only, no ovulation nor fertile window', () => {
    const result = predictCycle(regular, day10, { lifeModes: [mode('hormonalContraception', '2026-01-01')] });
    expect(result).toEqual({ kind: 'tracking', mode: 'hormonalContraception', cycleStart: lastStart, cycleDay: 10 });
  });

  it('postpartum: no estimate until the mode changes', () => {
    const result = predictCycle(regular, day10, { lifeModes: [mode('postpartum', '2026-01-01')] });
    expect(result?.kind).toBe('tracking');
  });

  it('trying to conceive: full estimate, same as the natural cycle', () => {
    const ttc = estimate(regular, day10, { lifeModes: [mode('tryingToConceive', '2026-01-01')] });
    const natural = estimate(regular, day10);
    expect(ttc.mode).toBe('tryingToConceive');
    expect(ttc.fertileWindow).toEqual(natural.fertileWindow);
    expect(ttc.confidence).toBe('high');
  });

  it('perimenopause: estimates stay at low confidence even with regular history', () => {
    const peri = estimate(regular, day10, { lifeModes: [mode('perimenopause', '2026-01-01')] });
    expect(peri.confidence).toBe('low');
    expect(peri.confidenceCappedByMode).toBe(true);
    expect(peri.ovulation.confidence).toBe('low');
  });

  it('excludes cycles lived under hormonal contraception and restarts stats after it', () => {
    // 3 pill cycles of 28 days, then natural cycles of 35 days after stopping the pill.
    const periods = history('2026-01-01', [28, 28, 28, 35, 35]);
    const stopPill = addDays(periods[3]!.startDate, -2);
    const lifeModes = [mode('hormonalContraception', '2025-06-01'), mode('natural', stopPill)];
    expect(naturalStatsStart(lifeModes)).toBe(stopPill);

    const prediction = estimate(periods, periods.at(-1)!.startDate, { lifeModes });
    expect(prediction.stats.usedCycleLengths).toEqual([35, 35]);
    expect(prediction.stats.excludedByModeCount).toBe(3);
    expect(prediction.stats.meanCycleLength).toBe(35);
    expect(prediction.confidence).toBe('low');
    expect(prediction.settlingAfterModeChange).toBe(true);
  });

  it('stops warning about the mode change after 3 natural cycles', () => {
    const periods = history('2026-01-01', [28, 30, 30, 30]);
    const lifeModes = [mode('postpartum', '2025-06-01'), mode('natural', '2025-12-30')];
    const prediction = estimate(periods, periods.at(-1)!.startDate, { lifeModes });
    expect(prediction.stats.usedCycleLengths).toHaveLength(4);
    expect(prediction.settlingAfterModeChange).toBe(false);
  });

  it('ignores period lengths recorded before leaving an excluded mode', () => {
    const pill = history('2026-01-01', [28, 28], 3);
    const natural = history('2026-03-10', [30], 6);
    const periods = [...pill, ...natural.map((p, i) => ({ ...p, id: `n${i}` }))];
    const stats = computeStats(periods, { lifeModes: [mode('hormonalContraception', '2025-01-01'), mode('natural', '2026-03-01')] });
    expect(stats.meanPeriodLength).toBe(6);
  });

  it('only the mode in effect today decides what is estimated', () => {
    const lifeModes = [mode('hormonalContraception', '2025-01-01'), mode('natural', day10)];
    const yesterday = predictCycle(regular, addDays(day10, -1), { lifeModes });
    const today = predictCycle(regular, day10, { lifeModes });
    expect(yesterday?.kind).toBe('tracking');
    expect(today?.kind).toBe('estimate');
    // Just after stopping: no natural cycle counted yet, so the estimate falls back and stays low.
    expect((today as CycleEstimate).stats.usedCycleLengths).toEqual([]);
    expect((today as CycleEstimate).confidence).toBe('low');
  });
});
