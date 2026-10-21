import { View } from 'react-native';

import type { DailyLog } from '@/domain/types';
import { t } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

import { AppText } from './ui/AppText';

/** Compact read-only view of what was logged for one day. */
export function DaySummary({ log, emptyText }: { log: DailyLog | undefined; emptyText: string }) {
  const { spacing } = useTheme();
  const rows: [string, string][] = [];
  if (log?.flow) rows.push([t.flow.label, t.flow.levels[log.flow]]);
  if (log?.pain !== undefined) rows.push([t.pain.label, t.pain.value(log.pain)]);
  if (log?.mood) rows.push([t.mood.label, t.mood.values[log.mood]]);
  if (log?.note) rows.push([t.note.label, log.note]);

  if (rows.length === 0) return <AppText muted>{emptyText}</AppText>;

  return (
    <View style={{ gap: spacing.sm }}>
      {rows.map(([label, value]) => (
        <View key={label} style={{ flexDirection: 'row', gap: spacing.md }}>
          <AppText variant="label" muted style={{ width: 90 }}>
            {label}
          </AppText>
          <AppText style={{ flex: 1 }}>{value}</AppText>
        </View>
      ))}
    </View>
  );
}
