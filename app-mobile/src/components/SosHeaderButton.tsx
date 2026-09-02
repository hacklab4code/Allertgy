import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WIREFRAME_MODE } from '../theme';
import { AppText } from './ui/AppText';

const HIT = 52;

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
      <MaterialCommunityIcons name="alarm-light-outline" size={24} color="#EF4444" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sosCircleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1.2,
    borderColor: 'rgba(239, 68, 68, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
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


