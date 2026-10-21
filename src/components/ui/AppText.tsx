import { Text, type TextProps } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import type { TypographyVariant } from '@/theme/tokens';

interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  muted?: boolean;
  color?: string;
}

export function AppText({ variant = 'body', muted, color, style, ...props }: AppTextProps) {
  const theme = useTheme();
  const textColor = color ?? (muted ? theme.colors.textMuted : theme.colors.text);
  return <Text {...props} style={[theme.typography[variant], { color: textColor }, style]} />;
}
