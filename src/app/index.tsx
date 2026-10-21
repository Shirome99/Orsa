import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { DaySummary } from '@/components/DaySummary';
import { PeriodActions } from '@/components/PeriodActions';
import { PredictionCards } from '@/components/PredictionCard';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { useOrsaData } from '@/data/OrsaDataProvider';
import { predictCycle } from '@/domain/cycle';
import { diffInDays } from '@/domain/dates';
import { ongoingPeriod } from '@/domain/records';
import { t } from '@/i18n';
import { formatLongDate } from '@/i18n/format';
import { useTheme } from '@/theme/ThemeProvider';

export default function TodayScreen() {
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const { data, todayDate } = useOrsaData();

  const prediction = useMemo(() => predictCycle(data.periods, todayDate), [data.periods, todayDate]);
  const ongoing = ongoingPeriod(data.periods, todayDate);

  return (
    <Screen title={t.screens.today.title} subtitle={formatLongDate(todayDate)}>
      {prediction ? (
        <Card tone="accent">
          <AppText variant="display" color={colors.primary}>
            {t.today.cycleDay(prediction.cycleDay)}
          </AppText>
          {ongoing ? (
            <AppText variant="heading" color={colors.period}>
              {t.today.periodOngoing(diffInDays(todayDate, ongoing.startDate) + 1)}
            </AppText>
          ) : null}
        </Card>
      ) : (
        <Card tone="accent" title={t.today.noCycleTitle}>
          <AppText>{t.today.noCycleBody}</AppText>
        </Card>
      )}

      {prediction ? <PredictionCards prediction={prediction} /> : null}

      <Card title={t.period.title}>
        <PeriodActions date={todayDate} />
      </Card>

      <Card title={t.today.quickActions}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <Button
            variant="ghost"
            label={t.today.logSymptoms}
            onPress={() => router.navigate({ pathname: '/journal', params: { date: todayDate } })}
          />
          <Button variant="ghost" label={t.today.openCalendar} onPress={() => router.navigate('/calendar')} />
        </View>
      </Card>

      <Card title={t.today.summaryTitle}>
        <DaySummary log={data.logs[todayDate]} emptyText={t.today.summaryEmpty} />
      </Card>

      <AppText variant="caption" muted>
        {t.today.disclaimer}
      </AppText>
    </Screen>
  );
}
