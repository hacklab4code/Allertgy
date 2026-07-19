import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { GlassIconButton } from './ui/GlassIconButton';

function openEmergency() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  router.push('/emergency');
}

export default function SosHeaderButton() {
  return (
    <GlassIconButton
      icon="medkit-outline"
      danger
      onPress={openEmergency}
      accessibilityLabel="SOS emergenza"
      accessibilityHint="Apre la schermata di emergenza con allergie e contatti"
    />
  );
}
