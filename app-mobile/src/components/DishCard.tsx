import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API } from '../api/client';
import type { EsitoSemaforo } from '../engine/semaforo';
import type { Piatto } from '../types';
import { useSession } from '../store/session';
import { t, getAllergenName } from '../engine/translations';

const COLORS = {
  verde: { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', icon: '🟢', badgeBg: '#dcfce7' },
  giallo: { bg: '#fffbeb', border: '#fef08a', text: '#d97706', icon: '🟡', badgeBg: '#fef3c7' },
  rosso: { bg: '#fff5f5', border: '#fecaca', text: '#dc2626', icon: '🔴', badgeBg: '#fee2e2' },
};

const LABELS = {
  verde: 'safe',
  giallo: 'warning',
  rosso: 'danger',
} as const;

const STOCK_PHOTOS = [
  'https://images.unsplash.com/photo-1572656631137-7935297eff55?auto=format&fit=crop&w=300&q=80', // Bruschetta
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80', // Insalata
  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=300&q=80', // Pasta
  'https://images.unsplash.com/photo-1595908129746-57ca1a63dd4d?auto=format&fit=crop&w=300&q=80', // Risotto
  'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=300&q=80', // Frittura
  'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=300&q=80', // Carne
  'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=300&q=80', // Verdure
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80', // Tiramisu
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80', // Pizza
  'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=300&q=80', // Default
];

function getDishImageUrl(url: string | null | undefined, name: string, category: string | null): string {
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
  const c = COLORS[esito.stato];
  const label = t(LABELS[esito.stato], language);
  const rosso = esito.stato === 'rosso';
  const imgUri = getDishImageUrl(piatto.image_url, piatto.nome_piatto, piatto.categoria);

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
      esito.match_contenuti.forEach(c => {
        msg += `- ${getAllergenName(c, language)}${c !== 'vegano' && c !== 'vegetariano' ? mapIntensity(c) : ''}\n`;
      });
    }
    if (esito.match_tracce.length > 0) {
      if (msg) msg += '\n';
      msg += 'Tracce:\n';
      esito.match_tracce.forEach(c => {
        msg += `- ${getAllergenName(c, language)}${mapIntensity(c)}\n`;
      });
    }

    Alert.alert(`Allergie: ${piatto.nome_piatto}`, msg);
  };

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: c.bg, borderColor: c.border }, rosso && styles.dimmed]}
      activeOpacity={0.9}
      onLongPress={onLongPress}
      delayLongPress={400}
    >
      <View style={styles.row}>
        {/* Immagine Piatto */}
        <Image source={{ uri: imgUri }} style={styles.image as any} />
        
        <View style={{ flex: 1 }}>
          <View style={styles.topRow}>
            <Text style={styles.icon}>{c.icon}</Text>
            <Text style={[styles.name, rosso && styles.strike]}>{piatto.nome_piatto}</Text>
          </View>
          
          {piatto.descrizione ? <Text style={styles.desc}>{piatto.descrizione}</Text> : null}
          
          <View style={[styles.badge, { backgroundColor: c.badgeBg }]}>
            <Text style={[styles.badgeText, { color: c.text }]}>{label.toUpperCase()}</Text>
          </View>
          
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { 
    borderWidth: 1.5, 
    borderRadius: 20, 
    padding: 14, 
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  dimmed: { opacity: 0.7 },
  row: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  image: { width: 72, height: 72, borderRadius: 16, backgroundColor: '#cbd5e1' },
  topRow: { flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  icon: { fontSize: 16 },
  name: { fontSize: 15, fontWeight: '800', color: '#0f172a', flex: 1, letterSpacing: -0.2 },
  strike: { textDecorationLine: 'line-through', color: '#94a3b8' },
  desc: { fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 16, fontWeight: '400' },
  badge: { 
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 8,
  },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  why: { fontSize: 11, color: '#b91c1c', marginTop: 4, fontWeight: '700' },
  price: { fontSize: 14, fontWeight: '800', color: '#334155', letterSpacing: -0.2 },
});
