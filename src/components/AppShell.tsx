import { usePathname, useRouter, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t } from '@/i18n';

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
  const wide = width >= WIDE_BREAKPOINT;

  const items = NAV_ITEMS.map((item) => {
    const active = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);
    return (
      <Pressable
        key={item.path}
        accessibilityRole="link"
        accessibilityState={{ selected: active }}
        onPress={() => router.navigate(item.href)}
        style={[wide ? styles.sideItem : styles.tabItem, active && styles.active]}
      >
        <Text style={styles.glyph}>{item.glyph}</Text>
        <Text style={wide ? styles.sideLabel : styles.tabLabel}>{item.label}</Text>
      </Pressable>
    );
  });

  if (wide) {
    return (
      <View style={[styles.row, { paddingTop: insets.top }]}>
        <View accessibilityRole="menu" style={styles.sidebar}>
          <Text style={styles.brand}>{t.appName}</Text>
          {items}
        </View>
        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  return (
    <View style={[styles.column, { paddingTop: insets.top }]}>
      <View style={styles.content}>{children}</View>
      <View accessibilityRole="tablist" style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
        {items}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row' },
  column: { flex: 1 },
  content: { flex: 1 },
  sidebar: { width: 220, padding: 16, gap: 4, borderRightWidth: 1, borderColor: '#ddd' },
  brand: { fontSize: 24, fontWeight: '700', marginBottom: 24 },
  sideItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8 },
  sideLabel: { fontSize: 16 },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#ddd' },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  tabLabel: { fontSize: 11 },
  glyph: { fontSize: 18 },
  active: { backgroundColor: '#f1e4ea' },
});
