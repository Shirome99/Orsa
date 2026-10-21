import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';

interface ToggleChipsProps<T extends string> {
  options: readonly T[];
  labels: Record<T, string>;
  values: readonly T[];
  onChange: (values: T[]) => void;
  accessibilityLabel: string;
}

/** Multiple-choice chip group; the result keeps the order of `options`. */
export function ToggleChips<T extends string>({ options, labels, values, onChange, accessibilityLabel }: ToggleChipsProps<T>) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View accessibilityLabel={accessibilityLabel} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {options.map((option) => {
        const selected = values.includes(option);
        return (
          <Pressable
            key={option}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            onPress={() =>
              onChange(options.filter((o) => (o === option ? !selected : values.includes(o))))
            }
            style={{
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.lg,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: selected ? colors.primary : colors.border,
              backgroundColor: selected ? colors.primarySoft : colors.surface,
            }}
          >
            <AppText variant="label" color={selected ? colors.primary : colors.text}>
              {selected ? '✓ ' : ''}
              {labels[option]}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
