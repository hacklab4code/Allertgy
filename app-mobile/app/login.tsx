import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { api } from '../src/api/client';
import { useSession, type Role } from '../src/store/session';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [forgotSent, setForgotSent] = useState(false);
  const [role, setRole] = useState<Role>('customer');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptHealthData, setAcceptHealthData] = useState(false);
  const [acceptOwnerResponsibility, setAcceptOwnerResponsibility] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const session = useSession();

  const legalOk = mode !== 'register' || (
    acceptTerms &&
    acceptPrivacy &&
    (role === 'customer' ? acceptHealthData : acceptOwnerResponsibility)
  );
  const formOk = mode === 'forgot'
    ? !!email.trim()
    : !!email.trim() && password.length >= 8 && legalOk && (mode === 'login' || !!displayName.trim());

  const submit = async () => {
    setBusy(true);
    setError('');
    if (mode === 'forgot') {
      try {
        await api.forgotPassword(email.trim());
        setForgotSent(true);
      } catch (e) {
        setError((e as Error).message);
      }
      setBusy(false);
      return;
    }
    try {
      const res = mode === 'login'
        ? await api.login(email.trim(), password)
        : await api.register(email.trim(), password, role, displayName.trim(), {
            accept_terms: acceptTerms,
            accept_privacy: acceptPrivacy,
            accept_health_data: role === 'customer' ? acceptHealthData : false,
            accept_owner_responsibility: role === 'owner' ? acceptOwnerResponsibility : false,
          });
      session.setToken(res.access_token);
      session.setEmail(email.trim());
      session.setRole(res.role === 'owner' ? 'owner' : 'customer');
      if (res.role !== 'owner') {
        const profile = await api.getProfile();
        session.setLegalStatus(profile.legal_consents_ok, !!profile.health_data_consent_at);
        session.setProfileCompleted(profile.onboarding_completed);
        session.setDisclaimer(profile.disclaimer_accepted);
        session.setEmergencyMedicines(profile.emergency_medicines);
        // recupera il profilo salvato sul server
        const mine = mode === 'login' ? await api.myAllergens().catch(() => []) : [];
        session.setAllergie(mine.map((a) => a.code));
      } else {
        session.setLegalStatus(true, false);
      }
      router.replace('/');
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>AllerTgy</Text>
        <View style={styles.heading}>
          <Text style={styles.title}>
            {mode === 'login' ? 'Accedi al tuo account'
              : mode === 'forgot' ? 'Recupera la password'
              : 'Crea il tuo account'}
          </Text>
          <Text style={styles.tagline}>
            {mode === 'login'
              ? 'Riapri il tuo profilo allergie e continua dal tuo ultimo locale.'
              : mode === 'forgot'
              ? 'Ti invieremo un link via email per scegliere una nuova password.'
              : 'Il profilo allergie resta sul tuo dispositivo e nel tuo account.'}
          </Text>
        </View>

        {/* Scelta ruolo (solo in registrazione) */}
        {mode === 'register' && (
          <View style={styles.roles}>
            <TouchableOpacity
              style={[styles.role, role === 'customer' && styles.roleOn]}
              onPress={() => setRole('customer')}
            >
              <Text style={styles.roleEmoji}>🙋</Text>
              <Text style={[styles.roleText, role === 'customer' && styles.roleTextOn]}>Sono un cliente</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.role, role === 'owner' && styles.roleOn]}
              onPress={() => setRole('owner')}
            >
              <Text style={styles.roleEmoji}>👨‍🍳</Text>
              <Text style={[styles.roleText, role === 'owner' && styles.roleTextOn]}>Ho un ristorante</Text>
            </TouchableOpacity>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {mode === 'register' && (
          <View style={styles.field}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={styles.input} placeholder="Il tuo nome" autoCapitalize="words"
              value={displayName} onChangeText={setDisplayName}
            />
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input} placeholder="nome@email.it" autoCapitalize="none"
            keyboardType="email-address" value={email} onChangeText={setEmail}
          />
        </View>
        {mode !== 'forgot' && (
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input} placeholder="Minimo 8 caratteri"
              secureTextEntry value={password} onChangeText={setPassword}
            />
            {mode === 'login' && (
              <TouchableOpacity onPress={() => { setMode('forgot'); setError(''); setForgotSent(false); }}>
                <Text style={styles.forgotLink}>Password dimenticata?</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {mode === 'forgot' && forgotSent && (
          <View style={styles.legalBox}>
            <Text style={styles.checkText}>
              📧 Se l'indirizzo esiste, riceverai un'email con il link per reimpostare la password.
              Il link scade tra 30 minuti.
            </Text>
          </View>
        )}

        {mode === 'register' && (
          <View style={styles.legalBox}>
            <CheckRow
              checked={acceptTerms}
              onPress={() => setAcceptTerms(!acceptTerms)}
              text="Accetto i Termini di servizio di AllerTgy."
            />
            <CheckRow
              checked={acceptPrivacy}
              onPress={() => setAcceptPrivacy(!acceptPrivacy)}
              text="Ho letto l'Informativa Privacy."
            />
            {role === 'customer' ? (
              <CheckRow
                checked={acceptHealthData}
                onPress={() => setAcceptHealthData(!acceptHealthData)}
                text="Acconsento al trattamento dei dati su allergie, intolleranze e preferenze alimentari per personalizzare il menù."
              />
            ) : (
              <CheckRow
                checked={acceptOwnerResponsibility}
                onPress={() => setAcceptOwnerResponsibility(!acceptOwnerResponsibility)}
                text="Dichiaro di essere autorizzato a gestire il locale e di pubblicare informazioni allergeni verificate."
              />
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, (busy || !formOk) && styles.disabled]}
          disabled={busy || !formOk}
          onPress={submit}
        >
          {busy
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>
                {mode === 'login' ? 'Accedi' : mode === 'forgot' ? 'Invia link di recupero' : 'Crea account'}
              </Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setForgotSent(false); }}
        >
          <Text style={styles.switch}>
            {mode === 'login' ? 'Non hai un account? Registrati'
              : mode === 'forgot' ? '← Torna all\'accesso'
              : 'Hai già un account? Accedi'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function CheckRow({ checked, onPress, text }: { checked: boolean; onPress: () => void; text: string }) {
  return (
    <TouchableOpacity style={styles.checkRow} onPress={onPress}>
      <View style={[styles.checkbox, checked && styles.checkboxOn]}>
        {checked ? <Text style={styles.checkboxMark}>✓</Text> : null}
      </View>
      <Text style={styles.checkText}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7FAF8' },
  container: { flexGrow: 1, padding: 24, paddingTop: 70, paddingBottom: 32 },
  logo: { fontSize: 22, fontWeight: '800', color: '#0B5D4D', marginBottom: 28 },
  heading: { gap: 6, marginBottom: 20 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: '#10201B' },
  tagline: { color: '#596B63', fontSize: 15, lineHeight: 22 },
  roles: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  role: {
    flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDE8E2',
    borderRadius: 12, padding: 12, alignItems: 'center',
  },
  roleOn: { borderColor: '#0F8A6A', backgroundColor: '#DDF8EA' },
  roleEmoji: { fontSize: 24 },
  roleText: { fontSize: 13, fontWeight: '600', color: '#596B63', marginTop: 4 },
  roleTextOn: { color: '#0B5D4D', fontWeight: '800' },
  field: { gap: 6, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: '#596B63' },
  input: {
    height: 48,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDE8E2',
    borderRadius: 12, paddingHorizontal: 14, fontSize: 15,
    color: '#10201B',
  },
  button: {
    height: 52,
    backgroundColor: '#0F8A6A', borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  disabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  switchButton: { height: 48, alignItems: 'center', justifyContent: 'center' },
  forgotLink: { color: '#0B5D4D', fontWeight: '600', fontSize: 12.5, textAlign: 'right', marginTop: 4 },
  switch: { textAlign: 'center', color: '#0B5D4D', fontWeight: '600' },
  error: { color: '#dc2626', marginBottom: 12, fontWeight: '700' },
  legalBox: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDE8E2',
    borderRadius: 12, padding: 12, marginBottom: 12, gap: 10,
  },
  checkRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  checkbox: {
    width: 22, height: 22, borderRadius: 7, borderWidth: 1,
    borderColor: '#C9D8D0', alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: { backgroundColor: '#0F8A6A', borderColor: '#0F8A6A' },
  checkboxMark: { color: '#fff', fontWeight: '900', fontSize: 14 },
  checkText: { flex: 1, color: '#596B63', fontSize: 12.5, lineHeight: 18, fontWeight: '600' },
});
