import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  disabled?: boolean;
  accessibilityHint?: string;
  /** Overrides the spoken name when the visible label is a symbol. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  accessibilityHint,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const { colors, spacing, radius } = useTheme();
  const palette: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
    secondary: { bg: colors.primarySoft, fg: colors.primary, border: colors.primarySoft },
    ghost: { bg: 'transparent', fg: colors.primary, border: colors.border },
    danger: { bg: 'transparent', fg: colors.danger, border: colors.danger },
  };
  const { bg, fg, border } = palette[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: 1,
          borderRadius: radius.pill,
          paddingVertical: size === 'sm' ? spacing.sm : spacing.md,
          paddingHorizontal: size === 'sm' ? spacing.md : spacing.xl,
          alignItems: 'center',
          opacity: disabled ? 0.5 : pressed ? 0.8 : hovered ? 0.9 : 1,
        },
        style,
      ]}
    >
      <AppText variant="label" color={fg}>
        {label}
      </AppText>
    </Pressable>
  );
}
