import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../../../src/api/client';
import { GlassBackButton, GlassCard, LoadingBlock, Screen, SurfaceButton } from '../../../../src/components/ui';
import { StatoVerdictPill } from '../../../../src/components/ui/Traffic';
import { calcolaSemaforo } from '../../../../src/engine/semaforo';
import { getAllergenName, t } from '../../../../src/engine/translations';
import { loadDishFavorites, toggleDishFavorite } from '../../../../src/services/dishFavorites';
import { useSession } from '../../../../src/store/session';
import { colors, radius, spacing } from '../../../../src/theme';
import type { Menu } from '../../../../src/types';
import { resolveDishImageUrl } from '../../../../src/utils/dishImage';

const STATUS_LABEL = { verde: 'Idoneo', giallo: 'Attenzione', rosso: 'Non idoneo' } as const;

export default function DishDetailScreen() {
  const { codice, id } = useLocalSearchParams<{ codice: string; id: string }>();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const insets = useSafeAreaInsets();
  const {
    allergie: primaryAllergies,
    ingredientiEsclusi,
    subProfiles,
    activeProfileId,
    language,
  } = useSession();

  const allergie = useMemo(() => {
    const activeProfile = subProfiles.find((profile) => profile.id === activeProfileId);
    return activeProfile ? activeProfile.allergens.map((allergen) => allergen.code) : primaryAllergies;
  }, [activeProfileId, primaryAllergies, subProfiles]);

  const dish = useMemo(
    () => menu?.piatti.find((item) => item.id === Number(id)) ?? null,
    [id, menu],
  );

  const esito = useMemo(
    () => (dish ? calcolaSemaforo(allergie, dish, ingredientiEsclusi) : null),
    [allergie, dish, ingredientiEsclusi],
  );

  const loadDish = useCallback(async () => {
    if (!codice) return;
    setError('');
    try {
      const loadedMenu = await api.menu(codice);
      setMenu(loadedMenu);
      AsyncStorage.setItem(`menu_cache_${codice}`, JSON.stringify(loadedMenu)).catch(() => {});
    } catch (cause) {
      const cached = await AsyncStorage.getItem(`menu_cache_${codice}`);
      if (cached) {
        setMenu(JSON.parse(cached) as Menu);
        return;
      }
      setError((cause as Error).message);
    }
  }, [codice]);

  useEffect(() => {
    void loadDish();
  }, [loadDish]);

  useEffect(() => {
    if (!dish || !codice) return;
    loadDishFavorites()
      .then((favorites) => setIsFavorite(favorites.some(
        (favorite) => favorite.restaurantCode === codice && favorite.dish.id === dish.id,
      )))
      .catch(() => {});
  }, [codice, dish]);

  const handleToggleFavorite = async () => {
    if (!dish || !menu || !codice) return;
    const next = !isFavorite;
    setIsFavorite(next);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await toggleDishFavorite(dish, codice, menu.nome_ristorante);
    } catch {
      setIsFavorite(!next);
    }
  };

  if (error) {
    return (
      <Screen edges={false} style={styles.page}>
        <GlassBackButton />
        <View style={styles.state}>
          <Text style={styles.stateTitle}>Non riusciamo ad aprire il piatto</Text>
          <Text style={styles.stateCopy}>{error}</Text>
          <SurfaceButton label="Riprova" onPress={loadDish} />
        </View>
      </Screen>
    );
  }

  if (!menu) {
    return (
      <Screen edges={false} style={styles.page}>
        <GlassBackButton />
        <LoadingBlock label="Caricamento piatto…" style={{ marginTop: 60 }} />
      </Screen>
    );
  }

  if (!dish || !esito) {
    return (
      <Screen edges={false} style={styles.page}>
        <GlassBackButton />
        <View style={styles.state}>
          <Text style={styles.stateTitle}>Piatto non trovato</Text>
          <Text style={styles.stateCopy}>Potrebbe non essere più disponibile nel menù.</Text>
          <SurfaceButton label="Torna al menù" onPress={() => router.back()} variant="soft" />
        </View>
      </Screen>
    );
  }

  const incompatible = [...esito.match_contenuti, ...(esito.match_esclusi || [])];
  const imageUri = resolveDishImageUrl(dish.image_url, dish.nome_piatto, dish.categoria);

  return (
    <Screen edges={false} style={styles.page}>
      <GlassBackButton />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <Pressable
            onPress={handleToggleFavorite}
            style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'Rimuovi dai preferiti' : 'Salva nei preferiti'}
          >
            <Ionicons
              name={isFavorite ? 'star' : 'star-outline'}
              size={24}
              color={isFavorite ? colors.amberText : colors.onSurface}
            />
          </Pressable>
        </View>

        <View style={styles.heading}>
          <Text style={styles.restaurant}>{menu.nome_ristorante}</Text>
          <Text style={styles.title}>{dish.nome_piatto}</Text>
          <View style={styles.meta}>
            <StatoVerdictPill stato={esito.stato} label={STATUS_LABEL[esito.stato]} />
            {dish.prezzo_cents != null ? (
              <Text style={styles.price}>{(dish.prezzo_cents / 100).toFixed(2)} €</Text>
            ) : null}
          </View>
        </View>

        {dish.descrizione ? (
          <GlassCard>
            <Text style={styles.sectionTitle}>Descrizione</Text>
            <Text style={styles.description}>{dish.descrizione}</Text>
          </GlassCard>
        ) : null}

        <GlassCard>
          <Text style={styles.sectionTitle}>Informazioni allergeni</Text>
          {incompatible.length > 0 ? (
            <AllergenGroup
              title={esito.match_contenuti.length > 0 ? 'Contiene' : 'Ingredienti esclusi'}
              items={incompatible}
              color={colors.redText}
              language={language}
            />
          ) : null}
          {esito.match_tracce.length > 0 ? (
            <AllergenGroup title="Possibili tracce" items={esito.match_tracce} color={colors.amberText} language={language} />
          ) : null}
          {incompatible.length === 0 && esito.match_tracce.length === 0 ? (
            <Text style={styles.safeCopy}>Nessun allergene o ingrediente escluso associato al tuo profilo.</Text>
          ) : null}
          {dish.kitchen_protocol_confirmed === 1 ? (
            <View style={styles.kitchenNote}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.brandDark} />
              <Text style={styles.kitchenCopy}>{t('kitchen_safe_hint', language)}</Text>
            </View>
          ) : null}
        </GlassCard>

        <Text style={styles.disclaimer}>Verifica sempre con il personale del locale prima di ordinare.</Text>
      </ScrollView>
      <DishSemaforoDock status={esito.stato} bottomInset={insets.bottom} />
    </Screen>
  );
}

