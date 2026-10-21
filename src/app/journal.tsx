import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { t } from '@/i18n';

export default function JournalScreen() {
  return (
    <Screen title={t.screens.journal.title}>
      <Card>
        <AppText muted>{t.common.comingSoon}</AppText>
      </Card>
    </Screen>
  );
}
