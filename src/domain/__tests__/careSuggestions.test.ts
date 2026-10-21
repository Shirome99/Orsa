import { careSuggestions } from '../careSuggestions';
import type { DailyLog, LifeModeEntry } from '../types';

const TODAY = '2026-10-21';
const log = (date: string, patch: Partial<DailyLog>): [string, DailyLog] => [date, { date, updatedAt: '', ...patch }];

describe('careSuggestions', () => {
  const recentPeriod = [{ id: 'p', startDate: '2026-10-01', endDate: '2026-10-05' }];

  it('stays silent with ordinary records', () => {
    const logs = Object.fromEntries([log('2026-10-01', { pain: 8 }), log('2026-10-02', { pain: 5, flow: 'heavy' })]);
    expect(careSuggestions(logs, recentPeriod, [], TODAY)).toEqual([]);
  });

  it('notices repeated strong pain within 90 days only', () => {
    const logs = Object.fromEntries([
      log('2026-10-01', { pain: 8 }),
      log('2026-09-02', { pain: 9 }),
      log('2026-08-03', { pain: 10 }),
      log('2026-06-01', { pain: 10 }), // too old
    ]);
    expect(careSuggestions(logs, recentPeriod, [], TODAY)).toEqual([{ kind: 'strongPain', days: 3 }]);
  });

  it('notices repeated very heavy bleeding', () => {
    const logs = Object.fromEntries(
      ['2026-10-01', '2026-10-02', '2026-10-03', '2026-09-03', '2026-09-04'].map((d) => log(d, { flow: 'heavy' })),
    );
    expect(careSuggestions(logs, recentPeriod, [], TODAY)).toEqual([{ kind: 'heavyFlow', days: 5 }]);
  });

  it('notices a long absence of periods only when periods are expected', () => {
    const old = [{ id: 'p', startDate: '2026-07-01' }];
    expect(careSuggestions({}, old, [], TODAY)).toEqual([{ kind: 'longAbsence', days: 112 }]);
    const pill: LifeModeEntry[] = [{ id: 'm', mode: 'hormonalContraception', startDate: '2026-01-01' }];
    expect(careSuggestions({}, old, pill, TODAY)).toEqual([]);
    const peri: LifeModeEntry[] = [{ id: 'm', mode: 'perimenopause', startDate: '2026-01-01' }];
    expect(careSuggestions({}, old, peri, TODAY)).toEqual([]);
    expect(careSuggestions({}, [], [], TODAY)).toEqual([]);
  });
});
