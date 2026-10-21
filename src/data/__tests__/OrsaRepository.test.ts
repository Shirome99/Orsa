import { emptyData, saveDailyLog, startPeriod } from '@/domain/records';

import { DATA_KEY, KeyValueOrsaRepository, UNREADABLE_BACKUP_KEY } from '../OrsaRepository';
import { MemoryKeyValueStore } from '../storage/KeyValueStore';

const TODAY = '2026-10-21';

describe('KeyValueOrsaRepository', () => {
  it('returns empty data on first launch', async () => {
    const repo = new KeyValueOrsaRepository(new MemoryKeyValueStore());
    expect(await repo.load()).toEqual({ data: emptyData(), recoveredFromUnreadableData: false });
  });

  it('persists data across repository instances (app restart)', async () => {
    const store = new MemoryKeyValueStore();
    let data = startPeriod(emptyData(), TODAY, TODAY, 'p1');
    data = saveDailyLog(data, { date: TODAY, flow: 'medium', pain: 4, mood: 'calm' });
    await new KeyValueOrsaRepository(store).save(data);

    const reloaded = await new KeyValueOrsaRepository(store).load();
    expect(reloaded.data).toEqual(data);
  });

  it('keeps unreadable data aside instead of deleting it', async () => {
    const store = new MemoryKeyValueStore();
    await store.setItem(DATA_KEY, '{broken');
    const result = await new KeyValueOrsaRepository(store).load();
    expect(result).toEqual({ data: emptyData(), recoveredFromUnreadableData: true });
    expect(store.items.get(UNREADABLE_BACKUP_KEY)).toBe('{broken');
  });

  it('deletes everything', async () => {
    const store = new MemoryKeyValueStore();
    const repo = new KeyValueOrsaRepository(store);
    await repo.save(startPeriod(emptyData(), TODAY, TODAY));
    await store.setItem(UNREADABLE_BACKUP_KEY, 'x');
    await repo.deleteAll();
    expect(store.items.size).toBe(0);
  });
});
