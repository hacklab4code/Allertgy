import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SLIDES = [
  {
    photo: 'foto: tavolo al ristorante',
    title: 'Il menu allergeni che si adatta al tuo profilo',
    text: 'Scansiona il QR del locale e scopri subito quali piatti sono idonei per te.',
  },
  {
    photo: 'profilo: allergie e preferenze',
    title: 'Salva le allergie una volta, usale in ogni locale',
    text: 'Il profilo resta collegato al tuo account e può essere modificato quando vuoi.',
  },
  {
    photo: 'menu: semaforo personalizzato',
    title: 'Tre colori per ordinare con chiarezza',
    text: 'Idoneo, attenzione o non idoneo: ogni piatto viene letto sul tuo profilo.',
  }
];

export default function Welcome() {
  const [slide, setSlide] = useState(0);

  const next = () => {
    if (slide < SLIDES.length - 1) {
      setSlide(slide + 1);
    } else {
      router.push('/login');
    }
  };

  const skip = () => {
    router.push('/login');
  };

  const current = SLIDES[slide];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        <Text style={styles.logo}>AllerTgy</Text>
        <View style={styles.center}>
          <View style={styles.photo}>
            <Text style={styles.photoText}>{current.photo}</Text>
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>{current.title}</Text>
            <Text style={styles.text}>{current.text}</Text>
          </View>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === slide ? styles.dotActive : null]}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.btnStart} onPress={next}>
          <Text style={styles.btnStartText}>
            {slide < SLIDES.length - 1 ? 'Inizia' : 'Inizia'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnLogin} onPress={skip}>
          <Text style={styles.btnLoginText}>Ho già un account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAF8' },
  scroll: { 
    flexGrow: 1, 
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 24,
  },
  logo: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0B5D4D',
  },
  center: { flex: 1, justifyContent: 'center', gap: 24 },
  photo: {
    height: 280,
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
    fontSize: 30, 
    fontWeight: '800', 
    color: '#10201B', 
    lineHeight: 35,
  },
  text: { 
    fontSize: 16, 
    color: '#596B63', 
    lineHeight: 24,
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
