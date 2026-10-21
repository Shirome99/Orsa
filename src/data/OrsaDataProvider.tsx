import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

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

interface OrsaDataContextValue {
  data: OrsaData;
  todayDate: ISODate;
  startPeriod: (date: ISODate) => void;
  endPeriod: (periodId: string, date: ISODate) => void;
  reopenPeriod: (periodId: string) => void;
  removePeriod: (periodId: string) => void;
  saveDailyLog: (log: DailyLogInput) => void;
  updateSettings: (patch: Partial<Settings>) => void;
}

const OrsaDataContext = createContext<OrsaDataContextValue | null>(null);

/** Holds the user's records and exposes the operations the screens can perform. */
export function OrsaDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OrsaData>(emptyData);
  const todayDate = useTodayDate();

  const update = useCallback((change: (current: OrsaData) => OrsaData) => {
    setData((current) => change(current));
  }, []);

  const value = useMemo<OrsaDataContextValue>(
    () => ({
      data,
      todayDate,
      startPeriod: (date) => update((d) => startPeriod(d, date, todayDate)),
      endPeriod: (id, date) => update((d) => endPeriod(d, id, date)),
      reopenPeriod: (id) => update((d) => reopenPeriod(d, id)),
      removePeriod: (id) => update((d) => removePeriod(d, id)),
      saveDailyLog: (log) => update((d) => saveDailyLog(d, log)),
      updateSettings: (patch) => update((d) => updateSettings(d, patch)),
    }),
    [data, todayDate, update],
  );

  return <OrsaDataContext.Provider value={value}>{children}</OrsaDataContext.Provider>;
}

export function useOrsaData(): OrsaDataContextValue {
  const value = useContext(OrsaDataContext);
  if (!value) throw new Error('useOrsaData must be used inside OrsaDataProvider');
  return value;
}
