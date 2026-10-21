import { useMemo } from 'react';

import { useOrsaData } from '@/data/OrsaDataProvider';
import { predictCycle, type CycleOverview } from '@/domain/cycle';
import { usesBleedingVocabulary } from '@/domain/lifeModes';
import { lifeModeOn } from '@/domain/records';
import { t } from '@/i18n';

/** Today's cycle overview, computed with the user's life modes and typical cycle length. */
export function useCycleOverview(): CycleOverview | undefined {
  const { data, todayDate } = useOrsaData();
  return useMemo(
    () =>
      predictCycle(data.periods, todayDate, {
        lifeModes: data.lifeModes,
        typicalCycleLength: data.settings.typicalCycleLength,
      }),
    [data.periods, data.lifeModes, data.settings.typicalCycleLength, todayDate],
  );
}

/** "Règles" or "Saignements" wording, depending on the life mode in effect today. */
export function usePeriodWords() {
  const { data, todayDate } = useOrsaData();
  const mode = lifeModeOn(data.lifeModes, todayDate).mode;
  const bleeding = usesBleedingVocabulary(mode);
  return { words: bleeding ? t.bleeding : t.period, bleeding };
}
