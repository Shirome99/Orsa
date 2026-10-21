import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChoiceChips } from '@/components/ui/ChoiceChips';
import { Screen } from '@/components/ui/Screen';
import { useOrsaData } from '@/data/OrsaDataProvider';
import type { ThemePreference } from '@/domain/types';
import { t } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

const THEME_OPTIONS: readonly ThemePreference[] = ['system', 'light', 'dark'];

type DeleteState = 'idle' | 'confirming' | 'done' | 'error';

export default function SettingsScreen() {
  const { colors, spacing } = useTheme();
  const { data, updateSettings, deleteAllData } = useOrsaData();
  const [deleteState, setDeleteState] = useState<DeleteState>('idle');

  const confirmDelete = () => {
    deleteAllData()
      .then(() => setDeleteState('done'))
      .catch(() => setDeleteState('error'));
  };

  return (
    <Screen title={t.screens.settings.title}>
      <Card title={t.settings.themeTitle}>
        <ChoiceChips
          accessibilityLabel={t.settings.themeTitle}
          options={THEME_OPTIONS}
          labels={t.settings.themes}
          value={data.settings.themePreference}
          onChange={(value) => updateSettings({ themePreference: value ?? 'system' })}
        />
      </Card>

      <Card title={t.settings.privacyTitle}>
        <AppText>{t.settings.privacyLocal}</AppText>
        <AppText variant="caption" muted>
          {t.settings.privacyBrowserNote}
        </AppText>
      </Card>

      <Card title={t.settings.deleteTitle}>
        <AppText muted>{t.settings.deleteBody}</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {deleteState === 'confirming' ? (
            <>
              <Button variant="danger" label={t.settings.deleteConfirm} onPress={confirmDelete} />
              <Button variant="ghost" label={t.common.cancel} onPress={() => setDeleteState('idle')} />
            </>
          ) : (
            <Button variant="danger" label={t.settings.deleteButton} onPress={() => setDeleteState('confirming')} />
          )}
        </View>
        {deleteState === 'confirming' ? (
          <AppText variant="label" color={colors.danger}>
            {t.settings.deleteWarning}
          </AppText>
        ) : null}
        {deleteState === 'done' ? (
          <AppText variant="label" color={colors.success} accessibilityLiveRegion="polite">
            {t.settings.deleteDone}
          </AppText>
        ) : null}
        {deleteState === 'error' ? (
          <AppText variant="label" color={colors.danger} accessibilityLiveRegion="polite">
            {t.settings.deleteError}
          </AppText>
        ) : null}
      </Card>

      <Card title={t.settings.aboutTitle} tone="muted">
        <AppText variant="caption" muted>
          {t.settings.aboutBody}
        </AppText>
      </Card>
    </Screen>
  );
}
