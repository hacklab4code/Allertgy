import React, { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { api } from '../../api/client';
import { useSession } from '../../store/session';
import type { SubProfile, SubProfileAllergen } from '../../types';
import { colors, radius, spacing, font } from '../../theme';
import { AppText } from './AppText';
import { AvatarBubble, avatarForIndex } from './AvatarBubble';
import { ProfileSwitcher } from './ProfileSwitcher';
import { GlassCard } from './GlassCard';
import { SurfaceButton } from './SurfaceButton';
import { Section } from './Section';

type Props = {
  subProfiles: SubProfile[];
  activeProfileId: number | null;
  onSelect: (id: number | null) => void;
  /** Allergeni del profilo attualmente selezionato */
  activeAllergens: SubProfileAllergen[];
  /** Nome mostrato per il profilo principale (Io) */
  selfName: string;
  isIt?: boolean;
};

const RELATION_LABELS_IT: Record<string, string> = {
  io: 'Profilo principale',
  figlio: 'Figlio/a',
  coniuge: 'Coniuge / Partner',
  genitore: 'Genitore',
  amico: 'Amico/a',
  altro: 'Altro',
};

const RELATION_LABELS_EN: Record<string, string> = {
  io: 'Primary profile',
  figlio: 'Child',
  coniuge: 'Spouse / Partner',
  genitore: 'Parent',
  amico: 'Friend',
  altro: 'Other',
};

function intensityStyle(intensity: string) {
  if (intensity === 'lieve') return styles.chipLieve;
  if (intensity === 'grave') return styles.chipGrave;
  return styles.chipModerata;
}

/** Sezione profilo attivo: switcher + scheda dettaglio + azioni modifica/elimina. */
export function ActiveProfileSection({
  subProfiles,
  activeProfileId,
  onSelect,
  activeAllergens,
  selfName,
  isIt = true,
}: Props) {
  const { setSubProfiles, setActiveProfileId, profilePhotoUrl } = useSession();
  const labels = isIt ? RELATION_LABELS_IT : RELATION_LABELS_EN;

  const familyProfiles = useMemo(
    () => subProfiles.filter((p) => p.relationship !== 'io'),
    [subProfiles],
  );

  const activeFamily = useMemo(
    () => (activeProfileId ? subProfiles.find((p) => p.id === activeProfileId) ?? null : null),
    [activeProfileId, subProfiles],
  );

  const isSelf = activeProfileId === null;
  const displayName = isSelf ? selfName : (activeFamily?.name ?? selfName);
  const relationLabel = isSelf
    ? labels.io
    : (labels[activeFamily?.relationship ?? 'altro'] ?? activeFamily?.relationship ?? '');

  const avatarIndex = isSelf ? 0 : familyProfiles.findIndex((p) => p.id === activeProfileId) + 1;
  const avatar = avatarForIndex(avatarIndex >= 0 ? avatarIndex : 1);
  const hasAllergens = activeAllergens.length > 0;

  const t = {
    title: isIt ? 'Profilo attivo' : 'Active profile',
    subtitle: isIt
      ? 'Scegli chi stai proteggendo e gestisci allergie e profili famiglia.'
      : 'Choose who you are protecting and manage allergies and family profiles.',
    manageAll: isIt ? 'Gestisci tutti' : 'Manage all',
    editAllergies: isIt ? 'Allergie' : 'Allergies',
    editProfile: isIt ? 'Modifica profilo' : 'Edit profile',
    deleteProfile: isIt ? 'Elimina' : 'Delete',
    addPerson: isIt ? 'Aggiungi persona' : 'Add person',
    noAllergens: isIt ? 'Nessun allergene impostato' : 'No allergens set',
    trafficFor: isIt ? 'Semaforo calcolato per' : 'Traffic light for',
    deleteTitle: isIt ? 'Elimina profilo' : 'Delete profile',
    deleteBody: (name: string) =>
      isIt
        ? `Vuoi eliminare il profilo di ${name}? L'azione non si può annullare.`
        : `Delete ${name}'s profile? This cannot be undone.`,
    cancel: isIt ? 'Annulla' : 'Cancel',
    primaryBlock: isIt
      ? 'Non puoi eliminare il profilo principale.'
      : 'You cannot delete your primary profile.',
    error: isIt ? 'Errore' : 'Error',
  };

  const openAllergies = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSelf) {
      router.push('/allergie');
    } else if (activeFamily) {
      router.push(`/sub-profiles?edit=${activeFamily.id}`);
    }
  };

  const openEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSelf) {
      router.push('/allergie');
    } else if (activeFamily) {
      router.push(`/sub-profiles?edit=${activeFamily.id}`);
    }
  };

  const confirmDelete = () => {
    if (!activeFamily) return;
    if (activeFamily.relationship === 'io') {
      Alert.alert(t.error, t.primaryBlock);
      return;
    }
    Alert.alert(t.deleteTitle, t.deleteBody(activeFamily.name), [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.deleteProfile,
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteSubProfile(activeFamily.id);
            setSubProfiles(subProfiles.filter((p) => p.id !== activeFamily.id));
            setActiveProfileId(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {
            Alert.alert(t.error, (e as Error).message);
          }
        },
      },
    ]);
  };

  return (
    <Section
      title={t.title}
      subtitle={t.subtitle}
      action={(
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/sub-profiles');
          }}
          hitSlop={8}
        >
          <AppText variant="bodyBold" color={colors.brand}>{t.manageAll}</AppText>
        </Pressable>
      )}
    >
      <ProfileSwitcher
        subProfiles={familyProfiles}
        activeProfileId={activeProfileId}
        onSelect={onSelect}
        isIt={isIt}
        showManage={false}
        alwaysShowSelf
      />

      <GlassCard
        style={{
          borderLeftWidth: 3,
          borderLeftColor: hasAllergens ? colors.brand : colors.border,
        }}
      >
        <View style={styles.cardHead}>
          <AvatarBubble
            imageUrl={isSelf ? profilePhotoUrl : (activeFamily?.photo_uri || activeFamily?.image_url)}
            emoji={avatar.emoji}
            color={avatar.color}
            active
            size={56}
          />
          <View style={styles.cardMeta}>
            <AppText variant="title">{displayName}</AppText>
            <View style={styles.relationPill}>
              <Ionicons name="person-outline" size={12} color={colors.brand} />
              <AppText variant="caption" color={colors.brand}>{relationLabel}</AppText>
            </View>
          </View>
        </View>

        <AppText variant="caption" style={styles.trafficHint}>
          {t.trafficFor}{' '}
          <AppText variant="caption" style={styles.trafficName}>{displayName}</AppText>
        </AppText>

        <View style={styles.chipsWrap}>
          {hasAllergens ? (
            activeAllergens.map((a) => (
              <View key={a.code} style={[styles.chip, intensityStyle(a.intensity)]}>
                <AppText variant="caption">
                  {a.emoji} {a.name_it}
                  {a.intensity ? ` · ${a.intensity}` : ''}
                  {a.criterio && a.criterio !== 'assoluto' ? ` · ${a.criterio}` : ''}
                </AppText>
              </View>
            ))
          ) : (
            <AppText variant="caption" color={colors.onSurfaceMuted}>{t.noAllergens}</AppText>
          )}
        </View>

        <View style={styles.actions}>
          <SurfaceButton
            label={t.editAllergies}
            onPress={openAllergies}
            variant="soft"
            icon="shield-checkmark-outline"
            fullWidth={false}
            style={styles.actionBtn}
          />
          {!isSelf && (
            <>
              <SurfaceButton
                label={t.editProfile}
                onPress={openEdit}
                variant="secondary"
                icon="create-outline"
                fullWidth={false}
                style={styles.actionBtn}
              />
              <SurfaceButton
                label={t.deleteProfile}
                onPress={confirmDelete}
                variant="danger"
                icon="trash-outline"
                fullWidth={false}
                style={styles.actionBtn}
              />
            </>
          )}
          {isSelf && (
            <SurfaceButton
              label={t.editProfile}
              onPress={openEdit}
              variant="secondary"
              icon="create-outline"
              fullWidth={false}
              style={styles.actionBtn}
            />
          )}
        </View>
      </GlassCard>

      <Pressable
        style={styles.addRow}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/sub-profiles?add=1');
        }}
      >
        <View style={styles.addIcon}>
          <Ionicons name="add-outline" size={20} color={colors.brand} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyBold" color={colors.brand}>{t.addPerson}</AppText>
          <AppText variant="caption">
            {isIt
              ? 'Figli, partner o altri familiari con allergie separate'
              : 'Children, partners or others with separate allergies'}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceMuted} />
      </Pressable>
    </Section>
  );
}

const styles = StyleSheet.create({
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  cardMeta: { flex: 1, gap: 4 },
  relationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.brand50,
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  trafficHint: { marginBottom: spacing.sm },
  trafficName: { fontFamily: font.bold, color: colors.brand },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
  },
  chip: {
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  chipLieve: { backgroundColor: '#FEFCE8', borderColor: '#FACC15' },
  chipModerata: { backgroundColor: '#FFF7ED', borderColor: '#FB923C' },
  chipGrave: { backgroundColor: '#FEF2F2', borderColor: '#F87171' },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionBtn: { minWidth: 110 },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
