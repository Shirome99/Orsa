import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { PeriodActions } from '@/components/PeriodActions';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChoiceChips } from '@/components/ui/ChoiceChips';
import { ScaleSelector } from '@/components/ui/ScaleSelector';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { useOrsaData } from '@/data/OrsaDataProvider';
import { addDays, isISODate, type ISODate } from '@/domain/dates';
import type { DailyLogInput } from '@/domain/records';
import { FLOW_LEVELS, MOODS, PAIN_MAX, PAIN_MIN, type DailyLog } from '@/domain/types';
import { t } from '@/i18n';
import { formatLongDate } from '@/i18n/format';
import { useTheme } from '@/theme/ThemeProvider';

function toDraft(date: ISODate, log: DailyLog | undefined): DailyLogInput {
  return { date, flow: log?.flow, pain: log?.pain, mood: log?.mood, note: log?.note ?? '' };
}

function sameDraft(a: DailyLogInput, b: DailyLogInput): boolean {
  return a.flow === b.flow && a.pain === b.pain && a.mood === b.mood && (a.note ?? '').trim() === (b.note ?? '').trim();
}

export default function JournalScreen() {
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const { data, todayDate, saveDailyLog } = useOrsaData();
  const params = useLocalSearchParams<{ date?: string }>();

  // Only past days and today can be logged; anything else falls back to today.
  const requested = params.date;
  const date: ISODate = requested && isISODate(requested) && requested <= todayDate ? requested : todayDate;
  const savedLog = data.logs[date];

  const [draft, setDraft] = useState<DailyLogInput>(() => toDraft(date, savedLog));
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setDraft(toDraft(date, savedLog));
  }, [date, savedLog]);

  useEffect(() => setJustSaved(false), [date]);

  const dirty = !sameDraft(draft, toDraft(date, savedLog));
  const update = (patch: Partial<DailyLogInput>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setJustSaved(false);
  };
  const goTo = (target: ISODate) => router.setParams({ date: target });

  const save = () => {
    saveDailyLog(draft);
    setJustSaved(true);
  };

  return (
    <Screen title={t.screens.journal.title} subtitle={formatLongDate(date)}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <Button variant="ghost" size="sm" label={`← ${t.journal.previousDay}`} onPress={() => goTo(addDays(date, -1))} />
        <Button
          variant="ghost"
          size="sm"
          label={`${t.journal.nextDay} →`}
          disabled={date >= todayDate}
          onPress={() => goTo(addDays(date, 1))}
        />
        {date !== todayDate ? (
          <Button variant="secondary" size="sm" label={t.journal.backToToday} onPress={() => goTo(todayDate)} />
        ) : null}
      </View>

      <Card title={t.period.title}>
        <PeriodActions date={date} />
      </Card>

      <Card title={t.journal.symptomsTitle}>
        <AppText variant="caption" muted>
          {t.journal.hint}
        </AppText>

        <Field label={t.flow.label}>
          <ChoiceChips
            accessibilityLabel={t.flow.label}
            options={FLOW_LEVELS}
            labels={t.flow.levels}
            value={draft.flow}
            onChange={(flow) => update({ flow })}
          />
        </Field>

        <Field label={t.pain.label}>
          <ScaleSelector
            accessibilityLabel={t.pain.label}
            min={PAIN_MIN}
            max={PAIN_MAX}
            value={draft.pain}
            onChange={(pain) => update({ pain })}
            minLabel={t.pain.min}
            maxLabel={t.pain.max}
          />
        </Field>

        <Field label={t.mood.label}>
          <ChoiceChips
            accessibilityLabel={t.mood.label}
            options={MOODS}
            labels={t.mood.values}
            value={draft.mood}
            onChange={(mood) => update({ mood })}
          />
        </Field>

        <Field label={t.note.label}>
          <TextField
            accessibilityLabel={t.note.label}
            multiline
            maxLength={1000}
            placeholder={t.note.placeholder}
            value={draft.note ?? ''}
            onChangeText={(note) => update({ note })}
          />
        </Field>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md }}>
          <Button label={t.common.save} onPress={save} disabled={!dirty} />
          <Button
            variant="ghost"
            label={t.journal.clear}
            onPress={() => update({ flow: undefined, pain: undefined, mood: undefined, note: '' })}
          />
          {dirty ? (
            <AppText variant="caption" muted>
              {t.journal.unsaved}
            </AppText>
          ) : justSaved ? (
            <AppText variant="label" color={colors.success} accessibilityLiveRegion="polite">
              ✓ {t.journal.savedAt}
            </AppText>
          ) : null}
        </View>
      </Card>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="label">{label}</AppText>
      {children}
    </View>
  );
}
