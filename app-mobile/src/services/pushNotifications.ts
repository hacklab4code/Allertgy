import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { AppState } from 'react-native';
import { registraPushToken } from './geofencing';

type PushData = Record<string, unknown>;

function routeFromPush(data: PushData | undefined) {
  if (!data) return;

  const type = data.type as string | undefined;
  const publicCode = (data.public_code as string | undefined)?.trim();
  const token = (data.token as string | undefined)?.trim();

  if (type === 'profile_share' && token) {
    router.push(`/shared-profile/${token}`);
    return;
  }
  if (publicCode && publicCode.length >= 4) {
    router.push(`/menu/${publicCode}`);
    return;
  }
  router.push('/notifiche');
}

export function initPushNotifications() {
  const subResponse = Notifications.addNotificationResponseReceivedListener((response) => {
    routeFromPush(response.notification.request.content.data as PushData);
  });

  Notifications.getLastNotificationResponseAsync().then((last) => {
    if (last) routeFromPush(last.notification.request.content.data as PushData);
  }).catch(() => {});

  const subAppState = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      registraPushToken().catch(() => {});
    }
  });

  return () => {
    subResponse.remove();
    subAppState.remove();
  };
}
