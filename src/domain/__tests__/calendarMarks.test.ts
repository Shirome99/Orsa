import { buildDayMarks } from '../calendarMarks';

const TODAY = '2026-10-21';

describe('buildDayMarks', () => {
  it('marks recorded period days and logged days', () => {
    const marks = buildDayMarks(
      [{ id: 'p', startDate: '2026-10-01', endDate: '2026-10-03' }],
      { '2026-10-02': { date: '2026-10-02', pain: 3, updatedAt: '' }, '2026-10-10': { date: '2026-10-10', mood: 'calm', updatedAt: '' } },
      TODAY,
    );
    expect(marks['2026-10-01']).toMatchObject({ period: true, periodStart: true });
    expect(marks['2026-10-02']).toMatchObject({ period: true, hasLog: true });
    expect(marks['2026-10-03']?.period).toBe(true);
    expect(marks['2026-10-04']).toBeUndefined();
    expect(marks['2026-10-10']).toEqual({ hasLog: true });
  });

  it('shows an ongoing period up to today only', () => {
    const marks = buildDayMarks([{ id: 'p', startDate: '2026-10-20' }], {}, TODAY);
    expect(marks['2026-10-21']?.period).toBe(true);
    expect(marks['2026-10-22']).toBeUndefined();
  });

  it('adds predicted ranges but lets recorded periods override them', () => {
    const marks = buildDayMarks([{ id: 'p', startDate: '2026-11-15', endDate: '2026-11-16' }], {}, '2026-11-16', {
      nextPeriod: { start: '2026-11-14', end: '2026-11-16' },
      fertileWindow: { start: '2026-11-01', end: '2026-11-03' },
      ovulation: { start: '2026-11-02', end: '2026-11-02' },
    });
    expect(marks['2026-11-14']).toEqual({ predictedPeriod: true });
    expect(marks['2026-11-15']).toMatchObject({ period: true, predictedPeriod: false });
    expect(marks['2026-11-01']).toEqual({ fertile: true });
    expect(marks['2026-11-02']).toEqual({ fertile: true, ovulation: true });
  });
});
