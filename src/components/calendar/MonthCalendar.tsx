import { Pressable, View } from 'react-native';

import type { DayMark } from '@/domain/calendarMarks';
import { monthGrid, parseISODate, type ISODate } from '@/domain/dates';
import { t } from '@/i18n';
import { formatLongDate, WEEKDAY_SHORT } from '@/i18n/format';
import { useTheme } from '@/theme/ThemeProvider';

import { AppText } from '../ui/AppText';

interface MonthCalendarProps {
  year: number;
  monthIndex: number;
  marks: Record<ISODate, DayMark>;
  todayDate: ISODate;
  selectedDate: ISODate | undefined;
  onSelect: (date: ISODate) => void;
  /** Use the "saignements" wording (hormonal contraception, postpartum). */
  bleeding?: boolean;
}

function describeMark(mark: DayMark | undefined, bleeding: boolean): string[] {
  if (!mark) return [];
  const details: string[] = [];
  if (mark.period) details.push(bleeding ? t.calendar.legend.bleeding : t.calendar.legend.period);
  if (mark.predictedPeriod) details.push(t.calendar.legend.predictedPeriod);
  if (mark.ovulation) details.push(t.calendar.legend.ovulation);
  else if (mark.fertile) details.push(t.calendar.legend.fertile);
  if (mark.hasLog) details.push(t.calendar.legend.hasLog);
  return details;
}

export function MonthCalendar({ year, monthIndex, marks, todayDate, selectedDate, onSelect, bleeding = false }: MonthCalendarProps) {
  const { colors, spacing, radius } = useTheme();
  const cells = monthGrid(year, monthIndex);

  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row' }}>
        {WEEKDAY_SHORT.map((day) => (
          <AppText key={day} variant="caption" muted style={{ flex: 1, textAlign: 'center' }}>
            {day}
          </AppText>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((date) => {
          const mark = marks[date];
          const inMonth = parseISODate(date).getMonth() === monthIndex;
          const isToday = date === todayDate;
          const selected = date === selectedDate;

          let backgroundColor = 'transparent';
          let textColor = inMonth ? colors.text : colors.textMuted;
          let borderStyle: 'solid' | 'dashed' = 'solid';
          let borderColor = 'transparent';
          if (mark?.period) {
            backgroundColor = colors.period;
            textColor = colors.onPrimary;
          } else if (mark?.predictedPeriod) {
            backgroundColor = colors.periodSoft;
            borderColor = colors.period;
            borderStyle = 'dashed';
          } else if (mark?.fertile) {
            backgroundColor = colors.fertileSoft;
          }
          if (isToday) borderColor = colors.text;
          if (isToday) borderStyle = 'solid';

          return (
            <View key={date} style={{ width: `${100 / 7}%`, padding: 2 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.calendar.dayLabel(formatLongDate(date), describeMark(mark, bleeding))}
                accessibilityState={{ selected }}
                onPress={() => onSelect(date)}
                style={({ hovered }: { hovered?: boolean }) => ({
                  aspectRatio: 1,
                  maxHeight: 72,
                  width: '100%',
                  borderRadius: radius.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor,
                  borderWidth: 2,
                  borderStyle,
                  borderColor,
                  opacity: inMonth ? 1 : 0.45,
                  outlineColor: colors.focus,
                  outlineWidth: selected ? 2 : 0,
                  outlineStyle: 'solid',
                  outlineOffset: 1,
                  ...(hovered && !mark?.period ? { backgroundColor: colors.surfaceMuted } : null),
                })}
              >
                <AppText variant="label" color={textColor}>
                  {parseISODate(date).getDate()}
                </AppText>
                <View style={{ flexDirection: 'row', gap: 3, height: 6, marginTop: 2 }}>
                  {mark?.ovulation ? (
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.ovulation }} />
                  ) : null}
                  {mark?.hasLog ? (
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: mark.period ? colors.onPrimary : colors.primary,
                      }}
                    />
                  ) : null}
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** Legend explaining the calendar colors; estimates are labelled as such. */
export function CalendarLegend({ estimates = true, bleeding = false }: { estimates?: boolean; bleeding?: boolean }) {
  const { colors, spacing } = useTheme();
  const recorded = { label: bleeding ? t.calendar.legend.bleeding : t.calendar.legend.period, swatch: { backgroundColor: colors.period } };
  const logged = { label: t.calendar.legend.hasLog, swatch: { backgroundColor: colors.primary, borderRadius: 6, width: 8, height: 8 } };
  const items: { label: string; swatch: object }[] = !estimates ? [recorded, logged] : [
    recorded,
    {
      label: t.calendar.legend.predictedPeriod,
      swatch: { backgroundColor: colors.periodSoft, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.period },
    },
    { label: t.calendar.legend.fertile, swatch: { backgroundColor: colors.fertileSoft } },
    { label: t.calendar.legend.ovulation, swatch: { backgroundColor: colors.ovulation, borderRadius: 6, width: 8, height: 8 } },
    { label: t.calendar.legend.hasLog, swatch: { backgroundColor: colors.primary, borderRadius: 6, width: 8, height: 8 } },
  ];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
      {items.map((item) => (
        <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <View style={[{ width: 16, height: 16, borderRadius: 4 }, item.swatch]} />
          <AppText variant="caption" muted>
            {item.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}
