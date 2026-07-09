import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { api } from '../src/api/client';
import { useSession, type Role } from '../src/store/session';
import { useNotifStore } from '../src/store/notifications';
import type { Allergen } from '../src/types';
import LanguageFlagsRow from '../src/components/LanguageFlagsRow';
import { useTranslation } from '../src/constants/translations';
import { TRANSLATED_ALLERGENS } from '../src/engine/translations';
import { registraPushToken } from '../src/services/geofencing';

export default function Login() {
  const session = useSession();
  const { t } = useTranslation();
  const isIt = (session.language || 'it').toLowerCase() === 'it';

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [forgotSent, setForgotSent] = useState(false);
  const [role, setRole] = useState<Role>(session.role || 'customer');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptHealthData, setAcceptHealthData] = useState(false);
  const [acceptOwnerResponsibility, setAcceptOwnerResponsibility] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [allAllergens, setAllAllergens] = useState<Allergen[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<Set<string>>(new Set());
  const [intensities, setIntensities] = useState<Record<string, 'lieve' | 'moderata' | 'grave'>>({});

  useEffect(() => {
    if (mode === 'register') {
      api.allergens().then(setAllAllergens).catch(() => {});
    }
  }, [mode]);

  const toggleAllergen = (code: string) => {
    const next = new Set(selectedAllergens);
    next.has(code) ? next.delete(code) : next.add(code);
    setSelectedAllergens(next);
  };

  const updateIntensity = (code: string, level: 'lieve' | 'moderata' | 'grave') => {
    if (!selectedAllergens.has(code)) {
      const next = new Set(selectedAllergens);
      next.add(code);
      setSelectedAllergens(next);
    }
    setIntensities((prev) => ({ ...prev, [code]: level }));
  };

  const onLongPressAllergen = (code: string, name: string) => {
    Alert.alert(
      isIt ? `Intensità: ${name}` : `Severity: ${name}`,
      isIt ? `Imposta quanto è grave questa allergia:` : `Set how severe this allergy is:`,
      [
        { text: isIt ? 'Lieve' : 'Mild', onPress: () => updateIntensity(code, 'lieve') },
        { text: isIt ? 'Moderata' : 'Moderate', onPress: () => updateIntensity(code, 'moderata') },
        { text: isIt ? 'Grave/Anafilassi' : 'Severe/Anaphylaxis', onPress: () => updateIntensity(code, 'grave'), style: 'destructive' },
        { text: isIt ? 'Annulla' : 'Cancel', style: 'cancel' },
      ]
    );
  };

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
      registraPushToken().catch(() => {});
      if (res.role !== 'owner') {
        if (mode === 'register') {
          const codes = [...selectedAllergens];
          await api.saveAllergens(codes, intensities).catch(e => {
            console.log("Errore salvataggio allergeni in registrazione:", e);
          });
          session.setAllergie(codes, intensities);
          session.setLegalStatus(true, true);
          session.setProfileCompleted(true);
          session.setDisclaimer(false);
          session.setEmergencyMedicines(null);
        } else {
          const profile = await api.getProfile();
          session.setLegalStatus(profile.legal_consents_ok, !!profile.health_data_consent_at);
          session.setProfileCompleted(profile.onboarding_completed);
          session.setDisclaimer(profile.disclaimer_accepted);
          session.setEmergencyMedicines(profile.emergency_medicines);
          session.setEmergencyContact(profile.emergency_contact_name ?? null, profile.emergency_contact_phone ?? null);
          const mine = await api.myAllergens().catch(() => []);
          const intensitiesMap: Record<string, 'lieve' | 'moderata' | 'grave'> = {};
          mine.forEach((a) => {
            if (a.intensity) {
              intensitiesMap[a.code] = a.intensity as 'lieve' | 'moderata' | 'grave';
            }
          });
          session.setAllergie(mine.map((a) => a.code), intensitiesMap);
        }
        useNotifStore.getState().refresh();
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
      <Stack.Screen options={{ headerRight: undefined }} />
      <LanguageFlagsRow />

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>AllerTgy</Text>
        <View style={styles.heading}>
          <Text style={styles.title}>
            {mode === 'login' ? t('login_title')
              : mode === 'forgot' ? t('forgot_title')
              : t('register_title')}
          </Text>
          <Text style={styles.tagline}>
            {mode === 'login'
              ? t('login_subtitle')
              : mode === 'forgot'
              ? t('forgot_subtitle')
              : t('register_subtitle')}
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
              <Text style={[styles.roleText, role === 'customer' && styles.roleTextOn]}>
                {isIt ? 'Sono un cliente' : 'I am a customer'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.role, role === 'owner' && styles.roleOn]}
              onPress={() => setRole('owner')}
            >
              <Text style={styles.roleEmoji}>👨‍🍳</Text>
              <Text style={[styles.roleText, role === 'owner' && styles.roleTextOn]}>
                {isIt ? 'Ho un ristorante' : 'I own a restaurant'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {mode === 'register' && (
          <View style={styles.field}>
            <Text style={styles.label}>{t('name_label')}</Text>
            <TextInput
              style={styles.input} placeholder={isIt ? "Il tuo nome" : "Your name"} autoCapitalize="words"
              value={displayName} onChangeText={setDisplayName}
            />
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>{t('email_label')}</Text>
          <TextInput
            style={styles.input} placeholder="nome@email.it" autoCapitalize="none"
            keyboardType="email-address" value={email} onChangeText={setEmail}
          />
        </View>
        {mode !== 'forgot' && (
          <View style={styles.field}>
            <Text style={styles.label}>{t('password_label')}</Text>
            <TextInput
              style={styles.input} placeholder={isIt ? "Minimo 8 caratteri" : "Minimum 8 characters"}
              secureTextEntry value={password} onChangeText={setPassword}
            />
            {mode === 'login' && (
              <TouchableOpacity onPress={() => { setMode('forgot'); setError(''); setForgotSent(false); }}>
                <Text style={styles.forgotLink}>{t('forgot_password_link')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {mode === 'forgot' && forgotSent && (
          <View style={styles.legalBox}>
            <Text style={styles.checkText}>
              📧 {isIt 
                ? "Se l'indirizzo esiste, riceverai un'email con il link per reimpostare la password. Il link scade tra 30 minuti." 
                : "If the email exists, you will receive a link to reset your password. The link expires in 30 minutes."}
            </Text>
          </View>
        )}

        {mode === 'register' && role === 'customer' && allAllergens.length > 0 && (
          <View style={styles.allergenSection}>
            <Text style={styles.allergenSectionTitle}>{t('select_allergies_title')}</Text>
            <Text style={styles.allergenSectionSubtitle}>
              {isIt 
                ? "Tocca per selezionare, tieni premuto per impostare la gravità (Lieve/Mod./Grave)." 
                : "Tap to select, hold to set severity (Mild/Mod./Severe)."}
            </Text>
            
            <Text style={styles.allergenSubsectionTitle}>{isIt ? "Allergeni principali" : "Main allergens"}</Text>
            <View style={styles.allergenGrid}>
              {allAllergens.filter(a => !a.is_diet).map((a) => {
                const on = selectedAllergens.has(a.code);
                return (
                  <TouchableOpacity
                    key={a.code}
                    style={[styles.allergenChip, on && styles.chipOnAllergy]}
                    onPress={() => toggleAllergen(a.code)}
                    onLongPress={() => onLongPressAllergen(a.code, isIt ? a.name_it : (TRANSLATED_ALLERGENS[a.code.toLowerCase()]?.en || a.name_it))}
                    delayLongPress={300}
                  >
                    <Text style={[styles.allergenChipText, on && styles.chipTextOnAllergy]}>
                      {a.emoji} {isIt ? a.name_it : (TRANSLATED_ALLERGENS[a.code.toLowerCase()]?.en || a.name_it)}
                      {on && intensities[a.code] === 'lieve' && (isIt ? ' (Lieve)' : ' (Mild)')}
                      {on && (!intensities[a.code] || intensities[a.code] === 'moderata') && ' (Mod.)'}
                      {on && intensities[a.code] === 'grave' && (isIt ? ' (Grave)' : ' (Severe)')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {allAllergens.some(a => a.is_diet) && (
              <>
                <Text style={styles.allergenSubsectionTitle}>{isIt ? "Preferenze alimentari" : "Dietary preferences"}</Text>
                <View style={styles.allergenGrid}>
                  {allAllergens.filter(a => a.is_diet).map((a) => {
                    const on = selectedAllergens.has(a.code);
                    return (
                      <TouchableOpacity
                        key={a.code}
                        style={[styles.allergenChip, on && styles.chipOnDiet]}
                        onPress={() => toggleAllergen(a.code)}
                        onLongPress={() => onLongPressAllergen(a.code, isIt ? a.name_it : (TRANSLATED_ALLERGENS[a.code.toLowerCase()]?.en || a.name_it))}
                        delayLongPress={300}
                      >
                        <Text style={[styles.allergenChipText, on && styles.chipTextOnDiet]}>
                          {a.emoji} {isIt ? a.name_it : (TRANSLATED_ALLERGENS[a.code.toLowerCase()]?.en || a.name_it)}
                          {on && intensities[a.code] === 'lieve' && (isIt ? ' (Lieve)' : ' (Mild)')}
                          {on && (!intensities[a.code] || intensities[a.code] === 'moderata') && ' (Mod.)'}
                          {on && intensities[a.code] === 'grave' && (isIt ? ' (Grave)' : ' (Severe)')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        )}

        {mode === 'register' && (
          <View style={styles.legalBox}>
            <CheckRow
              checked={acceptTerms}
              onPress={() => setAcceptTerms(!acceptTerms)}
              text={isIt ? "Accetto i Termini di servizio di AllerTgy." : "I accept the AllerTgy Terms of Service."}
            />
            <CheckRow
              checked={acceptPrivacy}
              onPress={() => setAcceptPrivacy(!acceptPrivacy)}
              text={isIt ? "Ho letto l'Informativa Privacy." : "I have read the Privacy Policy."}
            />
            {role === 'customer' ? (
              <CheckRow
                checked={acceptHealthData}
                onPress={() => setAcceptHealthData(!acceptHealthData)}
                text={isIt 
                  ? "Acconsento al trattamento dei dati su allergie, intolleranze e preferenze alimentari per personalizzare il menù." 
                  : "I consent to the processing of data on allergies, intolerances and dietary preferences to customize the menu."}
              />
            ) : (
              <CheckRow
                checked={acceptOwnerResponsibility}
                onPress={() => setAcceptOwnerResponsibility(!acceptOwnerResponsibility)}
                text={isIt 
                  ? "Dichiaro di essere autorizzato a gestire il locale e di pubblicare informazioni allergeni verificate." 
                  : "I declare that I am authorized to manage the venue and to publish verified allergen info."}
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
                {mode === 'login' ? t('login_btn') : mode === 'forgot' ? t('forgot_btn') : t('register_btn')}
              </Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setForgotSent(false); }}
        >
          <Text style={styles.switch}>
            {mode === 'login' ? t('no_account_prompt')
              : mode === 'forgot' ? t('back_to_login_link')
              : t('have_account_prompt')}
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
  container: { flexGrow: 1, padding: 24, paddingTop: 24, paddingBottom: 32 },
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
  allergenSection: { gap: 10, marginTop: 12, marginBottom: 16 },
  allergenSectionTitle: { fontSize: 16, fontWeight: '800', color: '#10201B' },
  allergenSectionSubtitle: { fontSize: 12.5, color: '#596B63', lineHeight: 18, marginBottom: 6 },
  allergenSubsectionTitle: { fontSize: 13, fontWeight: '700', color: '#0B5D4D', marginTop: 10, marginBottom: 6 },
  allergenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  allergenChip: {
    borderWidth: 1.5, borderColor: '#DDE8E2', backgroundColor: '#ffffff',
    borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12,
  },
  chipOnAllergy: { borderColor: '#fca5a5', backgroundColor: '#fff5f5' },
  chipTextOnAllergy: { color: '#e11d48', fontWeight: '800' },
  chipOnDiet: { borderColor: '#86efac', backgroundColor: '#f0fdf4' },
  chipTextOnDiet: { color: '#16a34a', fontWeight: '800' },
  allergenChipText: { color: '#596B63', fontSize: 12.5, fontWeight: '600' },
});
