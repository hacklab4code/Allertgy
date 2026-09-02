import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api/client';
import { OwnerReviewsPanel } from '../../src/components/owner/OwnerReviewsPanel';
import {
  AppText,
  CollapseSection,
  GlassCard,
  GlassScreenScroll,
  Screen,
  SettingsDivider,
  SettingsRow,
  SurfaceButton,
} from '../../src/components/ui';
import { useOwner } from '../../src/store/owner';
import { colors, font, radius, spacing } from '../../src/theme';
import { registryNeedsReprint } from '../../src/utils/registryPrint';

type StatusTone = 'ok' | 'warn' | 'muted';

function StatusChip({
  label,
  tone,
  onPress,
}: {
  label: string;
  tone: StatusTone;
  onPress?: () => void;
}) {
  const bg =
    tone === 'ok' ? colors.greenSoft : tone === 'warn' ? colors.yellowSoft : colors.surfaceTertiary;
  const fg =
    tone === 'ok' ? colors.greenText : tone === 'warn' ? colors.amberText : colors.onSurfaceMuted;
  return (
    <TouchableOpacity
      style={[styles.statusChip, { backgroundColor: bg }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.85}
    >
      <View
        style={[
          styles.statusDot,
          {
            backgroundColor:
              tone === 'ok' ? colors.green : tone === 'warn' ? colors.yellow : colors.borderStrong,
          },
        ]}
      />
      <AppText variant="caption" style={{ color: fg, fontWeight: '700', fontSize: 11 }}>
        {label}
      </AppText>
    </TouchableOpacity>
  );
}

function ActionTile({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionTile} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={20} color={colors.brandInk} />
      </View>
      <AppText variant="bodyBold" style={{ fontSize: 14, marginTop: 8 }}>
        {title}
      </AppText>
      <AppText variant="caption" color={colors.onSurfaceMuted} style={{ fontSize: 11, marginTop: 2 }}>
        {subtitle}
      </AppText>
    </TouchableOpacity>
  );
}

