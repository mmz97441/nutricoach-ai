// src/schemas/index.ts

import { z } from "zod";

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Minimum 8 caractères"),
});

export const registerSchema = z
  .object({
    email: z.string().email("Email invalide"),
    password: z.string().min(8, "Minimum 8 caractères"),
    confirmPassword: z.string(),
    firstName: z.string().min(2, "Minimum 2 caractères").optional(),
    lastName: z.string().min(2, "Minimum 2 caractères").optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

// Profile schemas
export const profileSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  birthDate: z.date().optional(),
  gender: z.enum(["male", "female"]).optional(),
  heightCm: z.number().min(100).max(250),
  weightKg: z.number().min(30).max(300),
  bodyFatPercent: z.number().min(3).max(60).optional(),
  sportType: z.enum([
    "running",
    "cycling",
    "weightlifting",
    "crossfit",
    "swimming",
    "team_sports",
    "combat",
    "other",
  ]),
  sportLevel: z.enum(["beginner", "intermediate", "advanced", "elite"]),
  trainingFrequency: z.number().min(0).max(14),
  activityLevel: z.enum([
    "sedentary",
    "light",
    "moderate",
    "active",
    "very_active",
  ]),
  allergies: z.array(z.string()).default([]),
  intolerances: z.array(z.string()).default([]),
  medicalConditions: z.array(z.string()).default([]),
  dietaryRestrictions: z.array(z.string()).default([]),
  mealBudget: z.number().min(0).optional(),
  cookingTime: z.number().min(0).max(180).optional(),
});

// Goal schemas
export const goalSchema = z.object({
  type: z.enum(["weight_loss", "muscle_gain", "performance", "maintenance"]),
  targetWeightKg: z.number().min(30).max(300).optional(),
  targetBodyFat: z.number().min(3).max(60).optional(),
  targetDate: z.date().optional(),
  weeklyRate: z.number().min(0.1).max(1.5).optional(),
});

// Food item schema
export const foodItemSchema = z.object({
  foodId: z.string(),
  quantity: z.number().positive(),
  unit: z.enum(["g", "ml", "portion"]),
});

// Meal schemas
export const mealTypeSchema = z.enum([
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "pre_workout",
  "post_workout",
]);

export const mealCreateSchema = z.object({
  date: z.date(),
  mealType: mealTypeSchema,
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional(),
  foods: z.array(foodItemSchema).min(1, "Ajoute au moins un aliment"),
  notes: z.string().max(500).optional(),
});

export const mealUpdateSchema = z.object({
  id: z.string(),
  foods: z.array(foodItemSchema).optional(),
  notes: z.string().max(500).optional(),
});

// Food search schema
export const foodSearchSchema = z.object({
  query: z.string().min(2).max(100),
  category: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
});

// Daily metrics schema
export const dailyMetricsSchema = z.object({
  date: z.date(),
  weightKg: z.number().min(30).max(300).optional(),
  bodyFatPercent: z.number().min(3).max(60).optional(),
  energyLevel: z.number().min(1).max(10).optional(),
  hungerLevel: z.number().min(1).max(10).optional(),
  stressLevel: z.number().min(1).max(10).optional(),
  sleepQuality: z.number().min(1).max(10).optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  waterMl: z.number().min(0).max(10000).optional(),
  trainingCompleted: z.boolean().default(false),
  trainingIntensity: z.number().min(1).max(10).optional(),
  trainingDuration: z.number().min(0).max(480).optional(),
  trainingType: z.enum(["cardio", "strength", "mixed"]).optional(),
  notes: z.string().max(1000).optional(),
});

// AI recommendation feedback schema
export const aiFeedbackSchema = z.object({
  recommendationId: z.string(),
  applied: z.boolean(),
  feedbackScore: z.number().min(1).max(5).optional(),
  feedbackText: z.string().max(500).optional(),
});

// Date range schema (for queries)
export const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type GoalInput = z.infer<typeof goalSchema>;
export type FoodItemInput = z.infer<typeof foodItemSchema>;
export type MealCreateInput = z.infer<typeof mealCreateSchema>;
export type MealUpdateInput = z.infer<typeof mealUpdateSchema>;
export type FoodSearchInput = z.infer<typeof foodSearchSchema>;
export type DailyMetricsInput = z.infer<typeof dailyMetricsSchema>;
export type AIFeedbackInput = z.infer<typeof aiFeedbackSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
