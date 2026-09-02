import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { AppText } from './ui/AppText';
import { useIsDarkMode } from '../hooks/useAppTheme';

type Props = {
  isIt?: boolean;
};

const TIPS_IT = [
  {
    tag: 'Regola d’Oro al Ristorante',
    title: 'Avvisa sempre lo staff prima di ordinare',
    desc: 'Comunica la gravità della tua allergia al cameriere anche nei locali abituali: le ricette o i fornitori possono cambiare senza preavviso.',
    icon: 'shield-checkmark-outline',
    color: '#23212C',
  },
  {
    tag: 'Contaminazione Crociata',
    title: 'Attenzione a fritture e taglieri',
    desc: 'Chiedi se le patatine fritte o le pietanze senza glutine condividono la stessa friggitrice o superficie di lavoro con altri cibi.',
    icon: 'restaurant-outline',
    color: '#23212C',
  },
  {
    tag: 'Farmaci Salvavita',
    title: 'Controlla la scadenza di EpiPen & Antistaminici',
    desc: 'Tieni sempre il piano di emergenza aggiornato nella sezione SOS e verifica che gli autoiniettori non siano esposti a fonti di calore.',
    icon: 'medkit-outline',
    color: '#23212C',
  },
  {
    tag: 'Lettura Etichette',
    title: 'La regola delle 3 verifiche',
    desc: 'Leggi gli ingredienti 3 volte: quando acquisti al supermercato, quando riponi il cibo in dispensa e subito prima di servirlo.',
    icon: 'barcode-outline',
    color: '#23212C',
  },
  {
    tag: 'Viaggi all’Estero',
    title: 'Usa la scheda allergie tradotta',
    desc: 'All’estero mostra la Scheda Emergenza nella lingua locale: evita incomprensioni linguistiche su derivati e ingredienti nascosti.',
    icon: 'airplane-outline',
    color: '#23212C',
  },
  {
    tag: 'Aperitivi & Buffet',
    title: 'Evita posate e pinze condivise',
    desc: 'Nei buffet self-service le posate passano facilmente da un piatto all’altro: chiedi allo chef una porzione preparata a parte.',
    icon: 'wine-outline',
    color: '#23212C',
  },
  {
    tag: 'Attenzione al Carrello',
    title: 'Diffida da "Nuova Ricetta"',
    desc: 'I marchi modificano spesso gli ingredienti dei prodotti confezionati: ricontrolla l’elenco allergeni anche per i tuoi snack abituali.',
    icon: 'cart-outline',
    color: '#23212C',
  },
  {
    tag: 'Protocollo di Emergenza',
    title: 'Agisci subito ai primi sintomi',
    desc: 'In caso di gonfiore, respiro sibilante o reazione sistemica non esitare: usa l’adrenalina e allerta subito i soccorsi (112).',
    icon: 'alert-circle-outline',
    color: '#23212C',
  },
  {
    tag: 'Cucina & Igiene',
    title: 'Il calore non distrugge tutti gli allergeni',
    desc: 'Cuocere ad alte temperature non elimina le proteine allergeniche: solo un lavaggio accurato di pentole e utensili garantisce sicurezza.',
    icon: 'flame-outline',
    color: '#23212C',
  },
  {
    tag: 'Condivisione Sociale',
    title: 'Informa amici e colleghi',
    desc: 'Spiega alle persone con cui esci o lavori cosa fare in caso di reazione e dove tieni i tuoi farmaci di emergenza.',
    icon: 'people-outline',
    color: '#23212C',
  },
];

