import { Redirect } from 'expo-router';
import { useSession } from '../src/store/session';

/** Smista l'utente in base a ruolo e stato di onboarding. */
export default function Index() {
  const {
    token,
    role,
    legalAccepted,
    healthDataConsent,
    profileCompleted,
    disclaimerAccepted,
    languageSelected,
  } = useSession();

  if (!token) return <Redirect href="/welcome" />;

  // La lingua è una preferenza trasversale: va scelta prima di entrare nei flussi di ruolo.
  if (!languageSelected) return <Redirect href="/language" />;

  // Ristoratore → area gestione locale
  if (role === 'owner') return <Redirect href="/(owner)/locali" />;

  // Cliente → onboarding poi app a schede
  if (!legalAccepted || !healthDataConsent) return <Redirect href="/legal" />;
  if (!profileCompleted) return <Redirect href="/allergie" />;
  if (!disclaimerAccepted) return <Redirect href="/disclaimer" />;
  return <Redirect href="/(tabs)/home" />;
}
