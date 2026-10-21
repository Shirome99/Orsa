import { emptyData, type OrsaData } from '@/domain/records';
import { deserialize, serialize, StoredDataError } from '@/domain/serialization';

import type { KeyValueStore } from './storage/KeyValueStore';

/** Persistence boundary of the app. Screens never talk to a storage engine directly. */
export interface OrsaRepository {
  load(): Promise<LoadResult>;
  save(data: OrsaData): Promise<void>;
  /** Permanently deletes every record stored on this device. */
  deleteAll(): Promise<void>;
}

export interface LoadResult {
  data: OrsaData;
  /** True when stored data was unreadable; the raw copy was kept aside, not deleted. */
  recoveredFromUnreadableData: boolean;
}

export const DATA_KEY = 'orsa.data';
export const UNREADABLE_BACKUP_KEY = 'orsa.data.unreadable-backup';

/**
 * Stores the whole dataset as one JSON document. Simple and atomic per write;
 * fine for years of daily entries (a few hundred KB). Can be swapped for a
 * SQLite-backed implementation later without touching the screens.
 */
export class KeyValueOrsaRepository implements OrsaRepository {
  constructor(private readonly store: KeyValueStore) {}

  async load(): Promise<LoadResult> {
    const raw = await this.store.getItem(DATA_KEY);
    if (raw === null) return { data: emptyData(), recoveredFromUnreadableData: false };
    try {
      return { data: deserialize(raw), recoveredFromUnreadableData: false };
    } catch (error) {
      if (!(error instanceof StoredDataError)) throw error;
      // Never silently destroy user data: keep the unreadable copy aside.
      await this.store.setItem(UNREADABLE_BACKUP_KEY, raw);
      return { data: emptyData(), recoveredFromUnreadableData: true };
    }
  }

  async save(data: OrsaData): Promise<void> {
    await this.store.setItem(DATA_KEY, serialize(data));
  }

  async deleteAll(): Promise<void> {
    await this.store.removeItem(DATA_KEY);
    await this.store.removeItem(UNREADABLE_BACKUP_KEY);
  }
}
