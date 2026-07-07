import { router } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSession } from '../../src/store/session';
import { colors, radius, shadow, spacing, typography } from '../../src/theme';

/** Scheda Cerca: punto d'ingresso del cliente — scanner QR o codice locale. */
export default function Home() {
  const [code, setCode] = useState('');
  const { allergie, recents, email } = useSession();
  const hasAllergie = allergie.length > 0;
  const firstName = (email ?? '').split('@')[0] || 'benvenuto';

  const go = (c?: string) => {
    const target = (c ?? code).trim();
    if (target.length >= 4) router.push(`/menu/${target}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Saluto */}
      <Text style={styles.greeting}>Ciao {firstName} 👋</Text>
      <Text style={styles.title}>Dove stai mangiando?</Text>
      <Text style={styles.subtitle}>
        Inquadra il QR sul tavolo o inserisci il codice: vedrai subito quali piatti sono adatti a te.
      </Text>

      {/* Hero scanner */}
      <TouchableOpacity style={styles.qr} onPress={() => router.push('/scanner')} activeOpacity={0.9}>
        <View style={styles.qrIconWrap}>
          <Text style={styles.qrEmoji}>📷</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.qrText}>Scansiona QR Code</Text>
          <Text style={styles.qrSub}>Il modo più veloce al tavolo</Text>
        </View>
        <Text style={styles.qrArrow}>›</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.line} /><Text style={styles.or}>oppure</Text><View style={styles.line} />
      </View>

      {/* Inserimento codice con azione inline */}
      <View style={styles.codeRow}>
        <TextInput
          style={styles.input}
          placeholder="Codice (es. 100001)"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
          maxLength={6}
          onSubmitEditing={() => go()}
          returnKeyType="go"
        />
        <TouchableOpacity
          style={[styles.codeGo, code.trim().length < 4 && styles.codeGoOff]}
          disabled={code.trim().length < 4}
          onPress={() => go()}
        >
          <Text style={styles.codeGoText}>Vai</Text>
        </TouchableOpacity>
      </View>

      {/* Stato profilo: guida l'utente se mancano le allergie */}
      {hasAllergie ? (
        <View style={[styles.statusCard, styles.statusOk]}>
          <Text style={styles.statusEmoji}>🛡️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>Profilo attivo</Text>
            <Text style={styles.statusText}>
              {allergie.length} {allergie.length === 1 ? 'allergia/preferenza impostata' : 'allergie/preferenze impostate'} — i menù vengono filtrati su di te.
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/allergie')}>
            <Text style={styles.statusAction}>Modifica</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={[styles.statusCard, styles.statusWarn]} onPress={() => router.push('/allergie')} activeOpacity={0.9}>
          <Text style={styles.statusEmoji}>⚠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusTitle, { color: colors.amberText }]}>Imposta le tue allergie</Text>
            <Text style={[styles.statusText, { color: colors.amberText }]}>
              Senza il profilo il semaforo non può proteggerti. Bastano pochi secondi.
            </Text>
          </View>
          <Text style={[styles.statusAction, { color: colors.amberText }]}>Imposta ›</Text>
        </TouchableOpacity>
      )}

      {/* Accesso rapido all'ultimo locale */}
      {recents.length > 0 && (
        <View style={styles.recentsBox}>
          <View style={styles.recentsHead}>
            <Text style={styles.recentsTitle}>Riprendi da dove eri</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/locali')}>
              <Text style={styles.allRecents}>Tutti i locali ›</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.recent} onPress={() => go(recents[0].code)} activeOpacity={0.85}>
            <View style={styles.recentAvatar}><Text style={styles.recentAvatarText}>🍽</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recentName}>{recents[0].name}</Text>
              <Text style={styles.recentCode}>Codice #{recents[0].code}</Text>
            </View>
            <Text style={styles.recentArrow}>›</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, paddingTop: spacing.lg, paddingBottom: 48, backgroundColor: colors.bg },
  greeting: { ...typography.caption, color: colors.brandDark, marginBottom: 2 },
  title: { ...typography.h1, color: colors.ink },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xl },

  qr: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.brand, borderRadius: radius.xl, padding: spacing.xl,
    ...shadow.raised,
  },
  qrIconWrap: {
    width: 52, height: 52, borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center',
  },
  qrEmoji: { fontSize: 28 },
  qrText: { color: colors.white, fontWeight: '800', fontSize: 18 },
  qrSub: { color: colors.brand100, fontSize: 12.5, marginTop: 2, fontWeight: '600' },
  qrArrow: { color: colors.white, fontSize: 30, fontWeight: '300', opacity: 0.8 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.lg },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  or: { ...typography.caption, color: colors.textMuted },

  codeRow: { flexDirection: 'row', gap: spacing.sm },
  input: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.lg, height: 56, fontSize: 18,
    letterSpacing: 3, color: colors.ink, fontWeight: '700',
  },
  codeGo: {
    width: 72, height: 56, borderRadius: radius.md, backgroundColor: colors.brandDark,
    alignItems: 'center', justifyContent: 'center',
  },
  codeGoOff: { backgroundColor: colors.borderStrong },
  codeGoText: { color: colors.white, fontWeight: '800', fontSize: 15 },

  statusCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.xl, borderWidth: 1,
  },
  statusOk: { backgroundColor: colors.greenBg, borderColor: colors.greenBorder },
  statusWarn: { backgroundColor: colors.amberBg, borderColor: colors.amberBorder },
  statusEmoji: { fontSize: 24 },
  statusTitle: { fontWeight: '800', color: colors.greenText, fontSize: 14 },
  statusText: { color: colors.greenText, fontSize: 12.5, marginTop: 2, lineHeight: 17 },
  statusAction: { fontWeight: '800', color: colors.brandDark, fontSize: 13 },

  recentsBox: {
    marginTop: spacing.xxl, backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.lg, ...shadow.card,
  },
  recentsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  recentsTitle: { ...typography.h3, color: colors.ink },
  allRecents: { color: colors.brandDark, fontWeight: '700', fontSize: 13 },
  recent: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  recentAvatar: {
    width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.brand50,
    alignItems: 'center', justifyContent: 'center',
  },
  recentAvatarText: { fontSize: 20 },
  recentName: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  recentCode: { color: colors.textMuted, fontSize: 12.5, marginTop: 1 },
  recentArrow: { color: colors.textMuted, fontSize: 26, fontWeight: '300' },
});
