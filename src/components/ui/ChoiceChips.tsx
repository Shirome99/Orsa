import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';

interface ChoiceChipsProps<T extends string> {
  options: readonly T[];
  labels: Record<T, string>;
  value: T | undefined;
  /** Called with `undefined` when the selected chip is pressed again (deselect). */
  onChange: (value: T | undefined) => void;
  accessibilityLabel: string;
}

/** Single-choice chip group. Pressing the active chip clears the choice. */
export function ChoiceChips<T extends string>({
  options,
  labels,
  value,
  onChange,
  accessibilityLabel,
}: ChoiceChipsProps<T>) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}
    >
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(selected ? undefined : option)}
            style={{
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.lg,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: selected ? colors.primary : colors.border,
              backgroundColor: selected ? colors.primary : colors.surface,
            }}
          >
            <AppText variant="label" color={selected ? colors.onPrimary : colors.text}>
              {labels[option]}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
