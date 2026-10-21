import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import type { ThemePreference } from '@/domain/types';

import { buildTheme, type Theme } from './tokens';

const ThemeContext = createContext<Theme>(buildTheme(false));

export function ThemeProvider({
  preference,
  children,
}: {
  preference: ThemePreference;
  children: ReactNode;
}) {
  const systemScheme = useColorScheme();
  const dark = preference === 'system' ? systemScheme === 'dark' : preference === 'dark';
  const theme = useMemo(() => buildTheme(dark), [dark]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
