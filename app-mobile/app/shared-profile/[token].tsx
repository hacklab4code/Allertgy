import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { api } from '../../src/api/client';
import { useSession } from '../../src/store/session';
import type { SharedProfile } from '../../src/types';
import {
  AppText,
  GlassCard,
  GlassScreenScroll,
  PuffyButton,
  Screen,
} from '../../src/components/ui';
import { colors, spacing, radius } from '../../src/theme';

export default function SharedProfileScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { setAllergie, setProfileCompleted, language } = useSession();
  const [profile, setProfile] = useState<SharedProfile | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const isIt = (language || 'it').toLowerCase() === 'it';

  useEffect(() => {
    if (!token) return;
    api.getSharedProfile(token)
      .then(setProfile)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [token]);

  const useProfileNow = () => {
    if (!profile) return;
    const intensities = Object.fromEntries(
      profile.allergens.map((a) => [a.code, a.intensity]),
    ) as Record<string, 'lieve' | 'moderata' | 'grave'>;
    setAllergie(profile.allergens.map((a) => a.code), intensities);
    setProfileCompleted(true);
    router.replace('/(tabs)/home');
  };

  return (
    <Screen edges={false} ambient>
      <Stack.Screen options={{ title: isIt ? 'Profilo condiviso' : 'Shared profile' }} />
      <GlassScreenScroll>
        {loading ? (
          <ActivityIndicator color={colors.brand} />
        ) : error ? (
          <GlassCard style={styles.card}>
            <AppText style={styles.icon}>⚠️</AppText>
            <AppText variant="h2">{isIt ? 'Link non disponibile' : 'Link unavailable'}</AppText>
            <AppText variant="body" color={colors.onSurfaceMuted}>{error}</AppText>
          </GlassCard>
        ) : profile ? (
          <>
            <GlassCard style={styles.card}>
              <AppText style={styles.icon}>🔗</AppText>
              <AppText variant="eyebrow" color={colors.brand}>
                {isIt ? 'Profilo AllerTgy condiviso' : 'Shared AllerTgy profile'}
              </AppText>
              <AppText variant="h1">{profile.profile_name}</AppText>
              <AppText variant="body" color={colors.onSurfaceMuted}>
                {profile.expires_at
                  ? (isIt ? 'Valido temporaneamente per spesa, festa o uscita.' : 'Temporarily valid for shopping, parties, or dining out.')
                  : (isIt ? 'Condivisione permanente per famiglia o caregiver.' : 'Permanent sharing for family or caregivers.')}
              </AppText>
            </GlassCard>

            <GlassCard style={styles.card}>
              <AppText variant="title">
                {isIt ? 'Allergie condivise' : 'Shared allergies'}
              </AppText>
              {profile.allergens.length === 0 ? (
                <AppText variant="body" color={colors.onSurfaceMuted}>
                  {isIt ? 'Nessuna allergia indicata.' : 'No allergies listed.'}
                </AppText>
              ) : (
                <View style={styles.chips}>
                  {profile.allergens.map((a) => (
                    <View key={a.code} style={styles.chip}>
                      <AppText variant="caption">
                        {a.emoji} {a.name_it} · {a.intensity}
                      </AppText>
                    </View>
                  ))}
                </View>
              )}
            </GlassCard>

            <PuffyButton
              label={isIt ? 'Usa questo profilo ora' : 'Use this profile now'}
              onPress={useProfileNow}
            />

            <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.disclaimer}>
              {isIt
                ? 'Il profilo condiviso aiuta a capire cosa evitare, ma non sostituisce la conferma del ristorante o del produttore.'
                : 'A shared profile helps understand what to avoid, but does not replace confirmation from the restaurant or producer.'}
            </AppText>
          </>
        ) : null}
      </GlassScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  icon: { fontSize: 34 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    backgroundColor: colors.greenSoft,
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  disclaimer: { textAlign: 'center', paddingHorizontal: spacing.md, lineHeight: 18 },
});
