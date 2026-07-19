import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { getOnboardingRedirect, useSessionHydrated } from '../src/hooks/onboardingGuard';
import { useSession } from '../src/store/session';
import { colors } from '../src/theme';

/** Smista l'utente in base a ruolo e stato di onboarding. */
export default function Index() {
  const hydrated = useSessionHydrated();
  const session = useSession();

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  const area = session.role === 'owner' ? 'owner' : 'customer';
  const gate = getOnboardingRedirect(session, area);
  if (gate) return <Redirect href={gate as any} />;

  if (session.role === 'owner') return <Redirect href="/(owner)/locali" />;
  return <Redirect href="/(tabs)/home" />;
}
