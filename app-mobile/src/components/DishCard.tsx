import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API } from '../api/client';
import type { EsitoSemaforo } from '../engine/semaforo';
import type { Piatto } from '../types';
import { useSession } from '../store/session';
import { t, getAllergenName } from '../engine/translations';
import { colors, radius } from '../theme';
import { GlassCard } from './ui/GlassCard';
import { StatoVerdictPill } from './ui/Traffic';

const ACCENT = {
  verde: colors.green,
  giallo: colors.amber,
  rosso: colors.red,
} as const;

const SHORT_LABEL = {
  verde: 'Idoneo',
  giallo: 'Attenzione',
  rosso: 'Non idoneo',
} as const;

const STOCK_PHOTOS = [
  'https://images.unsplash.com/photo-1572656631137-7935297eff55?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1595908129746-57ca1a63dd4d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=300&q=80',
];

function getDishImageUrl(url: string | null | undefined, name: string, category?: string | null): string {
  if (url) {
    if (url.startsWith('http')) return url;
    return `${API}${url}`;
  }
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();
  if (n.includes('pizza')) return STOCK_PHOTOS[8];
  if (n.includes('pasta') || n.includes('carbonara') || n.includes('tagliatelle') || c.includes('primi')) return STOCK_PHOTOS[2];
  if (n.includes('risotto')) return STOCK_PHOTOS[3];
  if (n.includes('bruschetta') || c.includes('antipast')) return STOCK_PHOTOS[0];
  if (n.includes('frittur') || n.includes('calamari') || n.includes('pesce') || n.includes('mare')) return STOCK_PHOTOS[4];
  if (n.includes('carne') || n.includes('tagliata') || n.includes('manzo') || c.includes('secondi')) return STOCK_PHOTOS[5];
  if (n.includes('verdur') || n.includes('insalat') || c.includes('contorn')) return STOCK_PHOTOS[6];
  if (n.includes('tiramis') || n.includes('dolce') || c.includes('dolc')) return STOCK_PHOTOS[7];
  return STOCK_PHOTOS[9];
}

export default function DishCard({ piatto, esito }: { piatto: Piatto; esito: EsitoSemaforo }) {
  const language = useSession((s) => s.language);
  const allergyIntensities = useSession((s) => s.allergyIntensities || {});
  const label = SHORT_LABEL[esito.stato];
  const rosso = esito.stato === 'rosso';
  const imgUri = getDishImageUrl(piatto.image_url, piatto.nome_piatto, piatto.categoria);
  const tint = esito.stato === 'verde' ? 'green' : esito.stato === 'giallo' ? 'yellow' : 'red';

  const onLongPress = () => {
    if (esito.stato === 'verde') return;

    let msg = '';
    const mapIntensity = (code: string) => {
      const i = allergyIntensities[code];
      if (i === 'lieve') return ' (Intensità: Lieve)';
      if (i === 'grave') return ' (Intensità: Grave/Anafilassi)';
      return ' (Intensità: Moderata)';
    };

    if (esito.match_contenuti.length > 0) {
      msg += 'Contiene:\n';
      esito.match_contenuti.forEach((c) => {
        msg += `- ${getAllergenName(c, language)}${c !== 'vegano' && c !== 'vegetariano' ? mapIntensity(c) : ''}\n`;
      });
    }
    if (esito.match_tracce.length > 0) {
      if (msg) msg += '\n';
      msg += 'Tracce:\n';
      esito.match_tracce.forEach((c) => {
        msg += `- ${getAllergenName(c, language)}${mapIntensity(c)}\n`;
      });
    }

    Alert.alert(`Allergie: ${piatto.nome_piatto}`, msg);
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onLongPress={onLongPress} delayLongPress={400}>
      <GlassCard
        padded={false}
        tint={tint}
        accentColor={ACCENT[esito.stato]}
        style={styles.card}
      >
        <View style={styles.row}>
          <View style={styles.imageFrame}>
            <Image source={{ uri: imgUri }} style={styles.image as any} />
          </View>

          <View style={styles.body}>
            <Text style={[styles.name, rosso && styles.strike]} numberOfLines={2}>
              {piatto.nome_piatto}
            </Text>

            {piatto.descrizione ? <Text style={styles.desc} numberOfLines={2}>{piatto.descrizione}</Text> : null}

            <View style={styles.badges}>
              <StatoVerdictPill stato={esito.stato} label={label} size="sm" />
              {piatto.kitchen_protocol_confirmed === 1 ? (
                <View style={styles.kitchenBadge}>
                  <Text style={styles.kitchenBadgeText}>🛡️ CUCINA SICURA</Text>
                </View>
              ) : null}
            </View>

            {piatto.kitchen_protocol_confirmed === 1 ? (
              <Text style={styles.kitchenHint}>{t('kitchen_safe_hint', language)}</Text>
            ) : null}

            {esito.match_contenuti.length > 0 && (
              <Text style={styles.why}>
                {esito.match_contenuti.some((c) => c === 'vegano' || c === 'vegetariano')
                  ? t('diet_incompatible', language)
                  : t('contains', language)}
                {esito.match_contenuti.map((a) => getAllergenName(a, language)).join(', ')}
              </Text>
            )}
            {esito.match_esclusi && esito.match_esclusi.length > 0 && (
              <Text style={styles.why}>
                {t('excluded_ingredient', language)}
                {esito.match_esclusi.join(', ')}
              </Text>
            )}
            {esito.stato === 'giallo' && (
              <Text style={styles.why}>
                {t('traces', language)}
                {esito.match_tracce.map((a) => getAllergenName(a, language)).join(', ')}
              </Text>
            )}
          </View>

          {piatto.prezzo_cents != null && (
            <Text style={styles.price}>{(piatto.prezzo_cents / 100).toFixed(2)} €</Text>
          )}
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    padding: 14,
  },
  imageFrame: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surfaceTertiary,
  },
  image: { width: 72, height: 72 },
  body: { flex: 1, gap: 4 },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.onSurface,
    letterSpacing: -0.2,
  },
  strike: { textDecorationLine: 'line-through', color: colors.textMuted },
  desc: { fontSize: 12, color: colors.textSecondary, lineHeight: 16 },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  kitchenBadge: {
    backgroundColor: colors.brand50,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.brand200,
  },
  kitchenBadgeText: { fontSize: 9, fontWeight: '800', color: colors.brandDark, letterSpacing: 0.5 },
  kitchenHint: { fontSize: 10, color: colors.onSurfaceMuted, fontWeight: '600', lineHeight: 14 },
  why: { fontSize: 11, color: colors.redText, marginTop: 2, fontWeight: '700' },
  price: { fontSize: 14, fontWeight: '800', color: colors.inkSoft, letterSpacing: -0.2 },
});
