import { useMemo } from 'react';
import { avatarForIndex } from '../components/ui/AvatarBubble';
import { useSession } from '../store/session';
import type { AllergyCriterio, AllergyIntensity, SubProfile } from '../types';

type Options = {
  /** Nome del profilo principale (display_name utente) */
  selfName?: string | null;
};

/** Profilo attivo, allergeni e presentazione — unica fonte per home, tab bar, sheet, ecc. */
export function useActiveProfileAllergies(options: Options = {}) {
  const {
    allergie: primaryAllergies,
    allergyIntensities: primaryIntensities,
    allergyCriteria: primaryCriteria,
    subProfiles,
    activeProfileId,
    language,
  } = useSession();

  const isIt = (language || 'it').toLowerCase().startsWith('it');

  const activeProfile = useMemo<SubProfile | null>(() => {
    if (!activeProfileId) return null;
    return subProfiles.find((p) => p.id === activeProfileId) ?? null;
  }, [activeProfileId, subProfiles]);

  const allergie = useMemo(() => {
    if (activeProfile?.allergens?.length) return activeProfile.allergens.map((a) => a.code);
    return primaryAllergies;
  }, [activeProfile, primaryAllergies]);

  const allergyIntensities = useMemo<Record<string, AllergyIntensity>>(() => {
    if (activeProfile?.allergens?.length) {
      const map: Record<string, AllergyIntensity> = {};
      for (const a of activeProfile.allergens) map[a.code] = a.intensity;
      return map;
    }
    return primaryIntensities || {};
  }, [activeProfile, primaryIntensities]);

  const allergyCriteria = useMemo<Record<string, AllergyCriterio>>(() => {
    if (activeProfile?.allergens?.length) {
      const map: Record<string, AllergyCriterio> = {};
      for (const a of activeProfile.allergens) {
        map[a.code] = a.criterio || 'assoluto';
      }
      return map;
    }
    return primaryCriteria || {};
  }, [activeProfile, primaryCriteria]);

  const familyProfiles = useMemo(
    () => subProfiles.filter((p) => p.relationship !== 'io'),
    [subProfiles],
  );

  const activeLabel = activeProfile?.name
    ?? options.selfName?.trim()
    ?? (isIt ? 'Io' : 'Me');

  const avatarIndex = activeProfile
    ? familyProfiles.findIndex((p) => p.id === activeProfile.id) + 1
    : 0;

  const activeAvatar = avatarForIndex(avatarIndex >= 0 ? avatarIndex : 0);

  return {
    activeProfile,
    activeProfileId,
    allergie,
    allergyIntensities,
    allergyCriteria,
    profileLabel: activeProfile?.name ?? null,
    activeLabel,
    activeAvatar,
    isSelf: activeProfileId === null,
    hasAllergie: allergie.length > 0,
    isIt,
  };
}
