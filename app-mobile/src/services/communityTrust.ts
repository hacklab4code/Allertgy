import AsyncStorage from '@react-native-async-storage/async-storage';

const TRUST_POINTS_KEY = 'allertgy-community-trust-points';

export interface TrustProfile {
  points: number;
  level: number;
  title: string;
  badgeEmoji: string;
  badgeColor: string;
  verifiedCount: number;
  reportedCount: number;
  reviewsCount: number;
  nextLevelPoints: number;
  progressPercent: number;
}

export function calculateTrustLevel(points: number, isIt: boolean = true): {
  level: number;
  title: string;
  badgeEmoji: string;
  badgeColor: string;
  nextLevelPoints: number;
  progressPercent: number;
} {
  if (points >= 350) {
    return {
      level: 4,
      title: isIt ? 'Cavaliere della Sicurezza' : 'Safety Guardian',
      badgeEmoji: '🛡️',
      badgeColor: '#7C3AED',
      nextLevelPoints: 500,
      progressPercent: 100,
    };
  }
  if (points >= 150) {
    const prog = Math.min(100, Math.round(((points - 150) / 200) * 100));
    return {
      level: 3,
      title: isIt ? 'Verificatore Esperto' : 'Expert Verifier',
      badgeEmoji: '⭐',
      badgeColor: '#2563EB',
      nextLevelPoints: 350,
      progressPercent: prog,
    };
  }
  if (points >= 50) {
    const prog = Math.min(100, Math.round(((points - 50) / 100) * 100));
    return {
      level: 2,
      title: isIt ? 'Custode della Community' : 'Community Guardian',
      badgeEmoji: '🌱',
      badgeColor: '#059669',
      nextLevelPoints: 150,
      progressPercent: prog,
    };
  }
  const prog = Math.min(100, Math.round((points / 50) * 100));
  return {
    level: 1,
    title: isIt ? 'Esploratore Sicuro' : 'Safe Explorer',
    badgeEmoji: '🔍',
    badgeColor: '#D97706',
    nextLevelPoints: 50,
    progressPercent: prog,
  };
}

export async function loadTrustProfile(isIt: boolean = true): Promise<TrustProfile> {
  try {
    const stored = await AsyncStorage.getItem(TRUST_POINTS_KEY);
    const data = stored ? JSON.parse(stored) : { points: 65, verified: 4, reported: 1, reviews: 2 };
    const levelInfo = calculateTrustLevel(data.points, isIt);

    return {
      points: data.points,
      level: levelInfo.level,
      title: levelInfo.title,
      badgeEmoji: levelInfo.badgeEmoji,
      badgeColor: levelInfo.badgeColor,
      verifiedCount: data.verified || 0,
      reportedCount: data.reported || 0,
      reviewsCount: data.reviews || 0,
      nextLevelPoints: levelInfo.nextLevelPoints,
      progressPercent: levelInfo.progressPercent,
    };
  } catch {
    const levelInfo = calculateTrustLevel(0, isIt);
    return {
      points: 0,
      level: levelInfo.level,
      title: levelInfo.title,
      badgeEmoji: levelInfo.badgeEmoji,
      badgeColor: levelInfo.badgeColor,
      verifiedCount: 0,
      reportedCount: 0,
      reviewsCount: 0,
      nextLevelPoints: 50,
      progressPercent: 0,
    };
  }
}

export async function addTrustPoints(
  amount: number,
  type: 'verify' | 'report' | 'review'
): Promise<TrustProfile> {
  const current = await loadTrustProfile();
  const newPoints = current.points + amount;
  const verified = type === 'verify' ? current.verifiedCount + 1 : current.verifiedCount;
  const reported = type === 'report' ? current.reportedCount + 1 : current.reportedCount;
  const reviews = type === 'review' ? current.reviewsCount + 1 : current.reviewsCount;

  const dataToSave = {
    points: newPoints,
    verified,
    reported,
    reviews,
  };

  await AsyncStorage.setItem(TRUST_POINTS_KEY, JSON.stringify(dataToSave));
  return loadTrustProfile();
}
