import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useOwner } from '../../src/store/owner';
import { WEB_URL } from '../../src/api/client';
import {
  AppText,
  CollapseSection,
  GlassCard,
  GlassScreenScroll,
  SurfaceButton,
} from '../../src/components/ui';
import { colors, radius, spacing } from '../../src/theme';
import { registryNeedsReprint } from '../../src/utils/registryPrint';

/** QR tavoli — codice e locandina. Registro PDF in schermata dedicata. */
export default function QR() {
  const { current, published } = useOwner();
  const [howToExpanded, setHowToExpanded] = useState(false);
  const [pdfReprintNeeded, setPdfReprintNeeded] = useState(false);

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
        <GlassCard style={styles.centerCard}>
          <AppText variant="h2" color={colors.onSurfaceMuted} style={{ fontSize: 16 }}>
            Nessun locale selezionato
          </AppText>
          <AppText variant="subtitle" style={styles.emptySub}>
            Seleziona o crea la tua attività per sbloccare il codice QR.
          </AppText>
          <SurfaceButton label="Vai ad Attività" onPress={() => router.push('/(owner)/locali')} />
        </GlassCard>
      </GlassScreenScroll>
    );
  }

  const hasMenu = published || !!current.menu_updated_at;

  return (
    <GlassScreenScroll headerFloat>
      <GlassCard style={styles.qrBlockCard}>
        <AppText variant="eyebrow" color={colors.onSurfaceMuted} style={{ fontSize: 9 }}>
          CODICE & QR AL TAVOLO
        </AppText>
        <AppText variant="caption" style={styles.blockSub}>
          Stampa o esponi il QR: ogni cliente scopre subito i piatti idonei sul suo profilo.
        </AppText>

        <AppText variant="h2" style={styles.titleText}>
          {current.name}
        </AppText>
        {hasMenu ? (
          <View style={styles.okBadge}>
            <AppText variant="caption" color={colors.onGreen} style={{ fontWeight: '800', fontSize: 10 }}>
              Menù pubblicato
            </AppText>
          </View>
        ) : (
          <TouchableOpacity style={styles.warnBadge} onPress={() => router.push('/(owner)/menu')}>
            <AppText variant="caption" color={colors.onYellow} style={{ fontWeight: '800', fontSize: 10 }}>
              Menù in bozza — apri editor
            </AppText>
          </TouchableOpacity>
        )}

        <View style={styles.codeContainer}>
          <AppText variant="eyebrow" color={colors.brandInk} style={{ fontSize: 8 }}>
            CODICE UNIVOCO LOCALE
          </AppText>
          <AppText variant="h1" color={colors.brand} style={styles.codeText}>
            #{current.public_code}
          </AppText>
        </View>

        <View style={styles.qrWrapper}>
          <Image
            style={styles.qrImage}
            source={{
              uri: `https://api.qrserver.com/v1/create-qr-code/?size=340x340&data=${encodeURIComponent(WEB_URL + '/r/' + current.public_code)}`,
            }}
          />
        </View>

        <AppText variant="caption" style={styles.hintText}>
          I clienti inquadrano il QR con lo smartphone. Funziona anche nel browser.
        </AppText>
      </GlassCard>

      <GlassCard style={[styles.registryCard, pdfReprintNeeded && styles.registryCardWarn]}>
        <AppText variant="eyebrow" color={colors.onSurfaceMuted} style={{ fontSize: 9 }}>
          MODULO LEGALE
        </AppText>
        <AppText variant="bodyBold" style={{ fontSize: 15, marginTop: 4 }}>
          Registro Allergeni UE 1169/2011
        </AppText>
        <AppText variant="caption" style={{ marginTop: 4, marginBottom: spacing.sm, lineHeight: 17 }}>
          {pdfReprintNeeded
            ? `Menù v${current.menu_version ?? 0} più recente della copia stampata — ristampa il modulo.`
            : 'Scarica e stampa il PDF ufficiale da tenere in sala.'}
        </AppText>
        <SurfaceButton
          label={pdfReprintNeeded ? 'Ristampa Registro' : 'Apri Registro Allergeni'}
          icon="print-outline"
          onPress={() => router.push('/(owner)/registro')}
        />
      </GlassCard>

      <CollapseSection
        icon="help-circle"
        title="Come usarlo in sala"
        preview="3 passaggi semplici"
        expanded={howToExpanded}
        onToggle={() => setHowToExpanded((v) => !v)}
      >
        <AppText variant="caption" style={styles.stepItem}>
          1 · Dopo ogni modifica menù, ristampa il Registro Allergeni (schermata dedicata).
        </AppText>
        <AppText variant="caption" style={styles.stepItem}>
          2 · Posiziona i segnatavolo col QR sui tavoli e al banco cassa.
        </AppText>
        <AppText variant="caption" style={styles.stepItem}>
          3 · L’ospite inquadra il QR: menù filtrato sulle sue allergie.
        </AppText>
      </CollapseSection>
    </GlassScreenScroll>
  );
}

const styles = StyleSheet.create({
  centerCard: {
    padding: spacing.md,
    alignItems: 'center',
    marginTop: 20,
    borderRadius: radius.md,
  },
  emptySub: {
    textAlign: 'center',
    marginTop: 2,
    marginBottom: spacing.sm,
    fontSize: 12,
  },
  qrBlockCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  registryCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  registryCardWarn: {
    backgroundColor: colors.yellowSoft,
    borderColor: colors.amberBorder,
  },
  blockSub: {
    textAlign: 'center',
    marginTop: 2,
    marginBottom: spacing.sm,
    fontSize: 11,
  },
  titleText: {
    textAlign: 'center',
    fontSize: 18,
  },
  okBadge: {
    backgroundColor: colors.greenSoft,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.greenBorder,
  },
  warnBadge: {
    backgroundColor: colors.yellowSoft,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.amberBorder,
  },
  codeContainer: {
    marginTop: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  codeText: {
    fontSize: 22,
    lineHeight: 26,
  },
  qrWrapper: {
    marginTop: spacing.sm,
    padding: spacing.xs,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  qrImage: {
    width: 160,
    height: 160,
  },
  hintText: {
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 15,
    fontSize: 11,
  },
  stepItem: {
    marginBottom: 4,
    lineHeight: 16,
    fontSize: 11,
  },
});
