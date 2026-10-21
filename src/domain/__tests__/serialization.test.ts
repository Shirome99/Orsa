import { completeOnboarding, emptyData, saveDailyLog, setLifeMode, startPeriod, updateSettings } from '../records';
import { deserialize, serialize, StoredDataError } from '../serialization';

const TODAY = '2026-10-21';

describe('serialization', () => {
  it('round-trips data', () => {
    let data = completeOnboarding(
      emptyData(),
      { mode: 'natural', periodStarts: ['2026-09-20'], typicalCycleLength: 30, trackedItems: ['flow', 'sleep'] },
      TODAY,
    );
    data = startPeriod(data, TODAY, TODAY, 'p1');
    data = saveDailyLog(data, { date: TODAY, flow: 'heavy', pain: 0, mood: 'tired', energy: 3, hotFlashes: false, note: 'n' });
    data = setLifeMode(data, 'hormonalContraception', TODAY, 'implant');
    data = updateSettings(data, { themePreference: 'dark' });
    expect(deserialize(serialize(data))).toEqual(data);
  });

  it('drops invalid entries and unknown fields', () => {
    const raw = JSON.stringify({
      schemaVersion: 2,
      periods: [
        { id: 'ok', startDate: '2026-10-01', endDate: '2026-10-05', extra: true },
        { id: 'bad-date', startDate: '2026-02-30' },
        { id: 'ok', startDate: '2026-11-01' },
        { id: 'end-before-start', startDate: '2026-09-10', endDate: '2026-09-01' },
      ],
      logs: {
        '2026-10-02': { date: '2026-10-02', flow: 'torrential', pain: 12, mood: 'calm', energy: 9, sleep: 'great', updatedAt: 'x' },
        '2026-10-03': { date: '2026-10-04', pain: 2 },
      },
      lifeModes: [
        { id: 'a', mode: 'postpartum', startDate: '2026-01-01', contraceptionMethod: 'pill' },
        { id: 'b', mode: 'astral', startDate: '2026-02-01' },
      ],
      settings: { themePreference: 'neon', trackedItems: ['pain', 'telepathy', 'flow'], typicalCycleLength: 200 },
      tracking: 'nope',
    });
    expect(deserialize(raw)).toEqual({
      schemaVersion: 2,
      periods: [
        { id: 'end-before-start', startDate: '2026-09-10' },
        { id: 'ok', startDate: '2026-10-01', endDate: '2026-10-05' },
      ],
      logs: { '2026-10-02': { date: '2026-10-02', mood: 'calm', updatedAt: 'x' } },
      lifeModes: [{ id: 'a', mode: 'postpartum', startDate: '2026-01-01' }],
      settings: { themePreference: 'system', trackedItems: ['flow', 'pain'] },
    });
  });

  it('migrates v1 data: natural mode from the first record, onboarding skipped', () => {
    const v1 = JSON.stringify({
      schemaVersion: 1,
      periods: [{ id: 'p', startDate: '2026-09-23', endDate: '2026-09-27' }],
      logs: { '2026-09-20': { date: '2026-09-20', pain: 3, updatedAt: '' } },
      settings: { themePreference: 'dark' },
    });
    const data = deserialize(v1);
    expect(data.schemaVersion).toBe(2);
    expect(data.lifeModes).toEqual([{ id: 'migrated-v1', mode: 'natural', startDate: '2026-09-20' }]);
    expect(data.onboardingCompletedAt).toBe('migrated-v1');
    expect(data.settings).toEqual({ themePreference: 'dark', trackedItems: ['flow', 'pain', 'mood', 'note'] });
  });

  it('sends an empty v1 store through the onboarding', () => {
    const data = deserialize(JSON.stringify({ schemaVersion: 1, periods: [], logs: {}, settings: {} }));
    expect(data.onboardingCompletedAt).toBeUndefined();
    expect(data.lifeModes).toEqual([]);
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
