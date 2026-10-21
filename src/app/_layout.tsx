import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppShell } from '@/components/AppShell';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { OrsaDataProvider, useOrsaData } from '@/data/OrsaDataProvider';
import { t } from '@/i18n';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

function Banner({ text }: { text: string }) {
  const { colors, spacing } = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={{ backgroundColor: colors.primarySoft, padding: spacing.md, borderBottomWidth: 1, borderColor: colors.border }}
    >
      <AppText variant="caption" color={colors.danger}>
        {text}
      </AppText>
    </View>
  );
}

function Content() {
  const { status, reload, saveFailed, recoveredFromUnreadableData } = useOrsaData();
  const { colors, spacing } = useTheme();

  if (status !== 'ready') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, backgroundColor: colors.background }}>
        {status === 'loading' ? (
          <>
            <ActivityIndicator color={colors.primary} />
            <AppText muted>{t.storage.loading}</AppText>
          </>
        ) : (
          <>
            <AppText>{t.storage.loadError}</AppText>
            <Button label={t.storage.retry} onPress={reload} />
          </>
        )}
      </View>
    );
  }

  return (
    <AppShell>
      {saveFailed ? <Banner text={t.storage.saveError} /> : null}
      {recoveredFromUnreadableData ? <Banner text={t.storage.recovered} /> : null}
      <Slot />
    </AppShell>
  );
}

function ThemedApp() {
  const { data } = useOrsaData();
  return (
    <ThemeProvider preference={data.settings.themePreference}>
      <StatusBar style="auto" />
      <Content />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <OrsaDataProvider>
        <ThemedApp />
      </OrsaDataProvider>
    </SafeAreaProvider>
  );
}
