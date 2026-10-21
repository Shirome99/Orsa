import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useOrsaData } from '@/data/OrsaDataProvider';
import { diffInDays, type ISODate } from '@/domain/dates';
import { periodStatusOn } from '@/domain/records';
import { usePeriodWords } from '@/hooks/useCycleOverview';
import { t } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

import { AppText } from './ui/AppText';
import { Button } from './ui/Button';

/** Period status for one day and the actions that make sense for it (start, end, undo, delete). */
export function PeriodActions({ date }: { date: ISODate }) {
  const { spacing } = useTheme();
  const { data, todayDate, startPeriod, endPeriod, reopenPeriod, removePeriod } = useOrsaData();
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const status = periodStatusOn(data.periods, date, todayDate);
  const isToday = date === todayDate;
  const { words } = usePeriodWords();

  useEffect(() => setConfirmingRemoval(false), [date]);

  if (status.kind === 'future') return null;

  if (status.kind === 'outside') {
    return (
      <View style={{ gap: spacing.sm }}>
        <AppText muted>{words.statusOutside}</AppText>
        <Row>
          <Button label={isToday ? words.startToday : words.startedOn} onPress={() => startPeriod(date)} />
        </Row>
      </View>
    );
  }

  const { period, isStart, isRecordedEnd } = status;
  const dayNumber = diffInDays(date, period.startDate) + 1;
  const statusText = isStart
    ? words.statusStart
    : isRecordedEnd
      ? words.statusEnd
      : words.statusInside(dayNumber);

  return (
    <View style={{ gap: spacing.sm }}>
      <AppText>{statusText}</AppText>
      <Row>
        {isRecordedEnd ? (
          <Button variant="ghost" label={words.undoEnd} onPress={() => reopenPeriod(period.id)} />
        ) : (
          <Button
            variant="secondary"
            label={isToday ? words.endToday : words.endedOn}
            onPress={() => endPeriod(period.id, date)}
          />
        )}
        {isStart && !confirmingRemoval ? (
          <Button variant="ghost" label={words.remove} onPress={() => setConfirmingRemoval(true)} />
        ) : null}
        {isStart && confirmingRemoval ? (
          <>
            <Button variant="danger" label={words.confirmRemove} onPress={() => removePeriod(period.id)} />
            <Button variant="ghost" label={t.common.cancel} onPress={() => setConfirmingRemoval(false)} />
          </>
        ) : null}
      </Row>
      {confirmingRemoval ? (
        <AppText variant="caption" muted>
          {words.removeWarning}
        </AppText>
      ) : null}
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  const { spacing } = useTheme();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>{children}</View>;
}
