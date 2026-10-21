import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';

interface CardProps {
  title?: string;
  children?: ReactNode;
  tone?: 'default' | 'muted' | 'accent';
  style?: StyleProp<ViewStyle>;
}

export function Card({ title, children, tone = 'default', style }: CardProps) {
  const { colors, spacing, radius } = useTheme();
  const backgroundColor =
    tone === 'accent' ? colors.primarySoft : tone === 'muted' ? colors.surfaceMuted : colors.surface;
  return (
    <View
      style={[
        {
          backgroundColor,
          borderColor: colors.border,
          borderWidth: tone === 'default' ? 1 : 0,
          borderRadius: radius.lg,
          padding: spacing.lg,
          gap: spacing.md,
        },
        style,
      ]}
    >
      {title ? <AppText variant="heading">{title}</AppText> : null}
      {children}
    </View>
  );
}
