import { TextInput, type TextInputProps } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export function TextField({ style, multiline, ...props }: TextInputProps) {
  const { colors, spacing, radius, typography } = useTheme();
  return (
    <TextInput
      {...props}
      multiline={multiline}
      placeholderTextColor={colors.textMuted}
      style={[
        typography.body,
        {
          color: colors.text,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.md,
          padding: spacing.md,
          minHeight: multiline ? 96 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        },
        style,
      ]}
    />
  );
}
