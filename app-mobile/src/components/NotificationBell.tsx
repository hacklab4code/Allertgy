import { router } from 'expo-router';
import { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useNotifStore } from '../store/notifications';
import { colors } from '../theme';

/** Campanella nell'header con badge del numero di notifiche non lette. */
export default function NotificationBell() {
  const unread = useNotifStore((s) => s.unread);
  const refresh = useNotifStore((s) => s.refresh);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <TouchableOpacity
      onPress={() => router.push('/notifiche')}
      style={{ marginRight: 8, padding: 6 }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={{ fontSize: 20 }}>🔔</Text>
      {unread > 0 && (
        <View
          style={{
            position: 'absolute', top: 0, right: 0,
            minWidth: 17, height: 17, borderRadius: 9, paddingHorizontal: 3,
            backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center',
            borderWidth: 1.5, borderColor: colors.white,
          }}
        >
          <Text style={{ color: colors.white, fontSize: 10, fontWeight: '800' }}>
            {unread > 9 ? '9+' : unread}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
