import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppShell } from '@/components/AppShell';
import { ThemeProvider } from '@/theme/ThemeProvider';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider preference="system">
        <StatusBar style="auto" />
        <AppShell>
          <Slot />
        </AppShell>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
