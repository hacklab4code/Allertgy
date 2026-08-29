import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../src/api/client';
import { OwnerScreenHeader } from '../../src/components/owner/OwnerScreenHeader';
import { AppText, CollapseSection, GlassCard, GlassScreenScroll, SurfaceButton } from '../../src/components/ui';
import { useOwner } from '../../src/store/owner';
import { colors, font, radius, spacing } from '../../src/theme';
import type { VisibilityBoost } from '../../src/types';

function canPushNotify(locale: any) {
  if (!locale) return false;
  const plan = locale.business_plan ?? 'free';
  const status = locale.subscription_status ?? 'free';
  return plan === 'pro_notify' && ['trialing', 'active', 'comped'].includes(status);
}

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function OwnerCrescita() {
  const { current } = useOwner();
  const locale = current;
  const [boosts, setBoosts] = useState<VisibilityBoost[]>([]);
  const [followers, setFollowers] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyBoost, setBusyBoost] = useState(false);
  const [busyPush, setBusyPush] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [pushExpanded, setPushExpanded] = useState(false);

  const load = useCallback(async () => {
    if (!locale) return;
    setLoading(true);
    try {
      const [boostList, followerRes] = await Promise.all([
        api.listBoosts(locale.id),
        api.billingFollowersCount(locale.id).catch(() => ({ count: 0 })),
      ]);
      setBoosts(boostList);
      setFollowers(followerRes.count);
    } catch (e) {
      // Ignora errori
    }
    setLoading(false);
  }, [locale]);

  useEffect(() => {
    load();
  }, [load]);

  const activateBoost = async () => {
    if (!locale) return;
    setBusyBoost(true);
    try {
      const res = await api.billingBoost(locale.id);
      if (res.activated) {
        Alert.alert('Boost attivato', res.message || 'Il locale è in evidenza per 30 giorni.');
        await load();
      } else if (res.checkout_url) {
        await Linking.openURL(res.checkout_url);
      }
    } catch (e) {
      Alert.alert('Boost', (e as Error).message);
    }
    setBusyBoost(false);
  };

  const sendPush = async () => {
    if (!locale) return;
    if (!title.trim() || !body.trim()) {
      Alert.alert('Attenzione', 'Inserisci titolo e messaggio.');
      return;
    }
    setBusyPush(true);
    try {
      const res = await api.billingSendNotification(locale.id, title.trim(), body.trim());
      Alert.alert('Inviata!', `Notifica push spedita a ${res.sent_count ?? 0} clienti.`);
      setTitle(''); setBody('');
    } catch (e) {
      Alert.alert('Errore notifica', (e as Error).message);
    }
    setBusyPush(false);
  };

  if (!locale) {
    return (
      <GlassScreenScroll headerFloat>
        <GlassCard style={styles.centerCard}>
          <AppText variant="h2" style={{ fontSize: 16 }}>Nessun locale selezionato</AppText>
          <AppText variant="caption" style={{ textAlign: 'center', marginTop: 2, marginBottom: spacing.sm, fontSize: 12 }}>
            Seleziona un'attività per gestire Boost e notifiche push.
          </AppText>
          <SurfaceButton label="Vai ad Attività" onPress={() => router.push('/(owner)/locali')} />
        </GlassCard>
      </GlassScreenScroll>
    );
  }

  const pushEnabled = canPushNotify(locale);
  const activeBoost = boosts.find((b) => b.activated_at && (!b.expires_at || new Date(b.expires_at).getTime() > Date.now()));

  return (
    <GlassScreenScroll headerFloat>
      <OwnerScreenHeader
        title="Boost e notifiche"
        subtitle={`${locale.name} · visibilità e push`}
      />

      {loading && <ActivityIndicator color={colors.brand} style={{ marginVertical: spacing.sm }} />}

      {/* Card Boost */}
      <GlassCard style={styles.cardContainer}>
        <View style={styles.cardHeaderRow}>
          <AppText variant="h2" style={{ fontSize: 22 }}>🚀</AppText>
          <View style={{ flex: 1 }}>
            <AppText variant="title" style={{ fontSize: 15 }}>Boost Visibilità</AppText>
            <AppText variant="caption" color={colors.onSurfaceMuted} style={{ fontSize: 11 }}>
              Posiziona il locale in cima ai risultati di ricerca per 30 giorni
            </AppText>
          </View>
        </View>

        {activeBoost ? (
          <View style={styles.activeBoostBox}>
            <AppText variant="bodyBold" color={colors.brandInk} style={{ fontSize: 13 }}>✨ Boost Attivo fino al {formatDate(activeBoost.expires_at)}</AppText>
            <AppText variant="caption" style={{ marginTop: 2, fontSize: 11 }}>
              Il tuo ristorante è in prima posizione per i clienti nella tua zona.
            </AppText>
          </View>
        ) : (
          <View style={styles.boostPricingBox}>
            <View>
              <AppText variant="h1" color={colors.brand} style={{ fontSize: 22, lineHeight: 26 }}>€9,90</AppText>
              <AppText variant="caption" color={colors.onSurfaceMuted} style={{ fontSize: 9 }}>per 30 giorni</AppText>
            </View>
            <SurfaceButton
              label={busyBoost ? 'Attivazione...' : 'Attiva Boost Now'}
              onPress={activateBoost}
              disabled={busyBoost}
            />
          </View>
        )}
      </GlassCard>

      {/* Storico Boost */}
      {boosts.length > 0 && (
        <CollapseSection
          icon="time"
          title="Storico Boost"
          preview={`${boosts.length} attivati`}
          expanded={historyExpanded}
          onToggle={() => setHistoryExpanded((v) => !v)}
        >
          {boosts.map((b) => (
            <View key={b.id} style={styles.historyRow}>
              <View>
                <AppText variant="bodyBold" style={{ fontSize: 12 }}>Dal {formatDate(b.activated_at)} al {formatDate(b.expires_at)}</AppText>
                <AppText variant="caption" color={colors.onSurfaceMuted} style={{ fontSize: 10 }}>
                  {b.expires_at && new Date(b.expires_at).getTime() > Date.now() ? 'Attivo' : 'Scaduto'}
                </AppText>
              </View>
              <AppText variant="bodyBold" style={{ fontSize: 14 }}>€{(b.amount_cents / 100).toFixed(2)}</AppText>
            </View>
          ))}
        </CollapseSection>
      )}

      {/* Notifiche Push */}
      <CollapseSection
        icon="notifications"
        title="Notifiche push ai follower"
        preview={pushEnabled ? `${followers ?? 0} follower` : 'Richiede Piano Pro'}
        expanded={pushExpanded}
        onToggle={() => setPushExpanded((v) => !v)}
      >
        <View style={styles.pushCardInner}>
          <AppText variant="title" style={{ fontSize: 14 }}>🔔 Notifiche Push dirette</AppText>
          <AppText variant="caption" style={{ marginTop: 2, marginBottom: spacing.sm, fontSize: 11 }}>
            Invia promozioni e novità ai clienti che hanno salvato il tuo locale nei preferiti.
          </AppText>

          <View style={styles.followerStatBox}>
            <AppText variant="eyebrow" color={colors.onSurfaceMuted} style={{ fontSize: 8 }}>CLIENTI CHE TI SEGUONO</AppText>
            <AppText variant="h1" color={colors.brand} style={{ marginTop: 2, fontSize: 24, lineHeight: 28 }}>{followers ?? '0'}</AppText>
          </View>

          {!pushEnabled ? (
            <View style={styles.lockedPushBox}>
              <AppText variant="bodyBold" color={colors.onYellow} style={{ textAlign: 'center', marginBottom: spacing.xs, fontSize: 11 }}>
                Attiva il Piano Pro (€19/mese) per inviare notifiche push ai tuoi follower.
              </AppText>
              <SurfaceButton label="Passa a Pro" onPress={() => router.push('/(owner)/piano')} />
            </View>
          ) : (
            <View style={{ marginTop: spacing.xs }}>
              <AppText variant="eyebrow" color={colors.brandInk} style={styles.fieldLabel}>TITOLO NOTIFICA *</AppText>
              <TextInput
                style={styles.inputViolet}
                placeholder="es. Sconto 10% stasera per i nostri follower!"
                placeholderTextColor={colors.onSurfaceMuted}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />

              <AppText variant="eyebrow" color={colors.brandInk} style={styles.fieldLabel}>MESSAGGIO NOTIFICA *</AppText>
              <TextInput
                style={[styles.inputViolet, { height: 74, textAlignVertical: 'top' }]}
                placeholder="es. Mostra questo messaggio al cameriere..."
                placeholderTextColor={colors.onSurfaceMuted}
                value={body}
                onChangeText={setBody}
                maxLength={500}
                multiline
              />

              <View style={{ marginTop: spacing.sm }}>
                <SurfaceButton
                  label={busyPush ? 'Invio in corso...' : 'Spedisci Notifica Push'}
                  onPress={sendPush}
                  disabled={busyPush || !followers}
                />
              </View>
            </View>
          )}
        </View>
      </CollapseSection>
    </GlassScreenScroll>
  );
}

const styles = StyleSheet.create({
  headerHead: {
    marginBottom: spacing.xs,
  },
  centerCard: {
    padding: spacing.md,
    alignItems: 'center',
    marginTop: 20,
    borderRadius: radius.md,
  },
  cardContainer: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  activeBoostBox: {
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceTertiary,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  boostPricingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pushCardInner: {
    paddingVertical: 2,
  },
  followerStatBox: {
    backgroundColor: colors.surfaceTertiary,
    padding: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  lockedPushBox: {
    marginTop: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.yellowSoft,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.amberBorder,
  },
  fieldLabel: {
    marginTop: spacing.xs,
    marginBottom: 2,
    fontSize: 9,
  },
  inputViolet: {
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.brandInk,
  },
});
