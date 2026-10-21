import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppShell } from '@/components/AppShell';
import { OrsaDataProvider, useOrsaData } from '@/data/OrsaDataProvider';
import { ThemeProvider } from '@/theme/ThemeProvider';

function ThemedApp() {
  const { data } = useOrsaData();
  return (
    <ThemeProvider preference={data.settings.themePreference}>
      <StatusBar style="auto" />
      <AppShell>
        <Slot />
      </AppShell>
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
