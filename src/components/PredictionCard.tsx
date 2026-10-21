import { useState } from 'react';
import { View } from 'react-native';

import type { BleedingTracking, Confidence, CycleEstimate } from '@/domain/cycle';
import { t } from '@/i18n';
import { formatShortDate } from '@/i18n/format';
import { useTheme } from '@/theme/ThemeProvider';

import { AppText } from './ui/AppText';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

function ConfidenceBadge({ level }: { level: Confidence }) {
  const { colors, spacing, radius } = useTheme();
  const filled = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
  return (
    <View
      accessible
      accessibilityLabel={t.prediction.confidence(t.prediction.confidenceLevels[level])}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
    >
      <View style={{ flexDirection: 'row', gap: 3 }}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              width: 14,
              height: 6,
              borderRadius: radius.pill,
              backgroundColor: i <= filled ? colors.primary : colors.border,
            }}
          />
        ))}
      </View>
      <AppText variant="caption" muted>
        {t.prediction.confidence(t.prediction.confidenceLevels[level])}
      </AppText>
    </View>
  );
}

/** "Pourquoi cette estimation ?": the data and rules behind the numbers, folded by default. */
function WhyThisEstimate({ prediction }: { prediction: CycleEstimate }) {
  const { spacing } = useTheme();
  const [open, setOpen] = useState(false);
  const { stats } = prediction;

  const basis =
    stats.source === 'history'
      ? t.prediction.basisHistory(stats.usedCycleLengths.length, stats.meanCycleLength, Math.round(stats.standardDeviation))
      : stats.source === 'typical'
        ? t.prediction.basisTypical(stats.meanCycleLength)
        : t.prediction.basisDefault(stats.meanCycleLength);

  return (
    <Card tone="muted">
      <View style={{ flexDirection: 'row' }}>
        <Button
          variant="ghost"
          size="sm"
          label={open ? t.prediction.whyHide : `${t.prediction.whyButton}`}
          onPress={() => setOpen(!open)}
        />
      </View>
      {open ? (
        <View style={{ gap: spacing.sm }} accessibilityLiveRegion="polite">
          <AppText variant="caption">{t.prediction.whyMode(t.lifeMode.modes[prediction.mode])}</AppText>
          <AppText variant="caption">{basis}</AppText>
          {stats.excludedCycleCount > 0 ? (
            <AppText variant="caption">{t.prediction.excludedCycles(stats.excludedCycleCount)}</AppText>
          ) : null}
          {stats.excludedByModeCount > 0 ? (
            <AppText variant="caption">{t.prediction.excludedByMode(stats.excludedByModeCount)}</AppText>
          ) : null}
          {prediction.mode === 'perimenopause' ? <AppText variant="caption">{t.prediction.perimenopause}</AppText> : null}
          <AppText variant="caption" muted>
            {t.prediction.method}
          </AppText>
        </View>
      ) : null}
    </Card>
  );
}

/** Estimated phase, next period and ovulation, each with its confidence and the reasoning behind it. */
export function PredictionCards({ prediction }: { prediction: CycleEstimate }) {
  const { colors, spacing } = useTheme();
  const showsFertility = prediction.phase !== 'unknown';
  const fertileWindowText = t.prediction.fertileWindow(
    formatShortDate(prediction.fertileWindow.start),
    formatShortDate(prediction.fertileWindow.end),
  );

  return (
    <>
      {prediction.settlingAfterModeChange ? (
        <Card tone="muted">
          <AppText>{t.prediction.settling}</AppText>
        </Card>
      ) : null}

      {prediction.daysLate > 0 ? (
        <Card tone="muted">
          <AppText variant="heading">{t.prediction.late(prediction.daysLate)}</AppText>
          <AppText>{t.prediction.lateContext}</AppText>
        </Card>
      ) : null}

      {prediction.mode === 'tryingToConceive' && showsFertility ? (
        <Card tone="accent" title={t.calendar.legend.fertile}>
          <AppText variant="heading" color={colors.fertile}>
            {fertileWindowText}
          </AppText>
          <ConfidenceBadge level={prediction.ovulation.confidence} />
          <AppText variant="caption" muted>
            {t.prediction.ttcTip}
          </AppText>
        </Card>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg }}>
        {prediction.daysLate === 0 ? (
          <Card title={t.prediction.nextPeriodTitle} style={{ flexGrow: 1, flexBasis: 280 }}>
            <AppText variant="heading" color={colors.period}>
              {t.prediction.nextPeriodIn(prediction.nextPeriod.daysUntil)}
            </AppText>
            <AppText>
              {t.prediction.nextPeriodWindow(
                formatShortDate(prediction.nextPeriod.window.start),
                formatShortDate(prediction.nextPeriod.window.end),
              )}
            </AppText>
            <ConfidenceBadge level={prediction.confidence} />
          </Card>
        ) : null}

        <Card title={t.prediction.phaseTitle} style={{ flexGrow: 1, flexBasis: 280 }}>
          <AppText variant="heading" color={colors.primary}>
            {t.prediction.phases[prediction.phase]}
          </AppText>
          {showsFertility ? (
            <AppText>
              {t.prediction.ovulationWindow(
                formatShortDate(prediction.ovulation.window.start),
                formatShortDate(prediction.ovulation.window.end),
              )}
            </AppText>
          ) : null}
          {/* During a recorded period, the only estimate on this card is the ovulation. */}
          <ConfidenceBadge
            level={prediction.phase === 'menstruation' ? prediction.ovulation.confidence : prediction.phaseConfidence}
          />
          {showsFertility ? (
            <AppText variant="caption" muted>
              {t.notContraception}
            </AppText>
          ) : null}
        </Card>
      </View>

      <WhyThisEstimate prediction={prediction} />
    </>
  );
}

/** Hormonal contraception / postpartum: explains why nothing is estimated. */
export function TrackingCard({ overview }: { overview: BleedingTracking }) {
  const mode = overview.mode === 'postpartum' ? 'postpartum' : 'hormonalContraception';
  return (
    <Card tone="muted" title={t.prediction.trackingTitle}>
      <AppText>{t.prediction.tracking[mode]}</AppText>
    </Card>
  );
}
