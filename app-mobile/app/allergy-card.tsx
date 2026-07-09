import { Stack, router } from 'expo-router';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useSession } from '../src/store/session';
import { colors, radius, shadow, spacing, typography } from '../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Traduzioni locali degli allergeni per la Allergy Card (IT, EN, ES, FR, DE)
const ALLERGEN_TRANSLATIONS: Record<string, Record<string, string>> = {
  glutine: {
    it: '🌾 Cereali con glutine',
    en: '🌾 Gluten-containing cereals',
    es: '🌾 Cereales con gluten',
    fr: '🌾 Céréales contenant du gluten',
    de: '🌾 Glutenhaltiges Getreide',
  },
  crostacei: {
    it: '🦐 Crostacei',
    en: '🦐 Crustaceans',
    es: '🦐 Crustáceos',
    fr: '🦐 Crustacés',
    de: '🦐 Krebstiere',
  },
  uova: {
    it: '🥚 Uova',
    en: '🥚 Eggs',
    es: '🥚 Huevos',
    fr: '🥚 Œufs',
    de: '🥚 Eier',
  },
  pesce: {
    it: '🐟 Pesce',
    en: '🐟 Fish',
    es: '🐟 Pescado',
    fr: '🐟 Poisson',
    de: '🐟 Fisch',
  },
  arachidi: {
    it: '🥜 Arachidi',
    en: '🥜 Peanuts',
    es: '🥜 Cacahuetes',
    fr: '🥜 Arachides',
    de: '🥜 Erdnüsse',
  },
  soia: {
    it: '🌱 Soia',
    en: '🌱 Soy',
    es: '🌱 Soja',
    fr: '🌱 Soja',
    de: '🌱 Soja',
  },
  latte: {
    it: '🥛 Latte e lattosio',
    en: '🥛 Milk & lactose',
    es: '🥛 Leche y lactosa',
    fr: '🥛 Lait et lactose',
    de: '🥛 Milch und Laktose',
  },
  frutta_a_guscio: {
    it: '🌰 Frutta a guscio',
    en: '🌰 Tree nuts',
    es: '🌰 Frutos de cáscara',
    fr: '🌰 Fruits à coque',
    de: '🌰 Schalenfrüchte',
  },
  sedano: {
    it: '🥬 Sedano',
    en: '🥬 Celery',
    es: '🥬 Apio',
    fr: '🥬 Céleri',
    de: '🥬 Sellerie',
  },
  senape: {
    it: '🟡 Senape',
    en: '🟡 Mustard',
    es: '🟡 Mostaza',
    fr: '🟡 Moutarde',
    de: '🟡 Senf',
  },
  sesamo: {
    it: '⚪ Semi di sesamo',
    en: '⚪ Sesame seeds',
    es: '⚪ Granos de sésamo',
    fr: '⚪ Graines de sésame',
    de: '⚪ Sesamsamen',
  },
  solfiti: {
    it: '🍷 Anidride solforosa / solfiti',
    en: '🍷 Sulfites / sulfur dioxide',
    es: '🍷 Dióxido de azufre y sulfitos',
    fr: '🍷 Anhydride sulfureux et sulfitos',
    de: '🍷 Schwefeldioxid und Sulfite',
  },
  lupini: {
    it: '🫘 Lupini',
    en: '🫘 Lupins',
    es: '🫘 Altramuces',
    fr: '🫘 Lupin',
    de: '🫘 Lupinen',
  },
  molluschi: {
    it: '🦑 Molluschi',
    en: '🦑 Molluscs',
    es: '🦑 Moluscos',
    fr: '🦑 Molluesques',
    de: '🦑 Weichtiere',
  },
  senza_glutine: {
    it: '🌾 Celiachia (Senza Glutine)',
    en: '🌾 Celiac disease (Gluten-Free)',
    es: '🌾 Celiaquía (Sin gluten)',
    fr: '🌾 Maladie coeliaque (Sans gluten)',
    de: '🌾 Zöliakie (Glutenfrei)',
  },
  senza_lattosio: {
    it: '🥛 Intolleranza al lattosio',
    en: '🥛 Lactose intolerance',
    es: '🥛 Intolerancia a la lactora',
    fr: '🥛 Intolérance au lactose',
    de: '🥛 Laktoseintoleranz',
  },
  vegano: {
    it: '🌱 Vegano',
    en: '🌱 Vegan',
    es: '🌱 Vegano',
    fr: '🌱 Végétalien',
    de: '🌱 Vegan',
  },
  vegetariano: {
    it: '🥗 Vegetariano',
    en: '🥗 Vegetarian',
    es: '🥗 Vegetariano',
    fr: '🥗 Végétarien',
    de: '🥗 Vegetarisch',
  },
};

// Messaggi di avviso per lo staff del ristorante nelle varie lingue
const WARNING_MESSAGES: Record<string, string> = {
  it: 'Ho una grave allergia o intolleranza agli ingredienti indicati sopra. Si prega di verificare che i piatti ordinati non li contengano e che non vi sia alcun rischio di contaminazione crociata in cucina. Grazie per la collaborazione.',
  en: 'I have a severe allergy or intolerance to the ingredients listed above. Please ensure that my meal does not contain them and that there is no risk of cross-contamination in the kitchen. Thank you for your cooperation.',
  es: 'Tengo una alergia o intolerancia grave a los ingredientes indicados arriba. Por favor, asegúrese de que mi comida no los contenga y de que no haya riesgo de contaminación cruzada en la cocina. Gracias por su cooperación.',
  fr: "J'ai une allergie ou intolérance grave aux ingrédients indiqués ci-dessus. Veuillez vous assurer que mes plats n'en contiennent pas et qu'il n'y a aucun rischio de contamination croisée en cuisine. Merci pour votre coopération.",
  de: 'Ich habe eine schwere Allergie oder Unverträglichkeit gegen die oben aufgeführten Zutaten. Bitte stellen Sie sicher, dass meine Mahlzeit diese nicht enthält und kein Risiko für Kreuzkontaminationen in der Küche besteht. Vielen Dank für Ihre Unterstützung.',
};

