import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import type { ISODate } from '@/domain/dates';
import {
  emptyData,
  endPeriod,
  removePeriod,
  reopenPeriod,
  saveDailyLog,
  startPeriod,
  updateSettings,
  type DailyLogInput,
  type OrsaData,
} from '@/domain/records';
import type { Settings } from '@/domain/types';
import { useTodayDate } from '@/hooks/useTodayDate';

import { DATA_KEY, KeyValueOrsaRepository, type OrsaRepository } from './OrsaRepository';
import { asyncStorageStore } from './storage/asyncStorageStore';

export type LoadStatus = 'loading' | 'ready' | 'error';

interface OrsaDataContextValue {
  status: LoadStatus;
  data: OrsaData;
  todayDate: ISODate;
  /** The last write to device storage failed; the change is only in memory. */
  saveFailed: boolean;
  /** Stored data could not be read at startup and was set aside. */
  recoveredFromUnreadableData: boolean;
  reload: () => void;
  startPeriod: (date: ISODate) => void;
  endPeriod: (periodId: string, date: ISODate) => void;
  reopenPeriod: (periodId: string) => void;
  removePeriod: (periodId: string) => void;
  saveDailyLog: (log: DailyLogInput) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  deleteAllData: () => Promise<void>;
}

const OrsaDataContext = createContext<OrsaDataContextValue | null>(null);

const defaultRepository = new KeyValueOrsaRepository(asyncStorageStore);

/** Loads the user's records from the device, exposes them, and saves every change immediately. */
export function OrsaDataProvider({
  children,
  repository = defaultRepository,
}: {
  children: ReactNode;
  repository?: OrsaRepository;
}) {
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [data, setData] = useState<OrsaData>(emptyData);
  const [saveFailed, setSaveFailed] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const dataRef = useRef<OrsaData>(data);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const todayDate = useTodayDate();

  const load = useCallback(() => {
    repository
      .load()
      .then((result) => {
        dataRef.current = result.data;
        setData(result.data);
        setRecovered(result.recoveredFromUnreadableData);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [repository]);

  useEffect(load, [load]);

  // Another browser tab changed the data: reload so this tab never overwrites newer records.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onStorage = (event: StorageEvent) => {
      if (event.key === DATA_KEY || event.key === null) load();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [load]);

  const update = useCallback(
    (change: (current: OrsaData) => OrsaData) => {
      const next = change(dataRef.current);
      if (next === dataRef.current) return;
      dataRef.current = next;
      setData(next);
      // Writes are chained so they reach storage in order.
      saveQueue.current = saveQueue.current
        .then(() => repository.save(next))
        .then(() => setSaveFailed(false))
        .catch(() => setSaveFailed(true));
    },
    [repository],
  );

  const deleteAllData = useCallback(async () => {
    await saveQueue.current;
    await repository.deleteAll();
    const fresh = emptyData();
    dataRef.current = fresh;
    setData(fresh);
    setRecovered(false);
    setSaveFailed(false);
  }, [repository]);

  const value = useMemo<OrsaDataContextValue>(
    () => ({
      status,
      data,
      todayDate,
      saveFailed,
      recoveredFromUnreadableData: recovered,
      reload: load,
      startPeriod: (date) => update((d) => startPeriod(d, date, todayDate)),
      endPeriod: (id, date) => update((d) => endPeriod(d, id, date)),
      reopenPeriod: (id) => update((d) => reopenPeriod(d, id)),
      removePeriod: (id) => update((d) => removePeriod(d, id)),
      saveDailyLog: (log) => update((d) => saveDailyLog(d, log)),
      updateSettings: (patch) => update((d) => updateSettings(d, patch)),
      deleteAllData,
    }),
    [status, data, todayDate, saveFailed, recovered, load, update, deleteAllData],
  );

  return <OrsaDataContext.Provider value={value}>{children}</OrsaDataContext.Provider>;
}

export function useOrsaData(): OrsaDataContextValue {
  const value = useContext(OrsaDataContext);
  if (!value) throw new Error('useOrsaData must be used inside OrsaDataProvider');
  return value;
}
