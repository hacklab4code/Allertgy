import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { useSession } from '../store/session';

export type OnboardingGate = {
  token: string | null;
  role: 'customer' | 'owner';
  legalAccepted: boolean;
  healthDataConsent: boolean;
  profileCompleted: boolean;
  disclaimerAccepted: boolean;
  tourCompleted: boolean;
  registerAllergieStep: boolean;
  languageSelected: boolean;
};

/** Percorso obbligatorio prima di accedere a un'area protetta; null = ok. */
export function getOnboardingRedirect(
  state: OnboardingGate,
  area: 'customer' | 'owner',
): string | null {
  if (!state.token) return '/welcome';
  if (!state.languageSelected) return '/language';

  if (area === 'owner') {
    if (state.role !== 'owner') return '/(tabs)/home';
    if (!state.tourCompleted) return '/onboarding';
    return null;
  }

  if (state.role === 'owner') return '/(owner)/locali';
  if (!state.legalAccepted || !state.healthDataConsent) return '/legal';
  if (!state.profileCompleted) {
    return state.registerAllergieStep ? '/register-allergies' : '/allergie';
  }
  if (!state.disclaimerAccepted) return '/disclaimer';
  if (!state.tourCompleted) return '/onboarding';
  return null;
}

export function useSessionHydrated() {
  const [hydrated, setHydrated] = useState(() => useSession.persist.hasHydrated());
  useEffect(() => {
    const unsub = useSession.persist.onFinishHydration(() => setHydrated(true));
    if (useSession.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  return hydrated;
}

/** Destinazione post-login / post-onboarding (evita redirect a catena su index). */
export function resolveAuthenticatedRoute(state: OnboardingGate): string {
  const area = state.role === 'owner' ? 'owner' : 'customer';
  const gate = getOnboardingRedirect(state, area);
  if (gate) return gate;
  return state.role === 'owner' ? '/(owner)/locali' : '/(tabs)/home';
}

/** Redirect se l'utente non ha completato i gate per l'area richiesta. */
export function OnboardingRedirect({ area }: { area: 'customer' | 'owner' }) {
  const hydrated = useSessionHydrated();
  const session = useSession();
  if (!hydrated) return null;
  const href = getOnboardingRedirect(session, area);
  if (href) return <Redirect href={href as any} />;
  return null;
}