// Titolo della card nelle varie lingue
const CARD_TITLES: Record<string, string> = {
  it: 'CARTA ALLERGIE',
  en: 'ALLERGY CARD',
  es: 'TARJETA DE ALERGIAS',
  fr: "CARTE D'ALLERGIES",
  de: 'ALLERGIE-AUSWEIS',
};

export default function AllergyCardScreen() {
  const { allergie, language } = useSession();
  const [selectedLang, setSelectedLang] = useState<string>('en');

  const activeLang = selectedLang.toLowerCase();

  const isIt = (language || 'it').toLowerCase() === 'it';

  const formatAllergen = (code: string): string => {
    const dict = ALLERGEN_TRANSLATIONS[code];
    if (dict && dict[activeLang]) {
      return dict[activeLang];
    }
    // Fallback pulito capitalizzando il codice
    return `⚠️ ${code.charAt(0).toUpperCase() + code.slice(1)}`;
  };

  const getWarning = (): string => {
    return WARNING_MESSAGES[activeLang] || WARNING_MESSAGES.en;
  };

  const getTitle = (): string => {
    return CARD_TITLES[activeLang] || CARD_TITLES.en;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isIt ? 'Pass Allergeni' : 'Allergy Pass',
          headerStyle: { backgroundColor: colors.brand },
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: '800' },
        }}
      />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.screenTitle}>
            {isIt ? 'Allergy Card per i Camerieri' : 'Allergy Card for Waiters'}
          </Text>
          <Text style={styles.screenDesc}>
            {isIt
              ? 'Mostra questo tesserino digitale allo staff del ristorante quando ordini all\'estero o in locali non convenzionati.'
              : 'Show this digital pass to restaurant staff when ordering abroad or in non-partner venues.'}
          </Text>

          {/* Selettore Lingua della Card */}
          <View style={styles.langSelector}>
            <Text style={styles.langLabel}>{isIt ? 'Traduci in:' : 'Translate to:'}</Text>
            <View style={styles.langChips}>
              {[
                { code: 'it', label: '🇮🇹 IT' },
                { code: 'en', label: '🇬🇧 EN' },
                { code: 'es', label: '🇪🇸 ES' },
                { code: 'fr', label: '🇫🇷 FR' },
                { code: 'de', label: '🇩🇪 DE' },
              ].map((langObj) => {
                const isActive = selectedLang === langObj.code;
                return (
                  <TouchableOpacity
                    key={langObj.code}
                    style={[styles.langChip, isActive && styles.langChipActive]}
                    onPress={() => setSelectedLang(langObj.code)}
                  >
                    <Text style={[styles.langChipText, isActive && styles.langChipTextActive]}>
                      {langObj.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* CARD DIGITALE ALLERGENI (Vibrante Glassmorphism Rosso/Scuro) */}
          <View style={styles.cardFrame}>
            <View style={styles.cardGradientOverlay}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLogo}>AllerTgy</Text>
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>MEDICAL INFO</Text>
                </View>
              </View>

              <Text style={styles.cardTitle}>{getTitle()}</Text>

              {allergie.length === 0 ? (
                <View style={styles.noAllergiesBox}>
                  <Text style={styles.noAllergiesText}>
                    {isIt ? 'Nessun allergene dichiarato nel profilo.' : 'No allergens declared in profile.'}
                  </Text>
                </View>
              ) : (
                <View style={styles.allergensList}>
                  {allergie.map((code) => (
                    <View key={code} style={styles.allergenChip}>
                      <Text style={styles.allergenChipText}>{formatAllergen(code)}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.cardDivider} />

              <View style={styles.warningContainer}>
                <Text style={styles.warningEmoji}>🚨</Text>
                <Text style={styles.warningText}>{getWarning()}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>{isIt ? 'Torna Indietro' : 'Go Back'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.lg,
  },
  screenTitle: {
    ...typography.h2,
    color: colors.ink,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  screenDesc: {
    ...typography.bodySm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },

  // Selettore Lingua
  langSelector: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  langLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  langChips: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  langChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  langChipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  langChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.inkSoft,
  },
  langChipTextActive: {
    color: colors.white,
    fontWeight: '800',
  },

  // Stile Tesserino Medico
  cardFrame: {
    width: '100%',
    borderRadius: radius.xl,
    backgroundColor: '#7f1d1d', // Rosso scuro primario
    borderWidth: 1,
    borderColor: '#ef4444',
    overflow: 'hidden',
    ...shadow.raised,
  },
  cardGradientOverlay: {
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.25)', // Overlay di contrasto
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLogo: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fca5a5',
    letterSpacing: -0.5,
  },
  cardBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  cardBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
    marginTop: spacing.xs,
  },
  allergensList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  allergenChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  allergenChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  noAllergiesBox: {
    paddingVertical: spacing.md,
  },
  noAllergiesText: {
    fontSize: 14,
    color: '#fca5a5',
    fontStyle: 'italic',
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: spacing.xs,
  },
  warningContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  warningEmoji: {
    fontSize: 22,
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#fee2e2',
    lineHeight: 18,
  },

  // Pulsante Indietro
  backBtn: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.inkSoft,
  },
});
