import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { CalendarLegend, MonthCalendar } from '@/components/calendar/MonthCalendar';
import { DaySummary } from '@/components/DaySummary';
import { PeriodActions } from '@/components/PeriodActions';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { useOrsaData } from '@/data/OrsaDataProvider';
import { buildDayMarks } from '@/domain/calendarMarks';
import { parseISODate, type ISODate } from '@/domain/dates';
import { t } from '@/i18n';
import { formatLongDate, formatMonthYear } from '@/i18n/format';
import { useTheme } from '@/theme/ThemeProvider';

export default function CalendarScreen() {
  const router = useRouter();
  const { spacing } = useTheme();
  const { data, todayDate } = useOrsaData();

  const now = parseISODate(todayDate);
  const [month, setMonth] = useState({ year: now.getFullYear(), index: now.getMonth() });
  const [selectedDate, setSelectedDate] = useState<ISODate>(todayDate);

  const marks = useMemo(() => buildDayMarks(data.periods, data.logs, todayDate), [data.periods, data.logs, todayDate]);

  const shiftMonth = (delta: number) => {
    const target = new Date(month.year, month.index + delta, 1);
    setMonth({ year: target.getFullYear(), index: target.getMonth() });
  };

  const goToToday = () => {
    setMonth({ year: now.getFullYear(), index: now.getMonth() });
    setSelectedDate(todayDate);
  };

  const isFuture = selectedDate > todayDate;

  return (
    <Screen title={t.screens.calendar.title}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Button variant="ghost" size="sm" label="←" accessibilityLabel={t.calendar.previousMonth} onPress={() => shiftMonth(-1)} />
          <AppText variant="heading" style={{ flex: 1, textAlign: 'center' }}>
            {formatMonthYear(month.year, month.index)}
          </AppText>
          <Button variant="ghost" size="sm" label="→" accessibilityLabel={t.calendar.nextMonth} onPress={() => shiftMonth(1)} />
          <Button variant="secondary" size="sm" label={t.calendar.backToToday} onPress={goToToday} />
        </View>
        <MonthCalendar
          year={month.year}
          monthIndex={month.index}
          marks={marks}
          todayDate={todayDate}
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
        />
        <CalendarLegend />
        <AppText variant="caption" muted>
          {t.calendar.estimatesNote}
        </AppText>
      </Card>

      <Card title={formatLongDate(selectedDate)}>
        {isFuture ? (
          <AppText muted>{t.calendar.futureDay}</AppText>
        ) : (
          <>
            <PeriodActions date={selectedDate} />
            <DaySummary log={data.logs[selectedDate]} emptyText={t.calendar.dayEmpty} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              <Button
                label={t.calendar.editDay}
                onPress={() => router.navigate({ pathname: '/journal', params: { date: selectedDate } })}
              />
            </View>
          </>
        )}
      </Card>
    </Screen>
  );
}
