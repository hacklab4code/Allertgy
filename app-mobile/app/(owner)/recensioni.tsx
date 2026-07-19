import { ScrollView } from 'react-native';
import { OwnerReviewsPanel } from '../../src/components/owner/OwnerReviewsPanel';
import { Screen } from '../../src/components/ui';
import { useOwner } from '../../src/store/owner';
import { TAB_BAR_CLEARANCE, spacing } from '../../src/theme';

/** Schermata dedicata recensioni — stesso pannello della tab Attività. */
export default function OwnerRecensioni() {
  const { current, restaurants } = useOwner();
  const locale = current ?? restaurants[0] ?? null;

  return (
    <Screen edges={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE, paddingTop: spacing.md }}>
        <OwnerReviewsPanel locale={locale} />
      </ScrollView>
    </Screen>
  );
}
