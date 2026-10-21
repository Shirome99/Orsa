import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { DaySummary } from '@/components/DaySummary';
import { PeriodActions } from '@/components/PeriodActions';
import { PredictionCards, TrackingCard } from '@/components/PredictionCard';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { useOrsaData } from '@/data/OrsaDataProvider';
import { careSuggestions } from '@/domain/careSuggestions';
import { diffInDays } from '@/domain/dates';
import { ongoingPeriod } from '@/domain/records';
import { useCycleOverview, usePeriodWords } from '@/hooks/useCycleOverview';
import { t } from '@/i18n';
import { formatLongDate } from '@/i18n/format';
import { useTheme } from '@/theme/ThemeProvider';

export default function TodayScreen() {
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const { data, todayDate } = useOrsaData();

  const overview = useCycleOverview();
  const { words, bleeding } = usePeriodWords();
  const ongoing = ongoingPeriod(data.periods, todayDate);
  const suggestions = useMemo(
    () => careSuggestions(data.logs, data.periods, data.lifeModes, todayDate),
    [data.logs, data.periods, data.lifeModes, todayDate],
  );

  return (
    <Screen title={t.screens.today.title} subtitle={formatLongDate(todayDate)}>
      {overview ? (
        <Card tone="accent">
          <AppText variant={overview.kind === 'estimate' ? 'display' : 'title'} color={colors.primary}>
            {overview.kind === 'estimate' ? t.today.cycleDay(overview.cycleDay) : t.today.bleedingDay(overview.cycleDay)}
          </AppText>
          {ongoing ? (
            <AppText variant="heading" color={colors.period}>
              {(bleeding ? t.today.bleedingOngoing : t.today.periodOngoing)(diffInDays(todayDate, ongoing.startDate) + 1)}
            </AppText>
          ) : null}
        </Card>
      ) : (
        <Card tone="accent" title={t.today.noCycleTitle}>
          <AppText>{t.today.noCycleBody}</AppText>
        </Card>
      )}

      {overview?.kind === 'estimate' ? <PredictionCards prediction={overview} /> : null}
      {overview?.kind === 'tracking' ? <TrackingCard overview={overview} /> : null}

      <Card title={words.title}>
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

      {suggestions.length > 0 ? (
        <Card tone="muted" title={t.care.title}>
          {suggestions.map((s) => (
            <AppText key={s.kind}>{t.care[s.kind](s.days)}</AppText>
          ))}
          <AppText variant="caption" muted>
            {t.care.footer}
          </AppText>
        </Card>
      ) : null}

      <AppText variant="caption" muted>
        {t.today.disclaimer}
      </AppText>
    </Screen>
  );
}
