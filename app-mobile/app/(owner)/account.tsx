import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { logoutAndCleanup } from '../../src/services/authSession';
import { useOwner } from '../../src/store/owner';
import { useSession } from '../../src/store/session';
import { AppText, CollapseSection, GlassCard, GlassScreenScroll, SettingsDivider, SettingsRow } from '../../src/components/ui';
import { colors, radius, spacing } from '../../src/theme';

function ChecklistRow({ ok, label, onPress }: { ok: boolean; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.chkRow} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.chkBadge, ok ? styles.chkBadgeOk : styles.chkBadgeWarn]}>
        <AppText variant="caption" style={{ color: ok ? colors.onGreen : colors.onYellow, fontWeight: '800', fontSize: 10 }}>
          {ok ? '✓' : '!'}
        </AppText>
      </View>
      <AppText variant="bodyBold" style={{ flex: 1, fontSize: 13 }}>{label}</AppText>
      <Ionicons name="chevron-forward" size={16} color={colors.onSurfaceMuted} />
    </TouchableOpacity>
  );
}

/** Scheda Account Ristoratore — Dimensioni bilanciate e tipografia compatta. */
export default function OwnerAccount() {
  const { email } = useSession();
  const { restaurants, current, reset } = useOwner();
  const locale = current ?? restaurants[0] ?? null;
  const plan = locale?.business_plan ?? 'free';
  const status = locale?.subscription_status ?? 'free';
  const planLabel = plan === 'base' ? 'Base' : plan === 'pro_notify' ? 'Pro' : 'Gratis';
  const hasMenu = !!locale?.menu_updated_at;
  const hasPublicProfile = !!locale?.city && !!(locale as any)?.address && !!(locale as any)?.phone;
  const hasLegalData = !!(locale as any)?.vat_number && !!(locale as any)?.allergen_manager;
  const setupDone = [!!locale, hasPublicProfile, hasMenu, hasLegalData, plan !== 'free' || status !== 'free'].filter(Boolean).length;
  const setupComplete = setupDone >= 5;

  const [checklistExpanded, setChecklistExpanded] = useState(!setupComplete);
  const [growthExpanded, setGrowthExpanded] = useState(false);
  const [supportExpanded, setSupportExpanded] = useState(false);

  const checklistPreview = useMemo(() => {
    if (setupComplete) return 'Setup completato (5/5)';
    return `${setupDone}/5 passaggi completati`;
  }, [setupComplete, setupDone]);

  const confirmLogout = () =>
    Alert.alert('Esci dall\'account', 'Vuoi davvero uscire dall\'account ristoratore?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Esci', style: 'destructive',
        onPress: async () => { reset(); await logoutAndCleanup(); router.replace('/welcome'); },
      },
    ]);

  return (
    <GlassScreenScroll headerFloat>
      {/* Hero Card Ristoratore */}
      <GlassCard style={styles.heroCard}>
        <View style={styles.avatarRing}>
          <View style={styles.avatarInner}>
            <AppText variant="h2" color="#FFFFFF" style={{ fontSize: 20 }}>
              {(email ?? 'A')[0].toUpperCase()}
            </AppText>
          </View>
        </View>

        <AppText variant="h2" style={styles.emailText} numberOfLines={1}>
          {email ?? 'Account Ristoratore'}
        </AppText>

        <View style={styles.verifiedBadge}>
          <AppText variant="caption" color={colors.onGreen} style={{ fontWeight: '800', fontSize: 10 }}>
            Account ristoratore
          </AppText>
        </View>
      </GlassCard>

      <GlassCard style={styles.venueCard}>
        <AppText variant="eyebrow" color={colors.onSurfaceMuted} style={styles.eyebrowText}>
          LOCALE OPERATIVO · {planLabel}
        </AppText>
        <TouchableOpacity style={styles.localeRow} onPress={() => router.push('/(owner)/locali')} activeOpacity={0.8}>
          <View style={styles.venueIconContainer}>
            <Ionicons name="storefront-outline" size={20} color={colors.brandInk} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="title" numberOfLines={1} style={{ fontSize: 15 }}>
              {locale ? locale.name : 'Nessun locale selezionato'}
            </AppText>
            <AppText variant="caption" numberOfLines={1}>
              {locale
                ? `${locale.city || 'Città da completare'} · #${locale.public_code} · ${hasMenu ? 'Menù live' : 'Menù bozza'}`
                : 'Tocca per registrare l’attività'}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceMuted} />
        </TouchableOpacity>
      </GlassCard>

      {/* Checklist Complicanza Legale */}
      <CollapseSection
        icon="checkbox"
        title="Checklist obbligatoria"
        preview={checklistPreview}
        expanded={checklistExpanded}
        onToggle={() => setChecklistExpanded((v) => !v)}
      >
        <ChecklistRow ok={hasPublicProfile} label="Scheda pubblica completa" onPress={() => router.push('/(owner)/scheda')} />
        <ChecklistRow ok={hasMenu} label="Menù allergeni pubblicato" onPress={() => router.push('/(owner)/menu')} />
        <ChecklistRow ok={hasLegalData} label="P.IVA e referente allergeni" onPress={() => router.push('/(owner)/scheda?focus=legal')} />
        <ChecklistRow ok={plan !== 'free' || status !== 'free'} label="Piano attivo (Base o Pro)" onPress={() => router.push('/(owner)/piano')} />
        <AppText variant="caption" style={styles.legalNote}>
          Pubblicando il menù dichiari sotto la tua responsabilità la conformità degli allergeni al Regolamento UE 1169/2011.
        </AppText>
      </CollapseSection>

      <CollapseSection
        icon="construct-outline"
        title="Strumenti"
        preview="QR, stats, piano, boost"
        expanded={growthExpanded}
        onToggle={() => setGrowthExpanded((v) => !v)}
      >
        <SettingsRow icon="qr-code-outline" title="QR code tavoli" subtitle="Codice e locandina per i clienti" onPress={() => router.push('/(owner)/qr')} />
        <SettingsDivider />
        <SettingsRow icon="restaurant-outline" title="Scheda Sicurezza Cucina & AI" subtitle="AI Auto-Tagger e Libro Allergeni ASL" onPress={() => router.push('/kitchen-safety-sheet')} />
        <SettingsDivider />
        <SettingsRow icon="print-outline" title="Registro Allergeni PDF" subtitle="Modulo ufficiale UE 1169/2011" onPress={() => router.push('/(owner)/registro')} />
        <SettingsDivider />
        <SettingsRow icon="bar-chart-outline" title="Statistiche di ricerca" subtitle="Visite menù ed allergeni cercati dai clienti" onPress={() => router.push('/(owner)/statistiche')} />
        <SettingsDivider />
        <SettingsRow icon="card-outline" title="Piano e fatturazione" subtitle="Gestione abbonamento e ricevute Stripe" onPress={() => router.push('/(owner)/piano')} />
        <SettingsDivider />
        <SettingsRow icon="megaphone-outline" title="Boost e notifiche push" subtitle="Promozioni in evidenza e messaggi ai follower" onPress={() => router.push('/(owner)/crescita')} />
        <SettingsDivider />
        <SettingsRow icon="star-outline" title="Recensioni ospiti" subtitle="Leggi e rispondi ai commenti dei clienti" onPress={() => router.push('/(owner)/recensioni')} />
      </CollapseSection>

      {/* Assistenza */}
      <CollapseSection
        icon="help-circle-outline"
        title="Assistenza & Supporto"
        preview="supporto@allertgy.it"
        expanded={supportExpanded}
        onToggle={() => setSupportExpanded((v) => !v)}
      >
        <SettingsRow
          icon="mail-outline"
          title="Invia una mail al supporto"
          subtitle="supporto@allertgy.it"
          onPress={() => Linking.openURL('mailto:supporto@allertgy.it')}
        />
      </CollapseSection>

      <GlassCard style={styles.accountCard}>
        <AppText variant="eyebrow" color={colors.onSurfaceMuted} style={styles.eyebrowText}>
          DATI ACCOUNT
        </AppText>
        <SettingsRow
          icon="person-outline"
          title="Nome, email e password"
          subtitle="Modifica i tuoi dati di accesso"
          onPress={() => router.push('/account-settings')}
        />
      </GlassCard>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButtonPill} onPress={confirmLogout} activeOpacity={0.8}>
        <AppText variant="caption" color={colors.red} style={{ fontWeight: '800', fontSize: 12 }}>
          Esci dall'Account Ristoratore
        </AppText>
      </TouchableOpacity>
    </GlassScreenScroll>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderRadius: radius.md,
  },
  avatarRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 4,
  },
  avatarInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailText: {
    fontSize: 15,
    textAlign: 'center',
  },
  accountCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  verifiedBadge: {
    marginTop: 4,
    backgroundColor: colors.greenSoft,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.greenBorder,
  },
  venueCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
  },
  eyebrowText: {
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 4,
  },
  localeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: spacing.sm,
  },
  venueIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: spacing.sm,
  },
  chkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chkBadgeOk: {
    backgroundColor: colors.greenSoft,
  },
  chkBadgeWarn: {
    backgroundColor: colors.yellowSoft,
  },
  legalNote: {
    fontSize: 10,
    marginTop: 4,
    lineHeight: 14,
  },
  logoutButtonPill: {
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.redSoft,
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
});
