import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';

interface OptionCardsProps<T extends string> {
  options: readonly T[];
  titles: Record<T, string>;
  descriptions: Record<T, string>;
  value: T | undefined;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

/** Single choice between options that need a short explanation each. */
export function OptionCards<T extends string>({
  options,
  titles,
  descriptions,
  value,
  onChange,
  accessibilityLabel,
}: OptionCardsProps<T>) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} style={{ gap: spacing.sm }}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityLabel={titles[option]}
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option)}
            style={({ hovered }: { hovered?: boolean }) => ({
              padding: spacing.lg,
              gap: spacing.xs,
              borderRadius: radius.md,
              borderWidth: selected ? 2 : 1,
              borderColor: selected ? colors.primary : colors.border,
              backgroundColor: selected ? colors.primarySoft : hovered ? colors.surfaceMuted : colors.surface,
            })}
          >
            <AppText variant="heading" color={selected ? colors.primary : colors.text}>
              {titles[option]}
            </AppText>
            <AppText variant="caption" muted>
              {descriptions[option]}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
