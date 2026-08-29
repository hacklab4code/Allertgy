import { OwnerReviewsPanel } from '../../src/components/owner/OwnerReviewsPanel';
import { OwnerScreenHeader } from '../../src/components/owner/OwnerScreenHeader';
import { GlassScreenScroll } from '../../src/components/ui';
import { useOwner } from '../../src/store/owner';

/** Recensioni — accesso secondario da Profilo, con back chiaro. */
export default function OwnerRecensioni() {
  const { current, restaurants } = useOwner();
  const locale = current ?? restaurants[0] ?? null;

  return (
    <GlassScreenScroll headerFloat>
      <OwnerScreenHeader
        title="Recensioni"
        subtitle={locale ? locale.name : 'Nessun locale'}
      />
      <OwnerReviewsPanel locale={locale} />
    </GlassScreenScroll>
  );
}
