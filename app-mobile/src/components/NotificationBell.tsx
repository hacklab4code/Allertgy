import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNotifStore } from '../store/notifications';
import { useIsDarkMode } from '../hooks/useAppTheme';
import { WIREFRAME_MODE } from '../theme';
import { AppText } from './ui/AppText';

const HIT = 52;

function openNotifications() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  router.push('/notifiche');
}

/** Tasto Notifiche coordinato — identico in tutte le sezioni dell'app. */
export default function NotificationBell() {
  const isDark = useIsDarkMode();
  const unread = useNotifStore((s) => s.unread);
  const refresh = useNotifStore((s) => s.refresh);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (WIREFRAME_MODE) {
    return (
      <Pressable
        onPress={openNotifications}
        accessibilityRole="button"
        accessibilityLabel="Notifiche"
        style={styles.notifButton}
      >
        <View style={styles.wire}>
          <AppText variant="caption">NOTIF</AppText>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={openNotifications}
      accessibilityRole="button"
      accessibilityLabel="Notifiche"
      accessibilityHint="Apre la lista delle notifiche"
      style={({ pressed }) => [
        styles.notifButton,
        isDark && styles.notifButtonDark,
        pressed && styles.buttonPressed,
      ]}
      hitSlop={8}
    >
      <Ionicons
        name="notifications-outline"
        size={22}
        color={isDark ? '#FFFFFF' : '#23212C'}
      />
      {unread > 0 ? (
        <View style={styles.unreadBadge}>
          <AppText style={styles.unreadBadgeText}>
            {unread > 9 ? '9+' : unread}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(35, 33, 44, 0.08)',
    borderWidth: 1.2,
    borderColor: 'rgba(35, 33, 44, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#23212C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  notifButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.30)',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    zIndex: 5,
  },
  unreadBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 11,
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
