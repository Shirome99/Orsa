import { useState } from 'react';
import { View } from 'react-native';

import { MonthCalendar } from '@/components/calendar/MonthCalendar';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChoiceChips } from '@/components/ui/ChoiceChips';
import { OptionCards } from '@/components/ui/OptionCards';
import { Screen } from '@/components/ui/Screen';
import { Stepper } from '@/components/ui/Stepper';
import { ToggleChips } from '@/components/ui/ToggleChips';
import { useOrsaData } from '@/data/OrsaDataProvider';
import type { DayMark } from '@/domain/calendarMarks';
import { DEFAULT_CYCLE_LENGTH, MAX_PLAUSIBLE_CYCLE, MIN_PLAUSIBLE_CYCLE } from '@/domain/cycle';
import { parseISODate, type ISODate } from '@/domain/dates';
import { suggestedTrackedItems, usesBleedingVocabulary } from '@/domain/lifeModes';
import {
  CONTRACEPTION_METHODS,
  LIFE_MODES,
  TRACKABLE_ITEMS,
  type ContraceptionMethod,
  type LifeMode,
  type TrackableItem,
} from '@/domain/types';
import { t } from '@/i18n';
import { formatMonthYear } from '@/i18n/format';
import { useTheme } from '@/theme/ThemeProvider';

const STEP_COUNT = 5;
const MAX_PERIOD_STARTS = 12;

