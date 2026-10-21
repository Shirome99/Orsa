import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
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
import {
  ENERGY_MAX,
  ENERGY_MIN,
  FLOW_LEVELS,
  MOODS,
  PAIN_MAX,
  PAIN_MIN,
  SLEEP_QUALITIES,
  TRACKABLE_ITEMS,
  type DailyLog,
  type TrackableItem,
} from '@/domain/types';
import { t } from '@/i18n';
import { formatLongDate } from '@/i18n/format';
import { useTheme } from '@/theme/ThemeProvider';

const YES_NO = ['yes', 'no'] as const;
const toYesNo = (value: boolean | undefined) => (value === undefined ? undefined : value ? 'yes' : 'no');
const fromYesNo = (value: 'yes' | 'no' | undefined) => (value === undefined ? undefined : value === 'yes');

function toDraft(date: ISODate, log: DailyLog | undefined): DailyLogInput {
  const { updatedAt: _ignored, ...fields } = log ?? { date, updatedAt: '' };
  return { ...fields, date, note: log?.note ?? '' };
}

function sameDraft(a: DailyLogInput, b: DailyLogInput): boolean {
  return TRACKABLE_ITEMS.every((item) =>
    item === 'note' ? (a.note ?? '').trim() === (b.note ?? '').trim() : a[item] === b[item],
  );
}

function hasValue(log: DailyLogInput, item: TrackableItem): boolean {
  return item === 'note' ? Boolean(log.note?.trim()) : log[item] !== undefined;
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

  const tracked = data.settings.trackedItems;
  const savedDraft = toDraft(date, savedLog);
  // An item no longer tracked stays editable on days where it was filled in.
  const visibleItems = TRACKABLE_ITEMS.filter((item) => tracked.includes(item) || hasValue(savedDraft, item));

  const dirty = !sameDraft(draft, savedDraft);
  const update = (patch: Partial<DailyLogInput>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setJustSaved(false);
  };
  const goTo = (target: ISODate) => router.setParams({ date: target });

  const save = () => {
    saveDailyLog(draft);
    setJustSaved(true);
  };

  const clearAll = () =>
    update(Object.fromEntries(TRACKABLE_ITEMS.map((item) => [item, item === 'note' ? '' : undefined])));

  const fields: Record<TrackableItem, ReactNode> = {
    flow: (
      <ChoiceChips
        accessibilityLabel={t.flow.label}
        options={FLOW_LEVELS}
        labels={t.flow.levels}
        value={draft.flow}
        onChange={(flow) => update({ flow })}
      />
    ),
    pain: (
      <ScaleSelector
        accessibilityLabel={t.pain.label}
        min={PAIN_MIN}
        max={PAIN_MAX}
        value={draft.pain}
        onChange={(pain) => update({ pain })}
        minLabel={t.pain.min}
        maxLabel={t.pain.max}
      />
    ),
    mood: (
      <ChoiceChips
        accessibilityLabel={t.mood.label}
        options={MOODS}
        labels={t.mood.values}
        value={draft.mood}
        onChange={(mood) => update({ mood })}
      />
    ),
    energy: (
      <ScaleSelector
        accessibilityLabel={t.energy.label}
        min={ENERGY_MIN}
        max={ENERGY_MAX}
        value={draft.energy}
        onChange={(energy) => update({ energy })}
        minLabel={t.energy.min}
        maxLabel={t.energy.max}
      />
    ),
    sleep: (
      <ChoiceChips
        accessibilityLabel={t.sleep.label}
        options={SLEEP_QUALITIES}
        labels={t.sleep.values}
        value={draft.sleep}
        onChange={(sleep) => update({ sleep })}
      />
    ),
    hotFlashes: (
      <ChoiceChips
        accessibilityLabel={t.hotFlashes.label}
        options={YES_NO}
        labels={t.yesNo}
        value={toYesNo(draft.hotFlashes)}
        onChange={(v) => update({ hotFlashes: fromYesNo(v) })}
      />
    ),
    nightSweats: (
      <ChoiceChips
        accessibilityLabel={t.nightSweats.label}
        options={YES_NO}
        labels={t.yesNo}
        value={toYesNo(draft.nightSweats)}
        onChange={(v) => update({ nightSweats: fromYesNo(v) })}
      />
    ),
    note: (
      <TextField
        accessibilityLabel={t.note.label}
        multiline
        maxLength={1000}
        placeholder={t.note.placeholder}
        value={draft.note ?? ''}
        onChangeText={(note) => update({ note })}
      />
    ),
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
        {visibleItems.length === 0 ? (
          <>
            <AppText muted>{t.journal.noneTracked}</AppText>
            <View style={{ flexDirection: 'row' }}>
              <Button variant="ghost" label={t.journal.chooseItems} onPress={() => router.navigate('/settings')} />
            </View>
          </>
        ) : (
          <>
            <AppText variant="caption" muted>
              {t.journal.hint}
            </AppText>

            {visibleItems.map((item) => (
              <Field
                key={item}
                label={t.tracking.items[item]}
                hint={tracked.includes(item) ? undefined : t.journal.notTrackedAnymore}
              >
                {fields[item]}
              </Field>
            ))}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md }}>
              <Button label={t.common.save} onPress={save} disabled={!dirty} />
              <Button variant="ghost" label={t.journal.clear} onPress={clearAll} />
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
          </>
        )}
      </Card>
    </Screen>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="label">
        {label}
        {hint ? (
          <AppText variant="caption" muted>
            {`  · ${hint}`}
          </AppText>
        ) : null}
      </AppText>
      {children}
    </View>
  );
}
