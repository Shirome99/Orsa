import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppShell } from '@/components/AppShell';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppShell>
        <Slot />
      </AppShell>
    </SafeAreaProvider>
  );
}
