import { View } from 'react-native';

import type { Confidence, CyclePrediction } from '@/domain/cycle';
import { t } from '@/i18n';
import { formatShortDate } from '@/i18n/format';
import { useTheme } from '@/theme/ThemeProvider';

import { AppText } from './ui/AppText';
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

/** Estimated phase, next period and ovulation, each with its confidence and the reasoning behind it. */
export function PredictionCards({ prediction }: { prediction: CyclePrediction }) {
  const { colors, spacing } = useTheme();
  const { stats } = prediction;

  const basis = stats.basedOnHistory
    ? t.prediction.basisHistory(stats.usedCycleLengths.length, stats.meanCycleLength, Math.round(stats.standardDeviation))
    : t.prediction.basisDefault(stats.meanCycleLength);

  return (
    <>
      {prediction.daysLate > 0 ? (
        <Card tone="muted">
          <AppText variant="heading">{t.prediction.late(prediction.daysLate)}</AppText>
          <AppText>{t.prediction.lateContext}</AppText>
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
          {prediction.phase !== 'unknown' ? (
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
        </Card>
      </View>

      <Card tone="muted" title={t.prediction.howTitle}>
        <AppText variant="caption">{basis}</AppText>
        {stats.excludedCycleCount > 0 ? (
          <AppText variant="caption">{t.prediction.excludedCycles(stats.excludedCycleCount)}</AppText>
        ) : null}
        <AppText variant="caption" muted>
          {t.prediction.method}
        </AppText>
      </Card>
    </>
  );
}
