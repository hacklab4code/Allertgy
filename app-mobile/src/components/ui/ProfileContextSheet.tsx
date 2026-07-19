import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { api } from '../../api/client';
import { useActiveProfileAllergies } from '../../hooks/useActiveProfileAllergies';
import { useSession } from '../../store/session';
import { useProfileSheet } from '../../store/profileSheet';
import { colors, spacing } from '../../theme';
import { AllergyProfileBanner } from './FlowStates';
import { AppText } from './AppText';
import { AvatarBubble } from './AvatarBubble';
import { AppBottomSheet } from './bottom-sheet';
import { ProfileSwitcher } from './ProfileSwitcher';

/** Sheet globale profilo — tieni premuto sulla tab Profilo per aprirlo. */
export function ProfileContextSheet() {
  const visible = useProfileSheet((s) => s.visible);
  const close = useProfileSheet((s) => s.close);
  const [selfDisplayName, setSelfDisplayName] = useState<string | null>(null);

  const {
    token,
    subProfiles,
    setSubProfiles,
    activeProfileId,
    setActiveProfileId,
  } = useSession();

  const {
    allergie,
    activeLabel,
    activeAvatar,
    isIt,
  } = useActiveProfileAllergies({ selfName: selfDisplayName });

  useEffect(() => {
    if (visible && token) {
      api.getSubProfiles().then(setSubProfiles).catch(() => {});
      api.getProfile()
        .then((profile) => setSelfDisplayName(profile.display_name?.trim() || null))
        .catch(() => {});
    }
  }, [visible, token, setSubProfiles]);

  const goAccount = () => {
    close();
    router.push('/(tabs)/account');
  };

  return (
    <AppBottomSheet
      index={visible ? 0 : -1}
      snapPoints={['48%', '72%']}
      onClose={close}
      contentClassName="gap-3"
    >
      <View style={styles.head}>
        <AvatarBubble
          emoji={activeAvatar.emoji}
          color={activeAvatar.color}
          active
          size={44}
        />
        <View style={{ flex: 1 }}>
          <AppText variant="caption" color={colors.onSurfaceMuted}>
            {isIt ? 'Stai visualizzando per' : 'Viewing as'}
          </AppText>
          <AppText variant="title">{activeLabel}</AppText>
        </View>
        <Pressable onPress={close} hitSlop={12} style={styles.closeBtn}>
          <AppText variant="bodyBold">✕</AppText>
        </Pressable>
      </View>

      <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.hint}>
        {isIt
          ? 'Il profilo attivo aggiorna semaforo e filtri. Tieni premuto la tab Profilo per cambiarlo.'
          : 'Active profile updates traffic light and filters. Long-press the Profile tab to switch.'}
      </AppText>

      {token ? (
        <ProfileSwitcher
          subProfiles={subProfiles}
          activeProfileId={activeProfileId}
          onSelect={(id) => {
            setActiveProfileId(id);
          }}
          isIt={isIt}
          alwaysShowSelf
        />
      ) : null}

      <AllergyProfileBanner hasAllergie={allergie.length > 0} isIt={isIt} />

      <Pressable onPress={goAccount} style={styles.accountLink}>
        <AppText variant="bodyBold" color={colors.brand}>
          {isIt ? 'Impostazioni profilo complete ›' : 'Full profile settings ›'}
        </AppText>
      </Pressable>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { lineHeight: 18 },
  accountLink: { paddingVertical: spacing.sm, minHeight: 44, justifyContent: 'center' },
});
