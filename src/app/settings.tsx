import { StyleSheet, Text, View } from 'react-native';

import { t } from '@/i18n';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.screens.settings.title}</Text>
      <Text>{t.common.comingSoon}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 8 },
  title: { fontSize: 28, fontWeight: '700' },
});
