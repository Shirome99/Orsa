import { useEffect, useState } from 'react';

import { today, type ISODate } from '@/domain/dates';

/** Today's local date, refreshed every minute so the app rolls over at midnight. */
export function useTodayDate(): ISODate {
  const [value, setValue] = useState(today);
  useEffect(() => {
    const timer = setInterval(() => setValue(today()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return value;
}