function DishSemaforoDock({
  status,
  bottomInset,
}: {
  status: 'verde' | 'giallo' | 'rosso';
  bottomInset: number;
}) {
  const palette = status === 'verde'
    ? ['#18B956', '#83EE8E', '#D9FFD0'] as const
    : status === 'giallo'
      ? ['#F4AD00', '#FFE46D', '#FFF6C5'] as const
      : ['#E63932', '#FF8279', '#FFD0CA'] as const;
  return (
    <View style={[styles.semaforoDock, { paddingBottom: Math.max(bottomInset, 10) }]} pointerEvents="none">
      <LinearGradient
        colors={palette}
        start={{ x: 0, y: 0.15 }}
        end={{ x: 1, y: 0.85 }}
        style={styles.semaforoBar}
      >
        <View style={styles.semaforoGlow} />
        <View style={styles.semaforoShine} />
      </LinearGradient>
    </View>
  );
}

function AllergenGroup({
  title,
  items,
  color,
  language,
}: {
  title: string;
  items: string[];
  color: string;
  language: string;
}) {
  return (
    <View style={styles.allergenGroup}>
      <Text style={[styles.allergenTitle, { color }]}>{title}</Text>
      <View style={styles.chips}>
        {items.map((item) => (
          <View key={item} style={[styles.chip, { borderColor: color }]}>
            <Text style={[styles.chipText, { color }]}>{getAllergenName(item, language)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 132, gap: spacing.md },
  imageWrap: { height: 290, backgroundColor: colors.surfaceTertiary },
  image: { width: '100%', height: '100%' },
  favoriteButton: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  favoriteButtonActive: { backgroundColor: colors.amberBg },
  heading: { paddingHorizontal: 20, gap: 8 },
  restaurant: { color: colors.brandDark, fontSize: 13, fontWeight: '800' },
  title: { color: colors.onSurface, fontSize: 28, fontWeight: '900', letterSpacing: -0.7 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  price: { color: colors.onSurface, fontSize: 18, fontWeight: '900' },
  sectionTitle: { color: colors.onSurface, fontSize: 16, fontWeight: '900', marginBottom: 8 },
  description: { color: colors.onSurfaceMuted, fontSize: 15, lineHeight: 22 },
  allergenGroup: { gap: 8, marginTop: 8 },
  allergenTitle: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { fontSize: 13, fontWeight: '800' },
  safeCopy: { color: colors.green, fontSize: 14, fontWeight: '700', lineHeight: 20, marginTop: 8 },
  kitchenNote: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: colors.brand50,
    borderRadius: radius.sm,
    padding: 10,
    marginTop: 14,
  },
  kitchenCopy: { flex: 1, color: colors.brandDark, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  disclaimer: { color: colors.onSurfaceMuted, fontSize: 12, lineHeight: 17, paddingHorizontal: 20, textAlign: 'center' },
  semaforoDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
    backgroundColor: 'rgba(250,248,253,0.88)',
  },
  semaforoBar: {
    height: 56,
    borderRadius: radius.pill,
    overflow: 'hidden',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  semaforoGlow: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    right: '14%',
    top: -58,
    backgroundColor: 'rgba(255,255,255,0.52)',
  },
  semaforoShine: {
    position: 'absolute',
    left: '7%',
    right: '42%',
    top: 7,
    height: 14,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.32)',
    transform: [{ rotate: '-4deg' }],
  },
  state: { flex: 1, justifyContent: 'center', padding: 24, gap: 10 },
  stateTitle: { color: colors.onSurface, fontSize: 20, fontWeight: '900' },
  stateCopy: { color: colors.onSurfaceMuted, fontSize: 14, lineHeight: 20, marginBottom: 10 },
});
