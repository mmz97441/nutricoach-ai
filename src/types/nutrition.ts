// src/types/nutrition.ts

export interface NutritionNeeds {
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
}

export interface MacroDistribution {
  proteinG: number;
  carbsG: number;
  fatG: number;
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
}

export interface UserProfile {
  heightCm: number;
  weightKg: number;
  age: number;
  gender: "male" | "female";
  sportType: SportType;
  sportLevel: SportLevel;
  trainingFrequency: number;
  activityLevel: ActivityLevel;
}

export type SportType =
  | "running"
  | "cycling"
  | "weightlifting"
  | "crossfit"
  | "swimming"
  | "team_sports"
  | "combat"
  | "other";

export type SportLevel = "beginner" | "intermediate" | "advanced" | "elite";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type GoalType =
  | "weight_loss"
  | "muscle_gain"
  | "performance"
  | "maintenance";

export interface Goal {
  type: GoalType;
  targetWeightKg?: number;
  targetBodyFat?: number;
  weeklyRate?: number;
  targetDate?: Date;
}

export interface FoodItem {
  foodId: string;
  name: string;
  quantity: number;
  unit: "g" | "ml" | "portion";
}

export interface Meal {
  id: string;
  date: Date;
  mealType: MealType;
  time?: string;
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber?: number;
  notes?: string;
}

export type MealType =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "pre_workout"
  | "post_workout";

export interface DailyMetrics {
  date: Date;
  weightKg?: number;
  bodyFatPercent?: number;
  energyLevel?: number; // 1-10
  hungerLevel?: number; // 1-10
  stressLevel?: number; // 1-10
  sleepQuality?: number; // 1-10
  sleepHours?: number;
  waterMl?: number;
  trainingCompleted: boolean;
  trainingIntensity?: number; // 1-10
  trainingDuration?: number; // minutes
  trainingType?: "cardio" | "strength" | "mixed";
}

export interface DailySummary {
  date: Date;
  meals: Meal[];
  metrics?: DailyMetrics;
  totals: NutritionNeeds;
  targets: NutritionNeeds;
  adherence: {
    calories: number; // percentage
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface Food {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  category?: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
  sodiumMg?: number;
  source: "CIQUAL" | "USDA" | "OpenFoodFacts" | "custom";
  verified: boolean;
}
