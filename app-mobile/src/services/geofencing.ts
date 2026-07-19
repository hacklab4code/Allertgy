import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useSession } from '../store/session';
import { api } from '../api/client';
import { calcolaCompatibilita } from '../engine/compatibility';
import type { RestaurantSummary } from '../types';

const PUSH_TOKEN_STORAGE_KEY = 'allertgy-expo-push-token';

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
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return null;
  }
  const settings = await Notifications.getPermissionsAsync();
  const finalSettings = settings.granted || !settings.canAskAgain
    ? settings
    : await Notifications.requestPermissionsAsync();
  if (!finalSettings.granted) return null;

  try {
    const token = await Notifications.getExpoPushTokenAsync();
    await api.registerDeviceToken(token.data);
    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token.data);
    return token.data;
  } catch (e) {
    console.log('Registrazione push token non disponibile:', e);
    return null;
  }
}

const notificheInviate: Record<string, number> = {};
let watcherSub: Location.LocationSubscription | null = null;

/** Raggio usato da notifiche geofencing e prompt contestuale in Home */
export const VENUE_PROXIMITY_RADIUS_M = 150;

export type ProximityVenue = {
  code: string;
  name: string;
  distanceM: number;
};

export function distanzaMetri(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/** Trova il locale recente più vicino entro il raggio indicato. */
export function trovaLocaleRecenteVicino(
  lat: number,
  lon: number,
  recents: Array<{ code: string; name: string }>,
  coordsByCode: Map<string, { latitude: number; longitude: number }>,
  radiusM = VENUE_PROXIMITY_RADIUS_M,
): ProximityVenue | null {
  let best: ProximityVenue | null = null;

  for (const recent of recents) {
    const coords = coordsByCode.get(recent.code);
    if (!coords) continue;

    const distanceM = distanzaMetri(lat, lon, coords.latitude, coords.longitude);
    if (distanceM > radiusM) continue;

    if (!best || distanceM < best.distanceM) {
      best = { code: recent.code, name: recent.name, distanceM: Math.round(distanceM) };
    }
  }

  return best;
}

function calcolaDistanzaMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return distanzaMetri(lat1, lon1, lat2, lon2);
}

export function fermaGeofencing() {
  if (watcherSub) {
    watcherSub.remove();
    watcherSub = null;
  }
}

export async function avviaGeofencing(restaurants: RestaurantSummary[]) {
  fermaGeofencing();

  try {
    const settings = await Notifications.getPermissionsAsync();
    if (!settings.granted && settings.canAskAgain) {
      await Notifications.requestPermissionsAsync();
    }

    const locPerm = await Location.getForegroundPermissionsAsync();
    if (!locPerm.granted) return;

    watcherSub = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 30000,
      distanceInterval: 50,
    },
    async (location) => {
      const { latitude, longitude } = location.coords;
      const { allergie: primaryAllergies, subProfiles, activeProfileId, ingredientiEsclusi, language } = useSession.getState();
      const isIt = (language || 'it').toLowerCase() === 'it';

      const activeProfile = activeProfileId ? subProfiles.find(p => p.id === activeProfileId) : null;
      const activeAllergies = activeProfile?.allergens?.length
        ? activeProfile.allergens.map(a => a.code)
        : primaryAllergies;
      const targetName = activeProfile ? activeProfile.name : (isIt ? 'il tuo profilo' : 'your profile');

      for (const r of restaurants) {
        if (r.latitude == null || r.longitude == null) continue;

        const dist = calcolaDistanzaMeters(latitude, longitude, r.latitude, r.longitude);

        if (dist <= VENUE_PROXIMITY_RADIUS_M) {
          const key = `${r.public_code}_${activeProfileId || 'self'}`;
          const ora = Date.now();

          if (notificheInviate[key] && ora - notificheInviate[key] < 15 * 60 * 1000) {
            continue;
          }

          const compat = r.piatti.length > 0 ? calcolaCompatibilita(activeAllergies, r.piatti, ingredientiEsclusi) : null;

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
    },
    );
  } catch {
    fermaGeofencing();
  }
}
