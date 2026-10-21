/**
 * Minimal platform-independent key-value storage. Implementations must keep data
 * on the device only (no network) and survive app / browser restarts.
 */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** Volatile store used by tests. */
export class MemoryKeyValueStore implements KeyValueStore {
  readonly items = new Map<string, string>();

  async getItem(key: string) {
    return this.items.get(key) ?? null;
  }

  async setItem(key: string, value: string) {
    this.items.set(key, value);
  }

  async removeItem(key: string) {
    this.items.delete(key);
  }
}
