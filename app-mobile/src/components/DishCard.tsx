import React from 'react';
import { Alert, Image, StyleSheet, Text, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { EsitoSemaforo } from '../engine/semaforo';
import type { Piatto } from '../types';
import { useSession } from '../store/session';
import { t, getAllergenName } from '../engine/translations';
import { resolveDishImageUrl } from '../utils/dishImage';

export type VerdictType = 'SAFE' | 'WARN' | 'RISK';

const VERDICT_CONFIG = {
  SAFE: {
    label: 'Idoneo',
    icon: 'checkmark-circle-outline' as const,
    color: '#10B981',
    softBg: '#ECFDF5',
    border: '#6EE7B7',
    textColor: '#065F46',
  },
  WARN: {
    label: 'Attenzione',
    icon: 'alert-circle-outline' as const,
    color: '#F59E0B',
    softBg: '#FFFBEB',
    border: '#FCD34D',
    textColor: '#92400E',
  },
  RISK: {
    label: 'Non idoneo',
    icon: 'close-circle-outline' as const,
    color: '#EF4444',
    softBg: '#FEF2F2',
    border: '#FCA5A5',
    textColor: '#991B1B',
  },
};

export interface DishCardProps {
  piatto: Piatto;
  esito: EsitoSemaforo;
  restaurantCode: string;
  onPress?: () => void;
  tavolataInfo?: {
    idonei: string[];
    nonIdonei: string[];
  };
}

export default React.memo(function DishCard({
  piatto,
  esito,
  restaurantCode,
  onPress,
  tavolataInfo,
}: DishCardProps) {
  const language = useSession((s) => s.language);
  const allergyIntensities = useSession((s) => s.allergyIntensities || {});

  const verdict: VerdictType =
    esito.stato === 'verde' ? 'SAFE' : esito.stato === 'giallo' ? 'WARN' : 'RISK';
  const config = VERDICT_CONFIG[verdict];

  const imgUri = resolveDishImageUrl(piatto.image_url, piatto.nome_piatto, piatto.categoria);
  const isVegan = piatto.categoria?.toLowerCase().includes('vegan') || piatto.nome_piatto?.toLowerCase().includes('vegan');
  const priceFormatted = piatto.prezzo_cents != null ? `${(piatto.prezzo_cents / 100).toFixed(2)} €` : null;

  // Costruzione Why Chips
  const containsList = esito.match_contenuti || [];
  const tracesList = esito.match_tracce || [];
  const excludedList = esito.match_esclusi || [];

  const handlePress = () => {
    void Haptics.selectionAsync();
    if (onPress) {
      onPress();
    } else if (restaurantCode && piatto.id) {
      router.push(`/menu/${restaurantCode}/dish/${piatto.id}`);
    }
  };

  const handleLongPress = () => {
    if (esito.stato === 'verde') return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const mapIntensity = (code: string) => {
      const i = allergyIntensities[code];
      if (i === 'lieve') return ' (Lieve)';
      if (i === 'grave') return ' (Grave/Anafilassi)';
      return ' (Moderata)';
    };

    let msg = '';
    if (containsList.length > 0) {
      msg += '🔴 Contiene:\n';
      containsList.forEach((c) => {
        msg += `• ${getAllergenName(c, language)}${c !== 'vegano' && c !== 'vegetariano' ? mapIntensity(c) : ''}\n`;
      });
    }
    if (tracesList.length > 0) {
      if (msg) msg += '\n';
      msg += '🟡 Tracce dichiarate:\n';
      tracesList.forEach((c) => {
        msg += `• ${getAllergenName(c, language)}${mapIntensity(c)}\n`;
      });
    }
    if (excludedList.length > 0) {
      if (msg) msg += '\n';
      msg += '🚫 Ingredienti esclusi:\n';
      excludedList.forEach((c) => {
        msg += `• ${c}\n`;
      });
    }

    Alert.alert(`Dettaglio Sicurezza: ${piatto.nome_piatto}`, msg || 'Nessun dettaglio aggiuntivo.');
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={350}
      style={({ pressed }) => [
        styles.cardContainer,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${piatto.nome_piatto}, verdetto ${config.label}, prezzo ${priceFormatted || 'non specificato'}`}
    >
      <View style={styles.contentRow}>
        {/* Foto piatto opzionale */}
        {imgUri ? (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: imgUri }} style={styles.image} resizeMode="cover" />
          </View>
        ) : null}

        {/* Informazioni Piatto */}
        <View style={styles.mainInfo}>
          {/* Header Row: Nome Piatto + Prezzo */}
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text
                style={[
                  styles.dishName,
                  verdict === 'RISK' && styles.dishNameRisk,
                ]}
                numberOfLines={2}
              >
                {piatto.nome_piatto}
              </Text>
              {isVegan && (
                <View style={styles.veganBadge}>
                  <Ionicons name="leaf-outline" size={12} color="#065F46" />
                  <Text style={styles.veganText}>Vegan</Text>
                </View>
              )}
            </View>

            {priceFormatted && (
              <Text style={styles.dishPrice}>{priceFormatted}</Text>
            )}
          </View>

          {/* Descrizione Ingredienti */}
          {piatto.descrizione ? (
            <Text style={styles.description} numberOfLines={2}>
              {piatto.descrizione}
            </Text>
          ) : null}

          {/* Badge Cucina Sicura se presente */}
          {piatto.kitchen_protocol_confirmed === 1 ? (
            <View style={styles.kitchenBadge}>
              <Text style={styles.kitchenBadgeText}>🛡️ Cucina Sicura Garantita</Text>
            </View>
          ) : null}

          {/* Badge Tavolata Famiglia se attivo */}
          {tavolataInfo && (tavolataInfo.idonei.length > 0 || tavolataInfo.nonIdonei.length > 0) ? (
            <View style={[styles.tavolataBadge, tavolataInfo.nonIdonei.length > 0 ? styles.tavolataBadgeWarn : styles.tavolataBadgeOk]}>
              <Ionicons name={tavolataInfo.nonIdonei.length > 0 ? "alert-circle-outline" : "people-outline"} size={13} color={tavolataInfo.nonIdonei.length > 0 ? "#B91C1C" : "#047857"} />
              <Text style={[styles.tavolataBadgeText, { color: tavolataInfo.nonIdonei.length > 0 ? "#B91C1C" : "#047857" }]} numberOfLines={1}>
                {tavolataInfo.nonIdonei.length > 0
                  ? `⚠️ Vietato per: ${tavolataInfo.nonIdonei.join(', ')}`
                  : `🟢 Idoneo per tutta la tavolata (${tavolataInfo.idonei.join(', ')})`}
              </Text>
            </View>
          ) : null}

          {/* Footer: Quad-Indicator Pill + Why Chips */}
          <View style={styles.footerRow}>
            {/* Pillola Verdetto Quad-Indicator */}
            <View
              style={[
                styles.verdictPill,
                { backgroundColor: config.softBg, borderColor: config.border },
              ]}
            >
              <Ionicons name={config.icon} size={13} color={config.color} />
              <Text style={[styles.verdictLabel, { color: config.textColor }]}>
                {config.label}
              </Text>
            </View>

            {/* Why Chip: Contiene */}
            {containsList.length > 0 && (
              <View style={[styles.whyChip, styles.whyChipContains]}>
                <Text style={[styles.whyChipText, styles.whyChipTextContains]} numberOfLines={1}>
                  Contiene: {containsList.map((a) => getAllergenName(a, language)).join(', ')}
                </Text>
              </View>
            )}

            {/* Why Chip: Tracce */}
            {tracesList.length > 0 && (
              <View style={[styles.whyChip, styles.whyChipTraces]}>
                <Text style={[styles.whyChipText, styles.whyChipTextTraces]} numberOfLines={1}>
                  Tracce: {tracesList.map((a) => getAllergenName(a, language)).join(', ')}
                </Text>
              </View>
            )}

            {/* Why Chip: Ingredienti Esclusi */}
            {excludedList.length > 0 && (
              <View style={[styles.whyChip, styles.whyChipContains]}>
                <Text style={[styles.whyChipText, styles.whyChipTextContains]} numberOfLines={1}>
                  Escluso: {excludedList.join(', ')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginVertical: 6,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E6DFF5',
    shadowColor: '#36255C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  imageWrapper: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#EDE6FA',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  mainInfo: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  dishName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C0D30',
    letterSpacing: -0.2,
    lineHeight: 21,
  },
  dishNameRisk: {
    color: '#4B3F58',
  },
  dishPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#36255C',
  },
  veganBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginTop: 4,
    gap: 3,
  },
  veganText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  description: {
    fontSize: 13,
    fontWeight: '400',
    color: '#675B7D',
    lineHeight: 18,
    marginVertical: 4,
  },
  kitchenBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginVertical: 4,
  },
  kitchenBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3730A3',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  verdictPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    gap: 4,
  },
  verdictLabel: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  whyChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '85%',
  },
  whyChipContains: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  whyChipTraces: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  whyChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  whyChipTextContains: {
    color: '#991B1B',
  },
  whyChipTextTraces: {
    color: '#92400E',
  },
  tavolataBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginVertical: 4,
    alignSelf: 'flex-start',
  },
  tavolataBadgeOk: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  tavolataBadgeWarn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  tavolataBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
