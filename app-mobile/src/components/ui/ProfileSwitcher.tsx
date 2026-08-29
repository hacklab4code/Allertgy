import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, font } from '../../theme';
import { AppText } from './AppText';
import { AvatarBubble, avatarForIndex } from './AvatarBubble';

type Profile = {
  id: number;
  name: string;
  relationship?: string;
  allergens?: { code?: string }[];
};

type Props = {
  subProfiles: Profile[];
  activeProfileId: number | null;
  onSelect: (id: number | null) => void;
  isIt?: boolean;
  showManage?: boolean;
  /** Mostra almeno il profilo "Io" anche senza sottoprofili. */
  alwaysShowSelf?: boolean;
  selfAllergenCount?: number;
};

/** Switcher orizzontale profili famiglia con card interattive e badge attivi. */
export function ProfileSwitcher({
  subProfiles,
  activeProfileId,
  onSelect,
  isIt = true,
  showManage = true,
  alwaysShowSelf = false,
  selfAllergenCount = 0,
}: Props) {
  if (!alwaysShowSelf && subProfiles.length === 0) return null;

  const self = avatarForIndex(0);
  const isSelfActive = activeProfileId === null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {/* Profilo "Io" */}
      <Pressable
        style={({ pressed }) => [
          styles.cardItem,
          isSelfActive && styles.cardItemActive,
          pressed && styles.pressedState,
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSelect(null);
        }}
      >
        <AvatarBubble
          emoji={self.emoji}
          color={self.color}
          active={isSelfActive}
          showCheckmark={isSelfActive}
          glow={isSelfActive}
          size={50}
        />
        <View style={styles.textContainer}>
          <AppText
            style={[styles.name, isSelfActive && styles.nameActive]}
            numberOfLines={1}
          >
            {isIt ? 'Io' : 'Me'}
          </AppText>
          {selfAllergenCount > 0 ? (
            <View style={styles.allergyBadge}>
              <AppText style={styles.allergyBadgeText}>
                🛡️ {selfAllergenCount}
              </AppText>
            </View>
          ) : (
            <AppText style={styles.subText}>
              {isIt ? 'Principale' : 'Primary'}
            </AppText>
          )}
        </View>
      </Pressable>

      {/* Sottoprofili */}
      {subProfiles.filter((p) => p.relationship !== 'io').map((p, i) => {
        const av = avatarForIndex(i + 1);
        const active = activeProfileId === p.id;
        const count = p.allergens?.length ?? 0;

        return (
          <Pressable
            key={p.id}
            style={({ pressed }) => [
              styles.cardItem,
              active && styles.cardItemActive,
              pressed && styles.pressedState,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onSelect(p.id);
            }}
          >
            <AvatarBubble
              emoji={av.emoji}
              color={av.color}
              active={active}
              showCheckmark={active}
              glow={active}
              size={50}
            />
            <View style={styles.textContainer}>
              <AppText
                style={[styles.name, active && styles.nameActive]}
                numberOfLines={1}
              >
                {p.name}
              </AppText>
              {count > 0 ? (
                <View style={styles.allergyBadge}>
                  <AppText style={styles.allergyBadgeText}>
                    🛡️ {count}
                  </AppText>
                </View>
              ) : (
                <AppText style={styles.subText}>
                  {p.relationship || (isIt ? 'Familiare' : 'Family')}
                </AppText>
              )}
            </View>
          </Pressable>
        );
      })}

      {/* Pulsante Gestisci / Aggiungi */}
      {showManage && (
        <Pressable
          style={({ pressed }) => [styles.addCardItem, pressed && styles.pressedState]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/sub-profiles');
          }}
        >
          <View style={styles.addBubble}>
            <Ionicons name="person-add" size={22} color={colors.brand} />
          </View>
          <AppText style={styles.addName} numberOfLines={1}>
            {isIt ? 'Gestisci' : 'Manage'}
          </AppText>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  cardItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 76,
    maxWidth: 96,
    borderRadius: 18,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 6,
  },
  cardItemActive: {
    backgroundColor: colors.brand50,
    borderColor: colors.brand,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  pressedState: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  name: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: colors.onSurface,
    textAlign: 'center',
  },
  nameActive: {
    color: colors.brandDark || colors.brand,
    fontFamily: font.bold,
  },
  subText: {
    fontFamily: font.regular,
    fontSize: 10,
    color: colors.onSurfaceMuted,
    marginTop: 1,
    textAlign: 'center',
  },
  allergyBadge: {
    backgroundColor: colors.greenSoft,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  allergyBadgeText: {
    fontSize: 9.5,
    fontFamily: font.bold,
    color: colors.onGreen || '#065F46',
  },
  addCardItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 76,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    gap: 6,
  },
  addBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addName: {
    fontFamily: font.semibold,
    fontSize: 11.5,
    color: colors.brand,
    textAlign: 'center',
  },
});
