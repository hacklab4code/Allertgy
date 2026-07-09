import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useSession } from '../store/session';
import { api } from '../api/client';
import { calcolaCompatibilita } from '../engine/compatibility';
import type { Menu } from '../types';

// Imposta l'handler per mostrare le notifiche anche ad app aperta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registraPushToken() {
  const settings = await Notifications.getPermissionsAsync();
  const finalSettings = settings.granted || !settings.canAskAgain
    ? settings
    : await Notifications.requestPermissionsAsync();
  if (!finalSettings.granted) return null;

  try {
    const token = await Notifications.getExpoPushTokenAsync();
    await api.registerDeviceToken(token.data);
    return token.data;
  } catch (e) {
    console.log('Registrazione push token non disponibile:', e);
    return null;
  }
}

// Registro temporaneo in memoria per evitare notifiche duplicate nello stesso intervallo (es. 15 minuti)
const notificheInviate: Record<string, number> = {};

function calcolaDistanzaMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Raggio della terra in metri
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metri
}

export async function avviaGeofencing(restaurants: Menu[]) {
  // Richiedi i permessi per le notifiche se non concessi
  const settings = await Notifications.getPermissionsAsync();
  if (!settings.granted && settings.canAskAgain) {
    await Notifications.requestPermissionsAsync();
  }

  // Richiedi i permessi di localizzazione
  const locPerm = await Location.getForegroundPermissionsAsync();
  if (!locPerm.granted) return;

  // Inizia a monitorare la posizione ogni 30 secondi o se ci si sposta di 50 metri
  await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 30000,
      distanceInterval: 50,
    },
    async (location) => {
      const { latitude, longitude } = location.coords;
      const { allergie: primaryAllergies, subProfiles, activeProfileId, ingredientiEsclusi, language } = useSession.getState();
      const isIt = (language || 'it').toLowerCase() === 'it';

      // Risolvi il profilo attivo
      const activeProfile = activeProfileId ? subProfiles.find(p => p.id === activeProfileId) : null;
      const activeAllergies = activeProfile ? activeProfile.allergens.map(a => a.code) : primaryAllergies;
      const targetName = activeProfile ? activeProfile.name : (isIt ? 'il tuo profilo' : 'your profile');

      for (const r of restaurants) {
        if (r.latitude == null || r.longitude == null) continue;

        const dist = calcolaDistanzaMeters(latitude, longitude, r.latitude, r.longitude);

        // Se l'utente si trova entro 150 metri dal locale
        if (dist <= 150) {
          const key = `${r.public_code}_${activeProfileId || 'self'}`;
          const ora = Date.now();

          // Invia una sola notifica ogni 15 minuti per locale/profilo
          if (notificheInviate[key] && ora - notificheInviate[key] < 15 * 60 * 1000) {
            continue;
          }

          // Calcola la compatibilità
          const compat = r.piatti.length > 0 ? calcolaCompatibilita(activeAllergies, r.piatti, ingredientiEsclusi) : null;
          
          // Notifica solo se il ristorante è compatibile (es. percentuale >= 70%)
          if (compat && compat.percentuale >= 70) {
            notificheInviate[key] = ora;
            await Notifications.scheduleNotificationAsync({
              content: {
                title: isIt ? '📍 Ristorante sicuro nelle vicinanze!' : '📍 Safe restaurant nearby!',
                body: isIt
                  ? `Sei vicino a "${r.nome_ristorante}" (${Math.round(dist)}m). È compatibile al ${compat.percentuale}% con ${targetName}.`
                  : `You are near "${r.nome_ristorante}" (${Math.round(dist)}m). It is ${compat.percentuale}% compatible with ${targetName}.`,
                data: { public_code: r.public_code },
              },
              trigger: null,
            });
          }
        }
      }
    }
  );
}