const TIPS_EN = [
  {
    tag: 'Golden Rule at Dining',
    title: 'Always inform staff before ordering',
    desc: 'Share your allergy severity with the waitstaff even in regular spots: ingredients or kitchen suppliers can change without notice.',
    icon: 'shield-checkmark-outline',
    color: '#23212C',
  },
  {
    tag: 'Cross-Contamination',
    title: 'Watch out for shared fryers & prep boards',
    desc: 'Always verify if gluten-free or allergen-safe items share frying oil or prep stations with unsafe dishes.',
    icon: 'restaurant-outline',
    color: '#23212C',
  },
  {
    tag: 'Life-Saving Medications',
    title: 'Check EpiPen & Antihistamine expiry dates',
    desc: 'Keep your emergency contact list up to date in the SOS hub and ensure auto-injectors are stored away from extreme heat.',
    icon: 'medkit-outline',
    color: '#23212C',
  },
  {
    tag: 'Label Reading',
    title: 'The 3-check rule for ingredients',
    desc: 'Read labels 3 times: at the grocery store, when stocking your pantry, and right before preparing or eating the food.',
    icon: 'barcode-outline',
    color: '#23212C',
  },
  {
    tag: 'Travel & Vacations',
    title: 'Use translated emergency cards',
    desc: 'When abroad, show your translated Chef Card in the local language to avoid linguistic confusion over hidden ingredients.',
    icon: 'airplane-outline',
    color: '#23212C',
  },
  {
    tag: 'Buffets & Events',
    title: 'Avoid shared serving utensils',
    desc: 'At open buffets, tongs frequently jump between dishes: request a fresh, dedicated plate prepared directly in the kitchen.',
    icon: 'wine-outline',
    color: '#23212C',
  },
  {
    tag: 'Smart Shopping',
    title: 'Watch out for "New Recipe" labels',
    desc: 'Manufacturers frequently tweak packaged recipes: double check the allergen statement even on your favorite staple snacks.',
    icon: 'cart-outline',
    color: '#23212C',
  },
  {
    tag: 'Emergency Protocol',
    title: 'Act immediately at first severe signs',
    desc: 'If experiencing throat tightness, wheezing or severe reactions, do not hesitate: use epinephrine and call emergency services right away.',
    icon: 'alert-circle-outline',
    color: '#23212C',
  },
  {
    tag: 'Kitchen Hygiene',
    title: 'Cooking heat does not eliminate allergens',
    desc: 'High temperatures don’t destroy allergen proteins: only thorough soap-and-water dishwashing prevents accidental trace reactions.',
    icon: 'flame-outline',
    color: '#23212C',
  },
  {
    tag: 'Social Safety',
    title: 'Educate your friends and colleagues',
    desc: 'Make sure your dining companions and coworkers know your emergency plan and where your rescue medications are kept.',
    icon: 'people-outline',
    color: '#23212C',
  },
];

export default React.memo(function HomeSafetyTipCard({ isIt = true }: Props) {
  const isDark = useIsDarkMode();
  const [tipIndex, setTipIndex] = useState(0);
  const tips = isIt ? TIPS_IT : TIPS_EN;
  const currentTip = tips[tipIndex % tips.length];

  const handleNextTip = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTipIndex((prev) => (prev + 1) % tips.length);
  };

  const handleSelectTip = (index: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTipIndex(index);
  };

  const gradientColors: [string, string, ...string[]] = isDark
    ? ['rgba(255, 255, 255, 0.14)', 'rgba(255, 255, 255, 0.07)']
    : ['rgba(241, 254, 200, 0.75)', 'rgba(235, 252, 185, 0.85)'];

  return (
    <Pressable onPress={handleNextTip} style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}>
      <View style={[styles.card, isDark && styles.cardDark]}>
        {/* BlurView & Gradiente Glass */}
        <BlurView intensity={35} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Riga Superiore: Contenuto a sinistra + Solo Logo a destra */}
        <View style={styles.mainRow}>
          {/* Colonna Sinistra: Categoria in alto, Titolo prominente e Descrizione */}
          <View style={styles.leftColumn}>
            <View style={[styles.tagBadge, isDark && styles.tagBadgeDark]}>
              <AppText style={[styles.tagText, isDark && styles.tagTextDark]}>{currentTip.tag}</AppText>
            </View>
            <AppText style={[styles.title, isDark && styles.titleDark]}>{currentTip.title}</AppText>
            <AppText style={[styles.desc, isDark && styles.descDark]}>{currentTip.desc}</AppText>
          </View>

          {/* Colonna Destra: Solo il logo/icona senza disegni o capsule sotto */}
          <View style={[styles.rightIconContainer, isDark && styles.rightIconContainerDark]}>
            <Ionicons name={currentTip.icon as any} size={50} color={isDark ? '#FFFFFF' : '#23212C'} />
          </View>
        </View>

        {/* Barra di scorrimento fissa a 3 pallini */}
        <View style={styles.dotsRow}>
          {[0, 1, 2].map((i) => {
            const isActive = (tipIndex % 3) === i;
            return (
              <Pressable
                key={i}
                onPress={() => handleSelectTip((Math.floor(tipIndex / 3) * 3 + i) % tips.length)}
                hitSlop={8}
              >
                <View
                  style={[
                    styles.dot,
                    isDark && styles.dotDark,
                    isActive && (isDark ? styles.dotActiveDark : styles.dotActive),
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.90)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#23212C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  leftColumn: {
    flex: 1,
    paddingRight: 2,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#23212C',
    letterSpacing: 0.1,
  },
  title: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#23212C',
    lineHeight: 21,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  desc: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#383446',
    fontWeight: '500',
  },
  rightIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.90)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    marginBottom: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(35, 33, 44, 0.20)',
  },
  dotActive: {
    width: 20,
    backgroundColor: '#23212C',
  },
  /* Dark Mode Modifiers */
  cardDark: {
    borderColor: 'rgba(255, 255, 255, 0.20)',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
  },
  tagBadgeDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  tagTextDark: {
    color: '#FFFFFF',
  },
  titleDark: {
    color: '#FFFFFF',
  },
  descDark: {
    color: '#CBD5E1',
  },
  rightIconContainerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  dotDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  dotActiveDark: {
    width: 20,
    backgroundColor: '#FFFFFF',
  },
  pressed: {
    opacity: 0.88,
  },
});
