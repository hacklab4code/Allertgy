import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API } from '../../src/api/client';
import { OwnerScreenHeader } from '../../src/components/owner/OwnerScreenHeader';
import {
  AppText,
  GlassCard,
  GlassScreenScroll,
  SurfaceButton,
} from '../../src/components/ui';
import { useOwner } from '../../src/store/owner';
import { useSession } from '../../src/store/session';
import { colors, radius, spacing } from '../../src/theme';
import { markRegistryPrinted, registryNeedsReprint } from '../../src/utils/registryPrint';

/** Registro Allergeni UE 1169/2011 — stampa / ristampa del modulo ufficiale. */
export default function OwnerRegistro() {
  const { current, published } = useOwner();
  const [pdfReprintNeeded, setPdfReprintNeeded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!current?.id) {
      setPdfReprintNeeded(false);
      return;
    }
    registryNeedsReprint(current.id, current.menu_version).then(setPdfReprintNeeded);
  }, [current?.id, current?.menu_version]);

  if (!current) {
    return (
      <GlassScreenScroll headerFloat>
        <OwnerScreenHeader title="Registro Allergeni" backTo="/(owner)/locali" />
        <GlassCard style={styles.card}>
          <AppText variant="bodyBold" style={{ textAlign: 'center', marginBottom: 12 }}>
            Seleziona prima un locale
          </AppText>
          <SurfaceButton label="Vai ad Attività" onPress={() => router.push('/(owner)/locali')} />
        </GlassCard>
      </GlassScreenScroll>
    );
  }

  const hasMenu = published || !!current.menu_updated_at;
  const legalOk = !!(current as any).vat_number && !!(current as any).allergen_manager;
  const legalConfirmed = !!(current as any).menu_legal_confirmed_at;
  const menuVersion = current.menu_version || 0;
  const canPrint = hasMenu && legalOk && legalConfirmed;

  const downloadRegistryPdf = async () => {
    if (!canPrint) {
      const missing: string[] = [];
      if (!hasMenu) missing.push('menù pubblicato');
      if (!legalOk) missing.push('P.IVA e referente HACCP');
      if (!legalConfirmed) missing.push('conferma responsabilità (pubblica menù)');
      Alert.alert(
        'Registro non pronto',
        `Per un documento utilizzabile in sala e nei controlli completa: ${missing.join(', ')}.`,
      );
      return;
    }
    const token = useSession.getState().token;
    if (!token) return;
    setBusy(true);
    const pdfUrl = `${API}/admin/restaurants/${current.id}/registry.pdf?token=${token}`;
    try {
      await Linking.openURL(pdfUrl);
      await markRegistryPrinted(current.id, menuVersion);
      setPdfReprintNeeded(false);
    } catch {
      Alert.alert(
        'Errore',
        'Impossibile aprire il Registro. Verifica P.IVA, referente e conferma menù, poi riprova.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassScreenScroll headerFloat>
      <OwnerScreenHeader
        title="Registro Allergeni"
        subtitle="Modulo UE 1169/2011 · stampa ufficiale"
        backTo="/(owner)/qr"
      />

      <GlassCard style={styles.card}>
        <AppText variant="eyebrow" color={colors.onSurfaceMuted} style={{ fontSize: 9 }}>
          DOCUMENTO PER SALA E CONTROLLI
        </AppText>
        <AppText variant="h2" style={{ fontSize: 18, marginTop: 4 }}>
          {current.name}
        </AppText>
        <AppText variant="caption" color={colors.onSurfaceMuted} style={{ marginTop: 6, lineHeight: 18 }}>
          PDF del Registro degli Allergeni ai sensi del Reg. (UE) 1169/2011 (art. 44 e All. II).
          Contiene intestazione del locale, tabella piatti/allergeni, dichiarazione del responsabile
          e spazio firma. Va ristampato a ogni modifica del menù.
        </AppText>

        <View style={styles.statusRow}>
          <StatusPill ok={hasMenu} label={hasMenu ? `Menù v${menuVersion}` : 'Menù da pubblicare'} />
          <StatusPill ok={legalOk} label={legalOk ? 'Dati legali OK' : 'Dati legali incompleti'} />
          <StatusPill
            ok={legalConfirmed}
            label={legalConfirmed ? 'Responsabilità confermata' : 'Conferma menù mancante'}
          />
          <StatusPill
            ok={!pdfReprintNeeded && canPrint}
            label={
              !canPrint
                ? 'Stampa bloccata'
                : pdfReprintNeeded
                  ? 'Da ristampare'
                  : 'Copia aggiornata'
            }
          />
        </View>
      </GlassCard>

      {pdfReprintNeeded && canPrint ? (
        <GlassCard style={[styles.card, styles.warnCard]}>
          <View style={styles.warnRow}>
            <Ionicons name="alert-circle-outline" size={22} color={colors.amberText} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold" style={{ fontSize: 14, color: colors.amberText }}>
                Ristampa obbligatoria
              </AppText>
              <AppText variant="caption" style={{ color: colors.amberText, marginTop: 2, lineHeight: 17 }}>
                Il menù live (v{menuVersion}) è più recente della copia stampata. Scarica e firma
                il nuovo Registro, sostituisci la copia precedente.
              </AppText>
            </View>
          </View>
        </GlassCard>
      ) : null}

      <GlassCard style={styles.card}>
        <AppText variant="eyebrow" color={colors.onSurfaceMuted} style={{ fontSize: 9, marginBottom: 8 }}>
          REQUISITI PER LA VALIDITÀ
        </AppText>
        <CheckRow ok={hasMenu} label="Menù con piatti pubblicato" />
        <CheckRow ok={!!(current as any).vat_number} label={`Partita IVA: ${(current as any).vat_number || 'mancante'}`} />
        <CheckRow
          ok={!!(current as any).allergen_manager}
          label={`Referente HACCP: ${(current as any).allergen_manager || 'mancante'}`}
        />
        <CheckRow ok={legalConfirmed} label="Dichiarazione di responsabilità accettata in pubblicazione" />
        <CheckRow
          ok={!!(current as any).address}
          label={`Indirizzo sul documento: ${(current as any).address || 'consigliato — completa scheda'}`}
        />

        {!legalOk || !legalConfirmed ? (
          <View style={{ marginTop: spacing.md, gap: 8 }}>
            {!legalOk ? (
              <SurfaceButton
                label="Completa dati legali"
                variant="soft"
                icon="document-text-outline"
                onPress={() => router.push('/(owner)/scheda?focus=legal')}
              />
            ) : null}
            {!legalConfirmed ? (
              <SurfaceButton
                label="Pubblica menù e conferma"
                variant="soft"
                icon="restaurant-outline"
                onPress={() => router.push('/(owner)/menu')}
              />
            ) : null}
          </View>
        ) : null}

        {legalOk && legalConfirmed && !(current as any).address ? (
          <View style={{ marginTop: spacing.md }}>
            <SurfaceButton
              label="Aggiungi indirizzo in scheda"
              variant="soft"
              icon="location-outline"
              onPress={() => router.push('/(owner)/scheda')}
            />
          </View>
        ) : null}
      </GlassCard>

      <GlassCard style={styles.card}>
        <AppText variant="eyebrow" color={colors.onSurfaceMuted} style={{ fontSize: 9, marginBottom: 6 }}>
          COME USARLO IN SALA
        </AppText>
        <AppText variant="caption" style={styles.step}>
          1 · Stampa il PDF e fallo firmare dal referente allergeni.
        </AppText>
        <AppText variant="caption" style={styles.step}>
          2 · Tienilo a disposizione di clienti e controlli ASL/NAS.
        </AppText>
        <AppText variant="caption" style={styles.step}>
          3 · Esponi il QR AllerTgy (informazione digitale) e sostituisci il cartaceo a ogni nuova versione menù.
        </AppText>
      </GlassCard>

      <View style={{ marginBottom: spacing['2xl'], gap: 10 }}>
        <SurfaceButton
          label={
            busy
              ? 'Apertura…'
              : !canPrint
                ? 'Completa i requisiti per stampare'
                : pdfReprintNeeded
                  ? 'Ristampa Registro PDF'
                  : 'Scarica Registro PDF'
          }
          icon="print-outline"
          onPress={downloadRegistryPdf}
          disabled={busy || !canPrint}
        />
        <SurfaceButton
          label="Vai al QR tavoli"
          variant="soft"
          icon="qr-code-outline"
          onPress={() => router.push('/(owner)/qr')}
        />
      </View>
    </GlassScreenScroll>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={[styles.pill, ok ? styles.pillOk : styles.pillWarn]}>
      <View style={[styles.dot, { backgroundColor: ok ? colors.green : colors.yellow }]} />
      <AppText
        variant="caption"
        style={{
          fontWeight: '700',
          fontSize: 11,
          color: ok ? colors.greenText : colors.amberText,
        }}
      >
        {label}
      </AppText>
    </View>
  );
}

function CheckRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={styles.checkRow}>
      <Ionicons
        name={ok ? 'checkmark-circle' : 'alert-circle'}
        size={18}
        color={ok ? colors.green : colors.yellow}
      />
      <AppText variant="caption" style={{ flex: 1, fontSize: 12, lineHeight: 17 }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  warnCard: {
    backgroundColor: colors.yellowSoft,
    borderColor: colors.amberBorder,
  },
  warnRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.md,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.md,
  },
  pillOk: { backgroundColor: colors.greenSoft },
  pillWarn: { backgroundColor: colors.yellowSoft },
  dot: { width: 7, height: 7, borderRadius: 4 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  step: {
    marginBottom: 6,
    lineHeight: 17,
    fontSize: 12,
  },
});
