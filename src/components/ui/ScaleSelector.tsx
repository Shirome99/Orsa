import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';

interface ScaleSelectorProps {
  min: number;
  max: number;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  accessibilityLabel: string;
  minLabel?: string;
  maxLabel?: string;
}

/** Row of numbered buttons (e.g. pain 0–10). Pressing the active value clears it. */
export function ScaleSelector({
  min,
  max,
  value,
  onChange,
  accessibilityLabel,
  minLabel,
  maxLabel,
}: ScaleSelectorProps) {
  const { colors, spacing, radius } = useTheme();
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <View style={{ gap: spacing.xs }}>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={accessibilityLabel}
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}
      >
        {values.map((n) => {
          const selected = n === value;
          return (
            <Pressable
              key={n}
              accessibilityRole="radio"
              accessibilityLabel={`${n}`}
              accessibilityState={{ checked: selected }}
              onPress={() => onChange(selected ? undefined : n)}
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.sm,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.primary : colors.surface,
              }}
            >
              <AppText variant="label" color={selected ? colors.onPrimary : colors.text}>
                {n}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {minLabel || maxLabel ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', maxWidth: values.length * 44 }}>
          <AppText variant="caption" muted>
            {minLabel}
          </AppText>
          <AppText variant="caption" muted>
            {maxLabel}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
