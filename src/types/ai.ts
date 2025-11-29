// src/types/ai.ts

export interface AIRecommendation {
  id: string;
  type: RecommendationType;
  recommendation: string;
  reasoning: string;
  actionItems: string[];
  confidence: number; // 0.0 - 1.0
  sources?: string[];
  warnings?: string[];
  createdAt: Date;
}

export type RecommendationType =
  | "daily_tip"
  | "meal_plan"
  | "macro_adjustment"
  | "hydration"
  | "timing"
  | "recovery";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface AIUsage {
  provider: "anthropic" | "openai";
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export interface MealPlanDay {
  date: Date;
  trainingType: "rest" | "cardio" | "strength" | "mixed";
  meals: {
    breakfast: GeneratedMeal;
    lunch: GeneratedMeal;
    dinner: GeneratedMeal;
    snacks: GeneratedMeal[];
  };
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface GeneratedMeal {
  name: string;
  description: string;
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
  }[];
  preparation: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  prepTime: number; // minutes
  cost: number; // euros
}

export interface WeeklyMealPlan {
  id: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  days: MealPlanDay[];
  dailyTargets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}
