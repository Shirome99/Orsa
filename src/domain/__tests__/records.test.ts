import {
  emptyData,
  endPeriod,
  findPeriodContaining,
  ongoingPeriod,
  periodDisplayEnd,
  removePeriod,
  reopenPeriod,
  saveDailyLog,
  startPeriod,
} from '../records';

const TODAY = '2026-10-21';

describe('periods', () => {
  it('starts a period and makes it ongoing', () => {
    const data = startPeriod(emptyData(), TODAY, TODAY, 'p1');
    expect(data.periods).toEqual([{ id: 'p1', startDate: TODAY }]);
    expect(ongoingPeriod(data.periods, TODAY)?.id).toBe('p1');
  });

  it('does not create a second period inside an existing one', () => {
    const data = startPeriod(emptyData(), '2026-10-19', TODAY, 'p1');
    expect(startPeriod(data, TODAY, TODAY, 'p2')).toBe(data);
  });

  it('keeps periods sorted by start date', () => {
    let data = startPeriod(emptyData(), '2026-10-01', TODAY, 'b');
    data = startPeriod(data, '2026-09-03', TODAY, 'a');
    expect(data.periods.map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('ends, reopens and removes a period', () => {
    let data = startPeriod(emptyData(), '2026-10-17', TODAY, 'p1');
    data = endPeriod(data, 'p1', '2026-10-21');
    expect(data.periods[0]?.endDate).toBe('2026-10-21');
    expect(ongoingPeriod(data.periods, TODAY)).toBeUndefined();
    data = reopenPeriod(data, 'p1');
    expect(data.periods[0]?.endDate).toBeUndefined();
    data = removePeriod(data, 'p1');
    expect(data.periods).toEqual([]);
  });

  it('ignores an end date before the start', () => {
    const data = startPeriod(emptyData(), TODAY, TODAY, 'p1');
    expect(endPeriod(data, 'p1', '2026-10-20').periods[0]?.endDate).toBeUndefined();
  });

  it('bounds the displayed length of a period that was never closed', () => {
    const period = { id: 'p', startDate: '2026-09-01' };
    expect(periodDisplayEnd(period, TODAY)).toBe('2026-09-10');
    expect(periodDisplayEnd(period, '2026-09-03')).toBe('2026-09-03');
    expect(ongoingPeriod([period], TODAY)).toBeUndefined();
    expect(findPeriodContaining([period], '2026-09-10', TODAY)).toBe(period);
    expect(findPeriodContaining([period], '2026-09-11', TODAY)).toBeUndefined();
  });
});

describe('daily logs', () => {
  const now = new Date('2026-10-21T10:00:00Z');

  it('saves only the provided fields and trims the note', () => {
    const data = saveDailyLog(emptyData(), { date: TODAY, flow: 'medium', pain: 4, note: '  ok  ' }, now);
    expect(data.logs[TODAY]).toEqual({
      date: TODAY,
      flow: 'medium',
      pain: 4,
      note: 'ok',
      updatedAt: now.toISOString(),
    });
  });

  it('keeps a pain value of 0', () => {
    const data = saveDailyLog(emptyData(), { date: TODAY, pain: 0 }, now);
    expect(data.logs[TODAY]?.pain).toBe(0);
  });

  it('removes the entry when everything is cleared', () => {
    let data = saveDailyLog(emptyData(), { date: TODAY, mood: 'calm' }, now);
    data = saveDailyLog(data, { date: TODAY, note: '   ' }, now);
    expect(data.logs[TODAY]).toBeUndefined();
  });
});
