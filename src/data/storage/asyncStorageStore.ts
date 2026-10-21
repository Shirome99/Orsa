import AsyncStorage from '@react-native-async-storage/async-storage';

import type { KeyValueStore } from './KeyValueStore';

/**
 * Device storage via AsyncStorage: `localStorage` in the browser (persists after the
 * tab or browser is closed), native storage on Android / iOS. Nothing leaves the device.
 */
export const asyncStorageStore: KeyValueStore = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};
