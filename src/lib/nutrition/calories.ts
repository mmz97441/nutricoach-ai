// src/lib/nutrition/calories.ts

import type {
  ActivityLevel,
  GoalType,
  MacroDistribution,
  NutritionNeeds,
  SportType,
  UserProfile,
} from "~/types/nutrition";

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor equation
 * Most accurate formula for modern populations
 */
export function calculateBMR(params: {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: "male" | "female";
}): number {
  const { weightKg, heightCm, age, gender } = params;

  // Mifflin-St Jeor equation
  const baseBMR = 10 * weightKg + 6.25 * heightCm - 5 * age;

  return Math.round(gender === "male" ? baseBMR + 5 : baseBMR - 161);
}

/**
 * Activity level multipliers (Harris-Benedict)
 */
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2, // Little to no exercise
  light: 1.375, // Exercise 1-3 days/week
  moderate: 1.55, // Exercise 3-5 days/week
  active: 1.725, // Exercise 6-7 days/week
  very_active: 1.9, // Intense exercise 2x/day
};

/**
 * Sport-specific adjustments
 */
const SPORT_MULTIPLIERS: Record<string, number> = {
  running: 1.15,
  cycling: 1.15,
  swimming: 1.12,
  weightlifting: 1.1,
  crossfit: 1.12,
  team_sports: 1.12,
  combat: 1.13,
  other: 1.0,
};

/**
 * Calculate Total Daily Energy Expenditure
 */
export function calculateTDEE(params: {
  bmr: number;
  activityLevel: ActivityLevel;
  sportType: SportType;
}): number {
  const { bmr, activityLevel, sportType } = params;

  const activityMultiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  const sportMultiplier = SPORT_MULTIPLIERS[sportType] || 1.0;

  return Math.round(bmr * activityMultiplier * sportMultiplier);
}

/**
 * Adjust calories based on goal
 */
export function adjustForGoal(params: {
  tdee: number;
  goalType: GoalType;
  weeklyRate?: number; // kg per week for weight loss
}): number {
  const { tdee, goalType, weeklyRate } = params;

  switch (goalType) {
    case "weight_loss":
      // 7700 kcal deficit = 1kg loss
      const dailyDeficit = ((weeklyRate || 0.5) * 7700) / 7;
      // Never go below 1200 kcal for safety
      return Math.max(Math.round(tdee - dailyDeficit), 1200);

    case "muscle_gain":
      // 300-500 kcal surplus
      return Math.round(tdee + 300);

    case "performance":
    case "maintenance":
    default:
      return tdee;
  }
}

/**
 * Calculate macro distribution based on sport and goal
 */
export function calculateMacros(params: {
  dailyCalories: number;
  weightKg: number;
  sportType: SportType;
  goalType: GoalType;
}): MacroDistribution {
  const { dailyCalories, weightKg, sportType, goalType } = params;

  // PROTEIN: 1.6-2.2g/kg based on goal
  let proteinPerKg: number;
  if (goalType === "muscle_gain") {
    proteinPerKg = 2.2;
  } else if (goalType === "weight_loss") {
    proteinPerKg = 2.0; // Higher protein to preserve muscle
  } else {
    proteinPerKg = 1.8;
  }

  const proteinG = Math.round(weightKg * proteinPerKg);
  const proteinCal = proteinG * 4;

  // FAT: 20-30% of calories based on sport
  let fatPercent: number;
  if (sportType === "running" || sportType === "cycling") {
    fatPercent = 0.25; // Endurance sports
  } else if (sportType === "weightlifting") {
    fatPercent = 0.3; // Strength sports
  } else {
    fatPercent = 0.25;
  }

  const fatCal = dailyCalories * fatPercent;
  const fatG = Math.round(fatCal / 9);

  // CARBS: Remainder
  const carbsCal = dailyCalories - proteinCal - fatCal;
  const carbsG = Math.round(carbsCal / 4);

  return {
    proteinG,
    carbsG,
    fatG,
    proteinPercent: Math.round((proteinCal / dailyCalories) * 100),
    carbsPercent: Math.round((carbsCal / dailyCalories) * 100),
    fatPercent: Math.round(fatPercent * 100),
  };
}

