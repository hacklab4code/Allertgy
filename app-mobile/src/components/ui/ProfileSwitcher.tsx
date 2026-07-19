import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, radius, font, puffyShadow } from '../../theme';
import { AppText } from './AppText';
import { AvatarBubble, avatarForIndex } from './AvatarBubble';

type Profile = { id: number; name: string; relationship?: string };

type Props = {
  subProfiles: Profile[];
  activeProfileId: number | null;
  onSelect: (id: number | null) => void;
  isIt?: boolean;
  showManage?: boolean;
  /** Mostra almeno il profilo "Io" anche senza sottoprofili. */
  alwaysShowSelf?: boolean;
};

/** Switcher orizzontale profili famiglia con avatar bubble. */
export function ProfileSwitcher({
  subProfiles,
  activeProfileId,
  onSelect,
  isIt = true,
  showManage = true,
  alwaysShowSelf = false,
}: Props) {
  if (!alwaysShowSelf && subProfiles.length === 0) return null;

  const self = avatarForIndex(0);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <Pressable
        style={styles.item}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSelect(null);
        }}
      >
        <AvatarBubble emoji={self.emoji} color={self.color} active={activeProfileId === null} size={52} />
        <AppText style={[styles.name, activeProfileId === null && styles.nameActive]}>
          {isIt ? 'Io' : 'Me'}
        </AppText>
      </Pressable>
      {subProfiles.filter((p) => p.relationship !== 'io').map((p, i) => {
        const av = avatarForIndex(i + 1);
        const active = activeProfileId === p.id;
        return (
          <Pressable
            key={p.id}
            style={styles.item}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(p.id);
            }}
          >
            <AvatarBubble emoji={av.emoji} color={av.color} active={active} size={52} />
            <AppText style={[styles.name, active && styles.nameActive]} numberOfLines={1}>
              {p.name}
            </AppText>
          </Pressable>
        );
      })}
      {showManage && (
        <Pressable style={styles.item} onPress={() => router.push('/sub-profiles')}>
          <View style={[styles.addBubble, puffyShadow(4)]}>
            <Ionicons name="add" size={24} color={colors.brand} />
          </View>
          <AppText style={styles.name}>{isIt ? 'Gestisci' : 'Manage'}</AppText>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.md, paddingVertical: spacing.xs, alignItems: 'center' },
  item: { alignItems: 'center', gap: 4, width: 64 },
  name: { fontFamily: font.semibold, fontSize: 11.5, color: colors.onSurface },
  nameActive: { color: colors.brand, fontFamily: font.bold },
  addBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
});
