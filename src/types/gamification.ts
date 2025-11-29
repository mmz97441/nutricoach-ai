// src/types/gamification.ts

export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  points: number;
  iconUrl?: string;
  unlockedAt: Date;
}

export type AchievementType =
  | "first_meal"
  | "first_week"
  | "7_day_streak"
  | "30_day_streak"
  | "100_meals"
  | "weight_goal"
  | "protein_champion"
  | "hydration_master"
  | "early_bird"
  | "meal_prep_pro";

export interface Streak {
  type: StreakType;
  currentCount: number;
  longestCount: number;
  lastActivityDate?: Date;
}

export type StreakType =
  | "meal_logging"
  | "training"
  | "hydration"
  | "sleep"
  | "all";

export interface UserStats {
  totalMeals: number;
  totalDaysTracked: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  level: number;
  achievements: Achievement[];
  streaks: Streak[];
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  avatarUrl?: string;
  points: number;
  rank: number;
  streakDays: number;
}

export const ACHIEVEMENT_DEFINITIONS: Record<
  AchievementType,
  { title: string; description: string; points: number }
> = {
  first_meal: {
    title: "Premier pas",
    description: "Tu as enregistré ton premier repas !",
    points: 10,
  },
  first_week: {
    title: "Semaine complète",
    description: "7 jours de suivi consécutifs",
    points: 50,
  },
  "7_day_streak": {
    title: "En forme !",
    description: "7 jours de suite à atteindre tes objectifs",
    points: 100,
  },
  "30_day_streak": {
    title: "Athlète confirmé",
    description: "30 jours consécutifs de suivi",
    points: 500,
  },
  "100_meals": {
    title: "Centurion",
    description: "100 repas enregistrés",
    points: 200,
  },
  weight_goal: {
    title: "Objectif atteint !",
    description: "Tu as atteint ton objectif de poids",
    points: 1000,
  },
  protein_champion: {
    title: "Champion protéiné",
    description: "Objectif protéines atteint 7 jours de suite",
    points: 150,
  },
  hydration_master: {
    title: "Maître hydratation",
    description: "Objectif eau atteint 7 jours de suite",
    points: 100,
  },
  early_bird: {
    title: "Lève-tôt",
    description: "Petit-déjeuner enregistré avant 8h, 7 jours de suite",
    points: 75,
  },
  meal_prep_pro: {
    title: "Meal Prep Pro",
    description: "Premier plan repas généré et suivi",
    points: 100,
  },
};

export function calculateLevel(points: number): number {
  // Chaque niveau nécessite 100 points de plus que le précédent
  // Level 1: 0-100, Level 2: 100-300, Level 3: 300-600, etc.
  let level = 1;
  let threshold = 100;
  let accumulated = 0;

  while (accumulated + threshold <= points) {
    accumulated += threshold;
    level++;
    threshold += 100;
  }

  return level;
}

export function pointsToNextLevel(points: number): {
  current: number;
  needed: number;
  progress: number;
} {
  const level = calculateLevel(points);
  let accumulated = 0;
  let threshold = 100;

  for (let i = 1; i < level; i++) {
    accumulated += threshold;
    threshold += 100;
  }

  const currentLevelPoints = points - accumulated;
  const neededForNext = threshold;

  return {
    current: currentLevelPoints,
    needed: neededForNext,
    progress: (currentLevelPoints / neededForNext) * 100,
  };
}