/**
 * Calculate complete nutrition needs for a user
 */
export function calculateNutritionNeeds(
  profile: UserProfile,
  goalType: GoalType,
  weeklyRate?: number
): NutritionNeeds & MacroDistribution & { bmr: number; tdee: number } {
  const bmr = calculateBMR({
    weightKg: profile.weightKg,
    heightCm: profile.heightCm,
    age: profile.age,
    gender: profile.gender,
  });

  const tdee = calculateTDEE({
    bmr,
    activityLevel: profile.activityLevel,
    sportType: profile.sportType,
  });

  const dailyCalories = adjustForGoal({
    tdee,
    goalType,
    weeklyRate,
  });

  const macros = calculateMacros({
    dailyCalories,
    weightKg: profile.weightKg,
    sportType: profile.sportType,
    goalType,
  });

  return {
    bmr,
    tdee,
    dailyCalories,
    ...macros,
  };
}

/**
 * Safety validation for nutrition plans
 */
export function validateNutritionPlan(plan: {
  dailyCalories: number;
  proteinG: number;
  weightKg: number;
  weeklyWeightChange?: number;
}): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Minimum calories
  if (plan.dailyCalories < 1200) {
    warnings.push("Calories trop faibles (<1200 kcal). Risque pour la santé.");
  }

  // Maximum calories (reasonable)
  if (plan.dailyCalories > 5000) {
    warnings.push("Calories très élevées (>5000 kcal). Vérifier l'objectif.");
  }

  // Protein ratio
  const proteinRatio = plan.proteinG / plan.weightKg;
  if (proteinRatio > 3.0) {
    warnings.push("Protéines excessives (>3g/kg). À ajuster.");
  }
  if (proteinRatio < 1.2) {
    warnings.push("Protéines insuffisantes (<1.2g/kg). À augmenter.");
  }

  // Weight loss rate
  if (plan.weeklyWeightChange && plan.weeklyWeightChange < -1.0) {
    warnings.push(
      "Perte de poids trop rapide (>1kg/semaine). Ralentir pour préserver le muscle."
    );
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

/**
 * Calculate meal nutrition from food items
 */
export function calculateMealNutrition(
  foodItems: { quantity: number; food: { calories: number; proteinG: number; carbsG: number; fatG: number; fiberG?: number } }[]
): NutritionNeeds {
  const totals = {
    dailyCalories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
  };

  foodItems.forEach((item) => {
    const factor = item.quantity / 100; // Values are per 100g
    totals.dailyCalories += item.food.calories * factor;
    totals.proteinG += item.food.proteinG * factor;
    totals.carbsG += item.food.carbsG * factor;
    totals.fatG += item.food.fatG * factor;
    totals.fiberG += (item.food.fiberG || 0) * factor;
  });

  return {
    dailyCalories: Math.round(totals.dailyCalories),
    proteinG: Math.round(totals.proteinG),
    carbsG: Math.round(totals.carbsG),
    fatG: Math.round(totals.fatG),
    fiberG: Math.round(totals.fiberG),
  };
}

/**
 * Get recommended water intake based on weight and activity
 */
export function calculateWaterNeeds(params: {
  weightKg: number;
  activityLevel: ActivityLevel;
  isTrainingDay: boolean;
}): number {
  const { weightKg, activityLevel, isTrainingDay } = params;

  // Base: 30-35ml per kg
  let mlPerKg = 33;

  // Adjust for activity
  if (activityLevel === "active" || activityLevel === "very_active") {
    mlPerKg = 40;
  }

  let waterMl = weightKg * mlPerKg;

  // Add 500ml on training days
  if (isTrainingDay) {
    waterMl += 500;
  }

  return Math.round(waterMl);
}

/**
 * Calculate adherence percentage
 */
export function calculateAdherence(actual: number, target: number): number {
  if (target === 0) return 100;
  const ratio = actual / target;
  // Cap at 100% for protein/fiber (more is ok)
  // For calories, both over and under eating counts
  return Math.min(Math.round(ratio * 100), 100);
}