/** First-launch flow: privacy and "not a contraception" notice, life mode, optional history, tracked items. */
export function Onboarding() {
  const { colors, spacing } = useTheme();
  const { todayDate, completeOnboarding } = useOrsaData();

  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<LifeMode>();
  const [method, setMethod] = useState<ContraceptionMethod>();
  const [periodStarts, setPeriodStarts] = useState<ISODate[]>([]);
  const [typicalLength, setTypicalLength] = useState<number>();
  const [trackedItems, setTrackedItems] = useState<TrackableItem[]>(suggestedTrackedItems('natural'));
  const [trackingTouched, setTrackingTouched] = useState(false);

  const now = parseISODate(todayDate);
  const [month, setMonth] = useState({ year: now.getFullYear(), index: now.getMonth() });

  const chooseMode = (value: LifeMode) => {
    setMode(value);
    if (value !== 'hormonalContraception') setMethod(undefined);
    if (!trackingTouched) setTrackedItems(suggestedTrackedItems(value));
  };

  const togglePeriodStart = (date: ISODate) => {
    if (date > todayDate) return;
    setPeriodStarts((current) =>
      current.includes(date)
        ? current.filter((d) => d !== date)
        : current.length < MAX_PERIOD_STARTS
          ? [...current, date].sort()
          : current,
    );
  };

  const shiftMonth = (delta: number) => {
    const target = new Date(month.year, month.index + delta, 1);
    setMonth({ year: target.getFullYear(), index: target.getMonth() });
  };

  const finish = () => {
    if (!mode) return;
    completeOnboarding({
      mode,
      contraceptionMethod: method,
      periodStarts,
      typicalCycleLength: typicalLength,
      trackedItems,
    });
  };

  const marks: Record<ISODate, DayMark> = Object.fromEntries(
    periodStarts.map((d) => [d, { period: true, periodStart: true }]),
  );
  const bleeding = mode ? usesBleedingVocabulary(mode) : false;
  const asksTypicalLength = mode === 'natural' || mode === 'tryingToConceive' || mode === 'perimenopause';

  const nav = (canContinue: boolean, onNext: () => void, skippable = false) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      <Button variant="ghost" label={t.onboarding.back} onPress={() => setStep(step - 1)} />
      <Button label={t.onboarding.next} disabled={!canContinue} onPress={onNext} />
      {skippable ? <Button variant="ghost" label={t.onboarding.skip} onPress={() => setStep(step + 1)} /> : null}
    </View>
  );

  const notContraception = (
    <Card tone="accent">
      <AppText variant="label" color={colors.primary}>
        ⚠ {t.notContraception}
      </AppText>
    </Card>
  );

  return (
    <Screen title={t.appName} subtitle={t.onboarding.step(step + 1, STEP_COUNT)}>
      {step === 0 ? (
        <>
          <Card title={t.onboarding.welcomeTitle}>
            <AppText>{t.onboarding.welcomeBody}</AppText>
            <View style={{ gap: spacing.xs }}>
              {t.onboarding.privacyPoints.map((point) => (
                <AppText key={point}>• {point}</AppText>
              ))}
            </View>
            <AppText variant="caption" muted>
              {t.onboarding.notMedical}
            </AppText>
          </Card>
          {notContraception}
          <View style={{ flexDirection: 'row' }}>
            <Button label={t.onboarding.understood} onPress={() => setStep(1)} />
          </View>
        </>
      ) : null}

      {step === 1 ? (
        <Card title={t.onboarding.modeTitle}>
          <AppText muted>{t.onboarding.modeBody}</AppText>
          <OptionCards
            accessibilityLabel={t.lifeMode.title}
            options={LIFE_MODES}
            titles={t.lifeMode.modes}
            descriptions={t.lifeMode.descriptions}
            value={mode}
            onChange={chooseMode}
          />
          {mode === 'hormonalContraception' ? (
            <View style={{ gap: spacing.sm }}>
              <AppText variant="label">{t.lifeMode.methodTitle}</AppText>
              <ChoiceChips
                accessibilityLabel={t.lifeMode.methodTitle}
                options={CONTRACEPTION_METHODS}
                labels={t.lifeMode.methods}
                value={method}
                onChange={setMethod}
              />
            </View>
          ) : null}
          {nav(mode !== undefined, () => setStep(2))}
        </Card>
      ) : null}

      {step === 2 ? (
        <>
          <Card title={bleeding ? t.onboarding.bleedingsTitle : t.onboarding.cyclesTitle}>
            <AppText muted>{t.onboarding.cyclesBody}</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Button variant="ghost" size="sm" label="←" accessibilityLabel={t.calendar.previousMonth} onPress={() => shiftMonth(-1)} />
              <AppText variant="heading" style={{ flex: 1, textAlign: 'center' }}>
                {formatMonthYear(month.year, month.index)}
              </AppText>
              <Button
                variant="ghost"
                size="sm"
                label="→"
                accessibilityLabel={t.calendar.nextMonth}
                disabled={month.year === now.getFullYear() && month.index === now.getMonth()}
                onPress={() => shiftMonth(1)}
              />
            </View>
            <MonthCalendar
              year={month.year}
              monthIndex={month.index}
              marks={marks}
              todayDate={todayDate}
              selectedDate={undefined}
              onSelect={togglePeriodStart}
            />
            <AppText variant="caption" muted accessibilityLiveRegion="polite">
              {t.onboarding.selectedCount(periodStarts.length)}
            </AppText>
          </Card>
          {asksTypicalLength ? (
            <Card title={t.onboarding.typicalLengthTitle}>
              <AppText muted>{t.onboarding.typicalLengthBody}</AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md }}>
                <ChoiceChips
                  accessibilityLabel={t.onboarding.typicalLengthTitle}
                  options={['unknown'] as const}
                  labels={{ unknown: t.onboarding.unknownLength }}
                  value={typicalLength === undefined ? 'unknown' : undefined}
                  onChange={(v) => setTypicalLength(v ? undefined : DEFAULT_CYCLE_LENGTH)}
                />
                <Stepper
                  value={typicalLength ?? DEFAULT_CYCLE_LENGTH}
                  min={MIN_PLAUSIBLE_CYCLE}
                  max={MAX_PLAUSIBLE_CYCLE}
                  onChange={setTypicalLength}
                  format={(n) => (typicalLength === undefined ? '—' : t.onboarding.lengthValue(n))}
                  decreaseLabel={t.onboarding.decrease}
                  increaseLabel={t.onboarding.increase}
                />
              </View>
            </Card>
          ) : null}
          {nav(true, () => setStep(3), periodStarts.length === 0)}
        </>
      ) : null}

      {step === 3 ? (
        <Card title={t.onboarding.trackingTitle}>
          <AppText muted>{t.tracking.hint}</AppText>
          <AppText variant="caption">{t.tracking.periodsAlways}</AppText>
          <ToggleChips
            accessibilityLabel={t.tracking.title}
            options={TRACKABLE_ITEMS}
            labels={t.tracking.items}
            values={trackedItems}
            onChange={(values) => {
              setTrackingTouched(true);
              setTrackedItems(values);
            }}
          />
          {nav(true, () => setStep(4))}
        </Card>
      ) : null}

      {step === 4 && mode ? (
        <>
          <Card title={t.onboarding.summaryTitle}>
            <AppText>{t.onboarding.summaryMode(t.lifeMode.modes[mode])}</AppText>
            <AppText>{t.onboarding.summaryCycles(periodStarts.length)}</AppText>
            <AppText>
              {t.onboarding.summaryTracking(trackedItems.map((i) => t.tracking.items[i].toLowerCase()).join(', '))}
            </AppText>
          </Card>
          {notContraception}
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button variant="ghost" label={t.onboarding.back} onPress={() => setStep(3)} />
            <Button label={t.onboarding.finish} onPress={finish} />
          </View>
        </>
      ) : null}
    </Screen>
  );
}
