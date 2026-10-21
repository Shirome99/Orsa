import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChoiceChips } from '@/components/ui/ChoiceChips';
import { OptionCards } from '@/components/ui/OptionCards';
import { ToggleChips } from '@/components/ui/ToggleChips';
import { Screen } from '@/components/ui/Screen';
import { useOrsaData } from '@/data/OrsaDataProvider';
import { lifeModeOn } from '@/domain/records';
import { CONTRACEPTION_METHODS, LIFE_MODES, TRACKABLE_ITEMS, type ThemePreference } from '@/domain/types';
import { t } from '@/i18n';
import { formatShortDate } from '@/i18n/format';
import { useTheme } from '@/theme/ThemeProvider';

const THEME_OPTIONS: readonly ThemePreference[] = ['system', 'light', 'dark'];

type DeleteState = 'idle' | 'confirming' | 'done' | 'error';

export default function SettingsScreen() {
  const { colors, spacing } = useTheme();
  const { data, todayDate, updateSettings, setLifeMode, deleteAllData } = useOrsaData();
  const currentMode = lifeModeOn(data.lifeModes, todayDate);
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

      <Card title={t.lifeMode.title}>
        <AppText variant="caption" muted>
          {t.lifeMode.changeHint}
        </AppText>
        <OptionCards
          accessibilityLabel={t.lifeMode.title}
          options={LIFE_MODES}
          titles={t.lifeMode.modes}
          descriptions={t.lifeMode.descriptions}
          value={currentMode.mode}
          onChange={(mode) => setLifeMode(mode)}
        />
        {currentMode.mode === 'hormonalContraception' ? (
          <View style={{ gap: spacing.sm }}>
            <AppText variant="label">{t.lifeMode.methodTitle}</AppText>
            <ChoiceChips
              accessibilityLabel={t.lifeMode.methodTitle}
              options={CONTRACEPTION_METHODS}
              labels={t.lifeMode.methods}
              value={currentMode.contraceptionMethod}
              onChange={(method) => setLifeMode('hormonalContraception', method)}
            />
          </View>
        ) : null}
        {data.lifeModes.length > 0 ? (
          <View style={{ gap: spacing.xs }}>
            <AppText variant="label">{t.lifeMode.historyTitle}</AppText>
            {[...data.lifeModes].reverse().map((entry) => (
              <AppText key={entry.id} variant="caption" muted>
                {t.lifeMode.historyItem(
                  t.lifeMode.modes[entry.mode] +
                    (entry.contraceptionMethod ? ` (${t.lifeMode.methods[entry.contraceptionMethod].toLowerCase()})` : ''),
                  formatShortDate(entry.startDate),
                )}
              </AppText>
            ))}
          </View>
        ) : null}
      </Card>

      <Card title={t.tracking.title}>
        <AppText variant="caption" muted>
          {t.tracking.periodsAlways}
        </AppText>
        <ToggleChips
          accessibilityLabel={t.tracking.title}
          options={TRACKABLE_ITEMS}
          labels={t.tracking.items}
          values={data.settings.trackedItems}
          onChange={(trackedItems) => updateSettings({ trackedItems })}
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
