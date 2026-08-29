import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { api } from '../../api/client';
import { useSession } from '../../store/session';
import { useProfileSheet } from '../../store/profileSheet';
import { colors, font } from '../../theme';
import { AppText } from './AppText';
import { AvatarBubble, avatarForIndex } from './AvatarBubble';

/** Stessi valori di GlassTabBar — un pezzo solo. */
const H_INSET = 32;
const TAB_BAR_H = 56;
/** Quanto entra sotto la pill per chiudere i bordi arrotondati. */
const SEAM_OVERLAP = 30;
/** Zona avatar + nome sotto. */
const AVATAR_ZONE = 148;
const COLLAPSED_H = SEAM_OVERLAP;
const EXPANDED_H = AVATAR_ZONE + SEAM_OVERLAP;

/** Stesso fill della dock. */
const DOCK = colors.ink;

/**
 * Estensione della tab bar: stesso colore, stessa larghezza, senza gap.
 * Si infila sotto la pill così i bordi restano attaccati.
 */
export function ProfileContextSheet() {
  const insets = useSafeAreaInsets();
  const visible = useProfileSheet((s) => s.visible);
  const close = useProfileSheet((s) => s.close);

  const [mounted, setMounted] = useState(false);

  const expandAnim = useSharedValue(0);
  const panY = useSharedValue(0);

  const {
    token,
    subProfiles,
    setSubProfiles,
    activeProfileId,
    setActiveProfileId,
    language,
  } = useSession();

  useEffect(() => {
    if (visible) {
      setMounted(true);
      panY.value = 0;
      expandAnim.value = withSpring(1, { damping: 24, stiffness: 260, mass: 0.7 });
    } else if (mounted) {
      panY.value = 0;
      expandAnim.value = withTiming(0, { duration: 180 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  useEffect(() => {
    if (visible && token) {
      api.getSubProfiles().then(setSubProfiles).catch(() => {});
    }
  }, [visible, token, setSubProfiles]);

  const handleClose = () => {
    Haptics.selectionAsync().catch(() => {});
    close();
  };

  const selectProfile = (id: number | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setActiveProfileId(id);
  };

  const openWaiterPass = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    close();
    router.push('/allergy-card');
  };

  const isIt = (language || 'it').toLowerCase() === 'it';

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) panY.value = event.translationY;
    })
    .onEnd((event) => {
      if (event.translationY > 48 || event.velocityY > 500) {
        runOnJS(handleClose)();
      } else {
        panY.value = withSpring(0);
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expandAnim.value, [0, 1], [0, 0.32], Extrapolation.CLAMP),
  }));

  const extensionStyle = useAnimatedStyle(() => {
    const clampedPan = Math.max(0, panY.value);
    const height =
      interpolate(expandAnim.value, [0, 1], [COLLAPSED_H, EXPANDED_H], Extrapolation.CLAMP) -
      clampedPan;
    const opacity = interpolate(expandAnim.value, [0, 0.12, 1], [0, 1, 1], Extrapolation.CLAMP);
    return {
      height: Math.max(COLLAPSED_H, height),
      opacity,
    };
  });

  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expandAnim.value, [0, 0.4, 1], [0, 0.35, 1], Extrapolation.CLAMP),
  }));

  if (!mounted) return null;

  const bottomSafe = Math.max(insets.bottom, 10);
  /** Fondo dell’estensione sotto il top della pill → nessun bordo/gap. */
  const dockBottom = bottomSafe + TAB_BAR_H - SEAM_OVERLAP;
  const family = subProfiles.filter((p) => p.relationship !== 'io');
  const selfAvatar = avatarForIndex(0);
  const isSelfActive = activeProfileId === null;

  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFillObject, styles.portal]}>
      <Animated.View
        pointerEvents="box-none"
        style={[styles.backdrop, { bottom: bottomSafe + TAB_BAR_H }, backdropStyle]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.extension,
          { bottom: dockBottom, backgroundColor: DOCK },
          extensionStyle,
        ]}
      >
        <GestureDetector gesture={panGesture}>
          <View style={styles.dragZone}>
            <View style={styles.handle} />
          </View>
        </GestureDetector>

        <Animated.View style={[styles.avatarsWrap, contentStyle]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.avatarsRow}
            bounces={false}
          >
            <Pressable
              onPress={() => selectProfile(null)}
              style={({ pressed }) => [styles.avatarHit, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Io"
            >
              <View style={styles.avatarSlot}>
                {isSelfActive ? <View pointerEvents="none" style={styles.activeRing} /> : null}
                <AvatarBubble
                  emoji={selfAvatar.emoji}
                  color={selfAvatar.color}
                  active={isSelfActive}
                  showCheckmark={isSelfActive}
                  glow={false}
                  size={58}
                />
              </View>
              <AppText
                style={[styles.avatarName, isSelfActive && styles.avatarNameActive]}
                numberOfLines={1}
              >
                Io
              </AppText>
            </Pressable>

            {family.map((p, i) => {
              const av = avatarForIndex(i + 1);
              const active = activeProfileId === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => selectProfile(p.id)}
                  style={({ pressed }) => [styles.avatarHit, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={p.name}
                >
                  <View style={styles.avatarSlot}>
                    {active ? <View pointerEvents="none" style={styles.activeRing} /> : null}
                    <AvatarBubble
                      emoji={av.emoji}
                      color={av.color}
                      active={active}
                      showCheckmark={active}
                      glow={false}
                      size={58}
                    />
                  </View>
                  <AppText
                    style={[styles.avatarName, active && styles.avatarNameActive]}
                    numberOfLines={1}
                  >
                    {p.name}
                  </AppText>
                </Pressable>
              );
            })}

            <Pressable
              onPress={openWaiterPass}
              style={({ pressed }) => [styles.avatarHit, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={isIt ? 'Pass allergeni cameriere' : 'Waiter allergy pass'}
            >
              <View style={styles.avatarSlot}>
                <View style={styles.passBubble}>
                  <Ionicons name="card-outline" size={24} color="rgba(255,255,255,0.88)" />
                </View>
              </View>
              <AppText style={styles.avatarName} numberOfLines={2}>
                {isIt ? 'Pass allergeni' : 'Allergy pass'}
              </AppText>
            </Pressable>
          </ScrollView>
        </Animated.View>

        {/* Cuscino che si infila nella pill — stesso colore, chiude il giunto */}
        <View style={[styles.seam, { height: SEAM_OVERLAP, backgroundColor: DOCK }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  portal: {
    zIndex: 35,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  extension: {
    position: 'absolute',
    left: H_INSET,
    right: H_INSET,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
  },
  dragZone: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
  },
  handle: {
    width: 34,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  avatarsWrap: {
    height: 96,
    justifyContent: 'center',
    paddingBottom: 6,
  },
  avatarsRow: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 16,
    paddingHorizontal: 14,
  },
  avatarHit: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 72,
    gap: 4,
  },
  /** Stessa footprint per tutti — l’anello attivo non alza l’icona. */
  avatarSlot: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  avatarName: {
    fontFamily: font.semibold,
    fontSize: 11.5,
    lineHeight: 14,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    width: '100%',
  },
  avatarNameActive: {
    color: '#FFFFFF',
    fontFamily: font.bold,
  },
  passBubble: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  seam: {
    width: '100%',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
});
