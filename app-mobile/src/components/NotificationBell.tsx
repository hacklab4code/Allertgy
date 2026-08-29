import { router } from 'expo-router';
import { useEffect } from 'react';
import { useNotifStore } from '../store/notifications';
import { GlassIconButton } from './ui/GlassIconButton';

/** Campanella liquid glass con badge non lette. */
export default function NotificationBell() {
  const unread = useNotifStore((s) => s.unread);
  const refresh = useNotifStore((s) => s.refresh);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <GlassIconButton
      image={require('../../assets/header_notifiche.png')}
      onPress={() => router.push('/notifiche')}
      accessibilityLabel="Notifiche"
      size={42}
      imageSize={36}
      badge={unread}
    />
  );
}
