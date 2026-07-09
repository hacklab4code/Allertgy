import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, SafeAreaView } from 'react-native';
import { useSession, type Role } from '../src/store/session';
import LanguageFlagsRow from '../src/components/LanguageFlagsRow';
import { useTranslation } from '../src/constants/translations';

export default function Welcome() {
  const [step, setStep] = useState<'select_role' | 'slides'>('select_role');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [slide, setSlide] = useState(0);
  const { language, setRole } = useSession();
  const { t } = useTranslation();

  const customerSlides = [
    {
      photo: (language || 'it').toLowerCase() === 'it' ? 'foto: tavolo al ristorante' : 'photo: restaurant table',
      title: t('slide_c1_title'),
      text: t('slide_c1_text'),
    },
    {
      photo: (language || 'it').toLowerCase() === 'it' ? 'profilo: allergie e preferenze' : 'profile: allergies & preferences',
      title: t('slide_c2_title'),
      text: t('slide_c2_text'),
    },
    {
      photo: (language || 'it').toLowerCase() === 'it' ? 'menu: semaforo personalizzato' : 'menu: personalized traffic light',
      title: t('slide_c3_title'),
      text: t('slide_c3_text'),
    }
  ];

  const ownerSlides = [
    {
      photo: (language || 'it').toLowerCase() === 'it' ? 'gestione: menu digitale' : 'management: digital menu',
      title: t('slide_o1_title'),
      text: t('slide_o1_text'),
    },
    {
      photo: (language || 'it').toLowerCase() === 'it' ? 'sicurezza: clienti felici' : 'safety: happy customers',
      title: t('slide_o2_title'),
      text: t('slide_o2_text'),
    },
    {
      photo: (language || 'it').toLowerCase() === 'it' ? 'statistiche: area ristoratore' : 'statistics: owner area',
      title: t('slide_o3_title'),
      text: t('slide_o3_text'),
    }
  ];

  const slides = selectedRole === 'owner' ? ownerSlides : customerSlides;

  const next = () => {
    if (slide < slides.length - 1) {
      setSlide(slide + 1);
    } else {
      router.push('/login');
    }
  };

  const skip = () => {
    router.push('/login');
  };

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setRole(role);
  };

  const current = slides[slide];

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ backgroundColor: '#FFFFFF', zIndex: 100 }}>
        <LanguageFlagsRow />
      </SafeAreaView>

      {step === 'select_role' ? (
        <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
          <Text style={styles.logo}>{t('allertgyTitle')}</Text>
          <View style={styles.roleContainer}>
            <View style={styles.headerArea}>
              <Text style={styles.mainTitle}>{t('welcome')}</Text>
              <Text style={styles.subtitle}>{t('welcome_subtitle')}</Text>
            </View>

            <View style={styles.roleCards}>
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  selectedRole === 'customer' && styles.roleCardActive
                ]}
                onPress={() => handleSelectRole('customer')}
              >
                <View style={styles.roleHeader}>
                  <Text style={styles.roleIcon}>🙋</Text>
                  <Text style={[styles.cardTitle, selectedRole === 'customer' && styles.cardTitleActive]}>
                    {t('role_customer')}
                  </Text>
                </View>
                <Text style={styles.cardDesc}>
                  {t('role_customer_desc')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleCard,
                  selectedRole === 'owner' && styles.roleCardActive
                ]}
                onPress={() => handleSelectRole('owner')}
              >
                <View style={styles.roleHeader}>
                  <Text style={styles.roleIcon}>👨‍🍳</Text>
                  <Text style={[styles.cardTitle, selectedRole === 'owner' && styles.cardTitleActive]}>
                    {t('role_owner')}
                  </Text>
                </View>
                <Text style={styles.cardDesc}>
                  {t('role_owner_desc')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
          <Text style={styles.logo}>{t('allertgyTitle')}</Text>
          <View style={styles.center}>
            <View style={styles.photo}>
              <Text style={styles.photoText}>{current.photo}</Text>
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>{current.title}</Text>
              <Text style={styles.text}>{current.text}</Text>
            </View>
            <View style={styles.dots}>
              {slides.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === slide ? styles.dotActive : null]}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {step === 'select_role' ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.btnStart, !selectedRole && styles.btnDisabled]}
            disabled={!selectedRole}
            onPress={() => setStep('slides')}
          >
            <Text style={styles.btnStartText}>{t('continue')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.btnStart} onPress={next}>
            <Text style={styles.btnStartText}>
              {slide < slides.length - 1 ? t('next') : t('start')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnLogin} onPress={skip}>
            <Text style={styles.btnLoginText}>{t('already_have_account')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAF8' },
  scroll: { 
    flexGrow: 1, 
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  logo: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0B5D4D',
  },
  roleContainer: { flex: 1, justifyContent: 'center', gap: 24, marginTop: 24 },
  headerArea: { gap: 8 },
  mainTitle: { fontSize: 32, fontWeight: '900', color: '#0B5D4D', lineHeight: 38 },
  subtitle: { fontSize: 15, color: '#596B63', lineHeight: 22 },
  roleCards: { gap: 16 },
  roleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#DDE8E2',
    shadowColor: '#0B5D4D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  roleCardActive: {
    borderColor: '#0F8A6A',
    backgroundColor: '#F0F9F5',
  },
  roleHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  roleIcon: { fontSize: 24 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#10201B' },
  cardTitleActive: { color: '#0B5D4D' },
  cardDesc: { fontSize: 13, color: '#596B63', lineHeight: 18 },
  center: { flex: 1, justifyContent: 'center', gap: 20, marginTop: 10 },
  photo: {
    height: 240,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDE8E2',
    backgroundColor: '#EEF5F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: {
    fontSize: 12,
    color: '#596B63',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE8E2',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  copy: { gap: 10 },
  title: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#10201B', 
    lineHeight: 30,
  },
  text: { 
    fontSize: 15, 
    color: '#596B63', 
    lineHeight: 22,
  },
  dots: { flexDirection: 'row', gap: 6 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C9D8D0',
  },
  dotActive: {
    width: 20,
    backgroundColor: '#0F8A6A',
  },
  bottomBar: { 
    paddingHorizontal: 24, 
    paddingBottom: 32,
    gap: 10,
  },
  btnStart: { 
    backgroundColor: '#0F8A6A', 
    height: 52,
    borderRadius: 14, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnStartText: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 16 
  },
  btnDisabled: {
    backgroundColor: '#A9C2B5',
  },
  btnLogin: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLoginText: {
    color: '#0B5D4D',
    fontWeight: '600',
    fontSize: 15,
  },
});
