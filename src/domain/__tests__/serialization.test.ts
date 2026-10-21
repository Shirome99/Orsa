import { emptyData, saveDailyLog, startPeriod, updateSettings } from '../records';
import { deserialize, serialize, StoredDataError } from '../serialization';

const TODAY = '2026-10-21';

describe('serialization', () => {
  it('round-trips data', () => {
    let data = startPeriod(emptyData(), TODAY, TODAY, 'p1');
    data = saveDailyLog(data, { date: TODAY, flow: 'heavy', pain: 0, mood: 'tired', note: 'n' });
    data = updateSettings(data, { themePreference: 'dark' });
    expect(deserialize(serialize(data))).toEqual(data);
  });

  it('drops invalid entries and unknown fields', () => {
    const raw = JSON.stringify({
      schemaVersion: 1,
      periods: [
        { id: 'ok', startDate: '2026-10-01', endDate: '2026-10-05', extra: true },
        { id: 'bad-date', startDate: '2026-02-30' },
        { id: 'ok', startDate: '2026-11-01' },
        { id: 'end-before-start', startDate: '2026-09-10', endDate: '2026-09-01' },
      ],
      logs: {
        '2026-10-02': { date: '2026-10-02', flow: 'torrential', pain: 12, mood: 'calm', updatedAt: 'x' },
        '2026-10-03': { date: '2026-10-04', pain: 2 },
      },
      settings: { themePreference: 'neon' },
      tracking: 'nope',
    });
    expect(deserialize(raw)).toEqual({
      schemaVersion: 1,
      periods: [
        { id: 'end-before-start', startDate: '2026-09-10' },
        { id: 'ok', startDate: '2026-10-01', endDate: '2026-10-05' },
      ],
      logs: { '2026-10-02': { date: '2026-10-02', mood: 'calm', updatedAt: 'x' } },
      settings: { themePreference: 'system' },
    });
  });

  it('rejects unreadable data without leaking its content', () => {
    expect(() => deserialize('{not json')).toThrow(StoredDataError);
    expect(() => deserialize('[]')).toThrow(StoredDataError);
    expect(() => deserialize('{"schemaVersion": 99}')).toThrow(/newer version/);
    try {
      deserialize('{"secret": "pain 9"');
    } catch (error) {
      expect((error as Error).message).not.toContain('pain');
    }
  });
});
