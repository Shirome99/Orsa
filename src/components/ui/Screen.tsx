import { useEffect, type ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { t } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { CONTENT_MAX_WIDTH } from '@/theme/tokens';

import { AppText } from './AppText';

interface ScreenProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

/** Scrollable page with a centred, width-limited column (readable on large PC screens). */
export function Screen({ title, subtitle, children }: ScreenProps) {
  const theme = useTheme();

  useEffect(() => {
    if (Platform.OS === 'web') document.title = `${title} · ${t.appName}`;
  }, [title]);

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[styles.scroll, { padding: theme.spacing.xl }]}
    >
      <View style={[styles.column, { gap: theme.spacing.lg }]}>
        <View style={{ gap: theme.spacing.xs }}>
          <AppText variant="title" accessibilityRole="header">
            {title}
          </AppText>
          {subtitle ? <AppText muted>{subtitle}</AppText> : null}
        </View>
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, alignItems: 'center' },
  column: { width: '100%', maxWidth: CONTENT_MAX_WIDTH },
});
