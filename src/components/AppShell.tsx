import { usePathname, useRouter, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

import { AppText } from './ui/AppText';

/** Width from which the PC layout (sidebar) replaces the mobile bottom tab bar. */
export const WIDE_BREAKPOINT = 768;

interface NavItem {
  href: Href;
  path: string;
  label: string;
  glyph: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', path: '/', label: t.nav.today, glyph: '◉' },
  { href: '/calendar', path: '/calendar', label: t.nav.calendar, glyph: '▦' },
  { href: '/journal', path: '/journal', label: t.nav.journal, glyph: '✎' },
  { href: '/insights', path: '/insights', label: t.nav.insights, glyph: '◔' },
  { href: '/settings', path: '/settings', label: t.nav.settings, glyph: '⚙' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const wide = width >= WIDE_BREAKPOINT;

  const items = NAV_ITEMS.map((item) => {
    const active = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);
    const color = active ? colors.primary : colors.textMuted;
    return (
      <Pressable
        key={item.path}
        accessibilityRole={wide ? 'link' : 'tab'}
        accessibilityLabel={item.label}
        accessibilityState={{ selected: active }}
        onPress={() => router.navigate(item.href)}
        style={({ hovered }: { hovered?: boolean }) => [
          wide ? styles.sideItem : styles.tabItem,
          wide && { padding: spacing.md, borderRadius: radius.md, gap: spacing.md },
          active && { backgroundColor: colors.primarySoft },
          !active && hovered && { backgroundColor: colors.surfaceMuted },
        ]}
      >
        <AppText color={color} style={styles.glyph}>
          {item.glyph}
        </AppText>
        <AppText variant={wide ? 'body' : 'caption'} color={wide && active ? colors.text : color}>
          {item.label}
        </AppText>
      </Pressable>
    );
  });

  if (wide) {
    return (
      <View style={[styles.row, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View
          role="navigation"
          style={[
            styles.sidebar,
            { backgroundColor: colors.surface, borderColor: colors.border, padding: spacing.lg, gap: spacing.xs },
          ]}
        >
          <AppText variant="title" color={colors.primary} style={{ marginBottom: spacing.xl, paddingHorizontal: spacing.md }}>
            {t.appName}
          </AppText>
          {items}
        </View>
        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  return (
    <View style={[styles.column, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.content}>{children}</View>
      <View
        accessibilityRole="tablist"
        style={[
          styles.tabBar,
          { paddingBottom: insets.bottom, backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {items}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row' },
  column: { flex: 1 },
  content: { flex: 1 },
  sidebar: { width: 232, borderRightWidth: 1 },
  sideItem: { flexDirection: 'row', alignItems: 'center' },
  tabBar: { flexDirection: 'row', borderTopWidth: 1 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 8, gap: 2 },
  glyph: { fontSize: 18, lineHeight: 22 },
});