/** Attività — hub ops: stato, azioni rapide. Scheda pubblica e legali in schermata dedicata. */
export default function Locali() {
  const { restaurants, current, setRestaurants, setCurrent } = useOwner();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reviewStats, setReviewStats] = useState({ total: 0, pending: 0 });
  const [pdfReprintNeeded, setPdfReprintNeeded] = useState(false);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);

  useEffect(() => {
    api
      .myRestaurants()
      .then((data) => {
        setRestaurants(data);
        if (data.length > 0 && !current) setCurrent(data[0]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!current) return;
    registryNeedsReprint(current.id, current.menu_version).then(setPdfReprintNeeded);
  }, [current?.id, current?.menu_version]);

  const legalOk = !!(current as any)?.vat_number && !!(current as any)?.allergen_manager;
  const menuLive = !!current?.menu_updated_at;
  const planLabel =
    current?.business_plan === 'base'
      ? 'Base'
      : current?.business_plan === 'pro_notify'
        ? 'Pro'
        : 'Gratis';
  const schedaIncomplete =
    !legalOk || !(current as any)?.address || !(current as any)?.phone;

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    setError('');
    try {
      const r = await api.createRestaurant(name.trim(), city.trim(), inviteCode.trim() || undefined);
      setRestaurants([...restaurants, r]);
      setCurrent(r);
      setName('');
      setCity('');
      setInviteCode('');
      setShowAddModal(false);
      router.push('/(owner)/menu');
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 60 }} size="large" color={colors.brand} />;
  }

  return (
    <>
      <GlassScreenScroll headerFloat>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="eyebrow" color={colors.textSecondary} style={{ fontSize: 9 }}>
              OGGI IN SALA
            </AppText>
            <AppText variant="h2" color={colors.onSurface} style={{ fontSize: 22 }}>
              {current?.name ?? 'La tua attività'}
            </AppText>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-outline" size={18} color="#FFFFFF" />
            <AppText variant="caption" color="#FFFFFF" style={{ fontWeight: '800', fontSize: 11 }}>
              Locale
            </AppText>
          </TouchableOpacity>
        </View>

        {error ? (
          <AppText variant="bodyBold" color={colors.red} style={{ marginBottom: spacing.sm }}>
            {error}
          </AppText>
        ) : null}

        <GlassCard style={styles.card}>
          <AppText variant="eyebrow" color={colors.onSurfaceMuted} style={{ fontSize: 9, marginBottom: 8 }}>
            LOCALE OPERATIVO
          </AppText>
          {restaurants.length === 0 ? (
            <AppText variant="caption">Nessun locale. Tocca “+ Locale” per iniziare.</AppText>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.venueRow}>
                {restaurants.map((r) => {
                  const active = current?.id === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={[styles.venueChip, active && styles.venueChipActive]}
                      onPress={() => setCurrent(r)}
                      activeOpacity={0.85}
                    >
                      <AppText
                        variant="bodyBold"
                        color={active ? colors.brandInk : colors.onSurface}
                        style={{ fontSize: 13 }}
                        numberOfLines={1}
                      >
                        {r.name}
                      </AppText>
                      <AppText variant="caption" color={colors.onSurfaceMuted} style={{ fontSize: 10 }}>
                        #{r.public_code}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </GlassCard>

        {current ? (
          <>
            <View style={styles.statusRow}>
              <StatusChip
                label={menuLive ? 'Menù live' : 'Menù bozza'}
                tone={menuLive ? 'ok' : 'warn'}
                onPress={() => router.push('/(owner)/menu')}
              />
              <StatusChip
                label={legalOk ? 'Legale OK' : 'Dati legali'}
                tone={legalOk ? 'ok' : 'warn'}
                onPress={() => router.push('/(owner)/scheda?focus=legal')}
              />
              <StatusChip
                label={pdfReprintNeeded ? 'Registro da ristampare' : `Piano ${planLabel}`}
                tone={pdfReprintNeeded ? 'warn' : 'muted'}
                onPress={() =>
                  router.push(pdfReprintNeeded ? '/(owner)/registro' : '/(owner)/piano')
                }
              />
            </View>

            <View style={styles.actionsGrid}>
              <ActionTile
                icon="restaurant-outline"
                title="Menù"
                subtitle={menuLive ? 'Modifica piatti' : 'Da pubblicare'}
                onPress={() => router.push('/(owner)/menu')}
              />
              <ActionTile
                icon="qr-code-outline"
                title="QR tavoli"
                subtitle="Codice per i clienti"
                onPress={() => router.push('/(owner)/qr')}
              />
              <ActionTile
                icon="print-outline"
                title="Registro"
                subtitle={pdfReprintNeeded ? 'Ristampa ora' : 'Modulo UE 1169'}
                onPress={() => router.push('/(owner)/registro')}
              />
            </View>

            <GlassCard style={styles.card}>
              <AppText variant="eyebrow" color={colors.onSurfaceMuted} style={{ fontSize: 9, marginBottom: 4 }}>
                VETRINA E LEGALE
              </AppText>
              <SettingsRow
                icon="storefront-outline"
                title="Scheda pubblica"
                subtitle={
                  schedaIncomplete
                    ? 'Completa indirizzo, contatti e dati legali'
                    : 'Identità, contatti, galleria'
                }
                onPress={() => router.push('/(owner)/scheda')}
              />
              <SettingsDivider />
              <SettingsRow
                icon="document-text-outline"
                title="Dati legali UE"
                subtitle={legalOk ? 'P.IVA e referente HACCP ok' : 'P.IVA e referente da inserire'}
                onPress={() => router.push('/(owner)/scheda?focus=legal')}
              />
              <SettingsDivider />
              <SettingsRow
                icon="print-outline"
                title="Registro Allergeni PDF"
                subtitle={
                  pdfReprintNeeded
                    ? 'Menù aggiornato — ristampa il modulo'
                    : 'Stampa modulo ai sensi UE 1169/2011'
                }
                onPress={() => router.push('/(owner)/registro')}
              />
            </GlassCard>

            <CollapseSection
              icon="star"
              title="Recensioni"
              preview={
                reviewStats.total === 0
                  ? 'Nessuna ancora'
                  : reviewStats.pending > 0
                    ? `${reviewStats.pending} da rispondere`
                    : `${reviewStats.total} recensioni`
              }
              badge={reviewStats.pending > 0 ? reviewStats.pending : undefined}
              expanded={reviewsExpanded}
              onToggle={() => setReviewsExpanded((v) => !v)}
              tint={reviewStats.pending > 0 ? 'yellow' : 'none'}
            >
              <OwnerReviewsPanel locale={current} onStats={setReviewStats} />
            </CollapseSection>
          </>
        ) : null}
      </GlassScreenScroll>

      <Modal visible={showAddModal} animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <Screen edges={false}>
          <View style={styles.modalHead}>
            <AppText variant="h2" style={{ fontSize: 18 }}>
              {restaurants.length === 0 ? 'Registra la prima attività' : 'Nuova attività'}
            </AppText>
            <TouchableOpacity onPress={() => setShowAddModal(false)} hitSlop={12}>
              <AppText variant="bodyBold" style={{ fontSize: 13 }}>
                Chiudi
              </AppText>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <AppText variant="caption" style={{ marginBottom: spacing.sm }}>
              Nome e città bastano: generiamo il codice a 6 cifre per il menù filtrato.
            </AppText>
            <AppText variant="eyebrow" color={colors.brandInk} style={styles.fieldLabel}>
              NOME DEL LOCALE *
            </AppText>
            <TextInput
              style={styles.input}
              placeholder="es. Trattoria da Mario"
              placeholderTextColor={colors.onSurfaceMuted}
              value={name}
              onChangeText={setName}
            />
            <AppText variant="eyebrow" color={colors.brandInk} style={styles.fieldLabel}>
              CITTÀ
            </AppText>
            <TextInput
              style={styles.input}
              placeholder="es. Milano"
              placeholderTextColor={colors.onSurfaceMuted}
              value={city}
              onChangeText={setCity}
            />
            {restaurants.length === 0 ? (
              <>
                <AppText variant="eyebrow" color={colors.brandInk} style={styles.fieldLabel}>
                  CODICE INVITO (OPZIONALE)
                </AppText>
                <TextInput
                  style={styles.input}
                  placeholder="CLIENTE123"
                  placeholderTextColor={colors.onSurfaceMuted}
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                <AppText variant="caption" style={{ marginTop: 4, marginBottom: spacing.sm, fontSize: 10 }}>
                  Se ti ha invitato un cliente, inserisci il codice per 1 mese Pro omaggio.
                </AppText>
              </>
            ) : null}
            <View style={{ marginTop: spacing.sm }}>
              <SurfaceButton
                label={busy ? 'Creazione…' : 'Crea locale'}
                onPress={create}
                disabled={!name.trim() || busy}
              />
            </View>
          </ScrollView>
        </Screen>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: 12,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brand,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  venueRow: {
    flexDirection: 'row',
    gap: 8,
  },
  venueChip: {
    minWidth: 120,
    maxWidth: 180,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTertiary,
  },
  venueChipActive: {
    borderColor: colors.brand,
    borderWidth: 1.5,
    backgroundColor: colors.brand100,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.sm,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.md,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  actionTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    minHeight: 108,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.brand100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    marginTop: spacing.sm,
    marginBottom: 4,
    fontSize: 9,
  },
  input: {
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
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalBody: {
    padding: spacing.md,
  },
});
