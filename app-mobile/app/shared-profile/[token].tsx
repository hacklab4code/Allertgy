import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../src/api/client';
import { useSession } from '../../src/store/session';
import type { SharedProfile } from '../../src/types';

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
      profile.allergens.map((a) => [a.code, a.intensity])
    ) as Record<string, 'lieve' | 'moderata' | 'grave'>;
    setAllergie(profile.allergens.map((a) => a.code), intensities);
    setProfileCompleted(true);
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: isIt ? 'Profilo condiviso' : 'Shared profile' }} />
      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <ActivityIndicator color="#059669" />
        ) : error ? (
          <View style={styles.card}>
            <Text style={styles.icon}>⚠️</Text>
            <Text style={styles.title}>{isIt ? 'Link non disponibile' : 'Link unavailable'}</Text>
            <Text style={styles.text}>{error}</Text>
          </View>
        ) : profile ? (
          <>
            <View style={styles.card}>
              <Text style={styles.icon}>🔗</Text>
              <Text style={styles.kicker}>{isIt ? 'Profilo AllerTgy condiviso' : 'Shared AllerTgy profile'}</Text>
              <Text style={styles.title}>{profile.profile_name}</Text>
              <Text style={styles.text}>
                {profile.expires_at
                  ? (isIt ? 'Valido temporaneamente per spesa, festa o uscita.' : 'Temporarily valid for shopping, parties, or dining out.')
                  : (isIt ? 'Condivisione permanente per famiglia o caregiver.' : 'Permanent sharing for family or caregivers.')}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{isIt ? 'Allergie condivise' : 'Shared allergies'}</Text>
              {profile.allergens.length === 0 ? (
                <Text style={styles.text}>{isIt ? 'Nessuna allergia indicata.' : 'No allergies listed.'}</Text>
              ) : (
                <View style={styles.chips}>
                  {profile.allergens.map((a) => (
                    <View key={a.code} style={styles.chip}>
                      <Text style={styles.chipText}>{a.emoji} {a.name_it} · {a.intensity}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.primary} onPress={useProfileNow}>
              <Text style={styles.primaryText}>
                {isIt ? 'Usa questo profilo ora' : 'Use this profile now'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              {isIt
                ? 'Il profilo condiviso aiuta a capire cosa evitare, ma non sostituisce la conferma del ristorante o del produttore.'
                : 'A shared profile helps understand what to avoid, but does not replace confirmation from the restaurant or producer.'}
            </Text>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 18, paddingBottom: 40, gap: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  icon: { fontSize: 34, marginBottom: 8 },
  kicker: { color: '#059669', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },
  title: { color: '#10201B', fontSize: 24, fontWeight: '900', marginTop: 4 },
  sectionTitle: { color: '#10201B', fontSize: 16, fontWeight: '900', marginBottom: 10 },
  text: { color: '#596B63', fontSize: 13, lineHeight: 19, marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#d1fae5', borderRadius: 999, paddingVertical: 7, paddingHorizontal: 10 },
  chipText: { color: '#065f46', fontSize: 12, fontWeight: '800' },
  primary: {
    backgroundColor: '#059669',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  disclaimer: { color: '#64748b', fontSize: 11, lineHeight: 16, textAlign: 'center', paddingHorizontal: 10 },
});
