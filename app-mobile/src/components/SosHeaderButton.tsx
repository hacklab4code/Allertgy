import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { WIREFRAME_MODE } from '../theme';
import { AppText } from './ui/AppText';

const HIT = 42;

function openEmergency() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  router.push('/emergency');
}

/** Tasto SOS circolare coordinato — identico in tutte le sezioni dell'app. */
export default function SosHeaderButton() {
  if (WIREFRAME_MODE) {
    return (
      <Pressable
        onPress={openEmergency}
        accessibilityRole="button"
        accessibilityLabel="SOS emergenza"
        style={styles.sosCircleButton}
      >
        <View style={styles.wire}>
          <AppText variant="caption">SOS</AppText>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={openEmergency}
      accessibilityRole="button"
      accessibilityLabel="SOS Emergenza"
      accessibilityHint="Apre la schermata di emergenza con allergie e contatti"
      style={({ pressed }) => [
        styles.sosCircleButton,
        pressed && styles.buttonPressed,
      ]}
      hitSlop={8}
    >
      <Image
        source={require('../../assets/header_sos.png')}
        style={styles.sosIconImage}
        resizeMode="contain"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sosCircleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  sosIconImage: {
    width: 36,
    height: 36,
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  wire: {
    width: HIT,
    height: HIT,
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});


