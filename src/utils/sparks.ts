import { CompanionSparkRecord } from '../types';

export const SPARK_LEVELS = {
  spark: {
    label: '初燃火苗',
    icon: '✨',
    minDays: 1,
    desc: '初次相遇，点燃共同学习的火花',
    color: 'text-amber-500',
    bg: 'bg-amber-50 border-amber-200',
  },
  flame: {
    label: '连环火花',
    icon: '🔥',
    minDays: 4,
    desc: '连续数日默契互动，火花熊熊燃烧',
    color: 'text-orange-500',
    bg: 'bg-orange-50 border-orange-200',
  },
  super_flame: {
    label: '炽热烈焰',
    icon: '💥',
    minDays: 14,
    desc: '深厚长情的语伴羁绊，成为彼此的习惯',
    color: 'text-rose-500',
    bg: 'bg-rose-50 border-rose-200',
  },
  legendary: {
    label: '永恒誓约',
    icon: '👑',
    minDays: 30,
    desc: '最高默契等级！爱豆独家专属珍藏印记',
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
  },
};

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function computeSparkLevel(streakDays: number): 'spark' | 'flame' | 'super_flame' | 'legendary' {
  if (streakDays >= 30) return 'legendary';
  if (streakDays >= 14) return 'super_flame';
  if (streakDays >= 4) return 'flame';
  return 'spark';
}

export function getInitialSparkRecord(companionId: string, initialStreak: number = 3): CompanionSparkRecord {
  return {
    companionId,
    streakDays: initialStreak,
    lastInteractionDate: getYesterdayDateString(),
    totalInteractions: initialStreak * 5,
    sparkLevel: computeSparkLevel(initialStreak),
    isIgnitedToday: false,
  };
}

export function loadAllSparks(companionIds: string[]): Record<string, CompanionSparkRecord> {
  try {
    const saved = localStorage.getItem('korean_companion_sparks');
    const parsed: Record<string, CompanionSparkRecord> = saved ? JSON.parse(saved) : {};
    const today = getTodayDateString();

    const result: Record<string, CompanionSparkRecord> = {};
    for (const id of companionIds) {
      if (parsed[id]) {
        const item = parsed[id];
        const isIgnitedToday = item.lastInteractionDate === today;
        result[id] = {
          ...item,
          isIgnitedToday,
          sparkLevel: computeSparkLevel(item.streakDays),
        };
      } else {
        result[id] = getInitialSparkRecord(id, 3);
      }
    }
    return result;
  } catch (e) {
    console.error('Error loading sparks:', e);
    const result: Record<string, CompanionSparkRecord> = {};
    for (const id of companionIds) {
      result[id] = getInitialSparkRecord(id, 3);
    }
    return result;
  }
}

export function recordCompanionInteraction(
  prevRecord: CompanionSparkRecord | undefined,
  companionId: string
): { updatedRecord: CompanionSparkRecord; isNewStreakDay: boolean } {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  if (!prevRecord) {
    const newRecord: CompanionSparkRecord = {
      companionId,
      streakDays: 1,
      lastInteractionDate: today,
      totalInteractions: 1,
      sparkLevel: 'spark',
      isIgnitedToday: true,
    };
    return { updatedRecord: newRecord, isNewStreakDay: true };
  }

  const alreadyToday = prevRecord.lastInteractionDate === today;
  if (alreadyToday) {
    const updated: CompanionSparkRecord = {
      ...prevRecord,
      totalInteractions: prevRecord.totalInteractions + 1,
      isIgnitedToday: true,
    };
    return { updatedRecord: updated, isNewStreakDay: false };
  }

  // If last interaction was yesterday, streak increments!
  const isConsecutive = prevRecord.lastInteractionDate === yesterday;
  const newStreak = isConsecutive ? prevRecord.streakDays + 1 : 1;

  const updated: CompanionSparkRecord = {
    ...prevRecord,
    streakDays: newStreak,
    lastInteractionDate: today,
    totalInteractions: prevRecord.totalInteractions + 1,
    sparkLevel: computeSparkLevel(newStreak),
    isIgnitedToday: true,
  };

  return { updatedRecord: updated, isNewStreakDay: true };
}
