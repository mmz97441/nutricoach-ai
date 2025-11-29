// src/server/api/routers/meal.ts

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { mealCreateSchema, mealUpdateSchema, dateRangeSchema } from "~/schemas";
import { calculateMealNutrition } from "~/lib/nutrition/calories";
import type { Food, Meal, NutritionNeeds } from "~/types/nutrition";
import { TRPCError } from "@trpc/server";

// In-memory stores for demo
const meals = new Map<string, Meal>();
const foods = new Map<string, Food>();

// Seed some demo foods
const demoFoods: Food[] = [
  {
    id: "food-1",
    name: "Flocons d'avoine",
    category: "Céréales",
    calories: 367,
    proteinG: 14,
    carbsG: 58,
    fatG: 7,
    fiberG: 10,
    source: "CIQUAL",
    verified: true,
  },
  {
    id: "food-2",
    name: "Blanc de poulet",
    category: "Viandes",
    calories: 165,
    proteinG: 31,
    carbsG: 0,
    fatG: 3.6,
    fiberG: 0,
    source: "CIQUAL",
    verified: true,
  },
  {
    id: "food-3",
    name: "Riz blanc cuit",
    category: "Féculents",
    calories: 130,
    proteinG: 2.7,
    carbsG: 28,
    fatG: 0.3,
    fiberG: 0.4,
    source: "CIQUAL",
    verified: true,
  },
  {
    id: "food-4",
    name: "Brocoli",
    category: "Légumes",
    calories: 34,
    proteinG: 2.8,
    carbsG: 7,
    fatG: 0.4,
    fiberG: 2.6,
    source: "CIQUAL",
    verified: true,
  },
  {
    id: "food-5",
    name: "Œuf entier",
    category: "Œufs",
    calories: 155,
    proteinG: 13,
    carbsG: 1.1,
    fatG: 11,
    fiberG: 0,
    source: "CIQUAL",
    verified: true,
  },
  {
    id: "food-6",
    name: "Banane",
    category: "Fruits",
    calories: 89,
    proteinG: 1.1,
    carbsG: 23,
    fatG: 0.3,
    fiberG: 2.6,
    source: "CIQUAL",
    verified: true,
  },
  {
    id: "food-7",
    name: "Saumon",
    category: "Poissons",
    calories: 208,
    proteinG: 20,
    carbsG: 0,
    fatG: 13,
    fiberG: 0,
    source: "CIQUAL",
    verified: true,
  },
  {
    id: "food-8",
    name: "Pâtes complètes cuites",
    category: "Féculents",
    calories: 124,
    proteinG: 5,
    carbsG: 25,
    fatG: 1,
    fiberG: 4.5,
    source: "CIQUAL",
    verified: true,
  },
  {
    id: "food-9",
    name: "Fromage blanc 0%",
    category: "Produits laitiers",
    calories: 48,
    proteinG: 8,
    carbsG: 4,
    fatG: 0.1,
    fiberG: 0,
    source: "CIQUAL",
    verified: true,
  },
  {
    id: "food-10",
    name: "Amandes",
    category: "Fruits à coque",
    calories: 579,
    proteinG: 21,
    carbsG: 22,
    fatG: 50,
    fiberG: 12,
    source: "CIQUAL",
    verified: true,
  },
];

demoFoods.forEach((food) => foods.set(food.id, food));

export const mealRouter = createTRPCRouter({
  // Create a meal
  create: protectedProcedure
    .input(mealCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Get food data
      const foodItems = input.foods.map((item) => {
        const food = foods.get(item.foodId);
        if (!food) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Food not found: ${item.foodId}`,
          });
        }
        return { ...item, food };
      });

      // Calculate nutrition
      const nutrition = calculateMealNutrition(
        foodItems.map((f) => ({ quantity: f.quantity, food: f.food }))
      );

      const meal: Meal = {
        id: `meal-${Date.now()}`,
        date: input.date,
        mealType: input.mealType,
        time: input.time,
        foods: input.foods.map((f) => ({
          foodId: f.foodId,
          name: foods.get(f.foodId)?.name || "Unknown",
          quantity: f.quantity,
          unit: f.unit,
        })),
        totalCalories: nutrition.dailyCalories,
        totalProtein: nutrition.proteinG,
        totalCarbs: nutrition.carbsG,
        totalFat: nutrition.fatG,
        totalFiber: nutrition.fiberG,
        notes: input.notes,
      };

      meals.set(meal.id, meal);
      return meal;
    }),

  // List meals for date range
  list: protectedProcedure.input(dateRangeSchema).query(({ input }) => {
    const { startDate, endDate } = input;
    const result: Meal[] = [];

    meals.forEach((meal) => {
      const mealDate = new Date(meal.date);
      if (mealDate >= startDate && mealDate <= endDate) {
        result.push(meal);
      }
    });

    return result.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }),

  // Get daily summary
  dailySummary: protectedProcedure
    .input(z.object({ date: z.date() }))
    .query(({ input }) => {
      const { date } = input;
      const dayMeals: Meal[] = [];

      meals.forEach((meal) => {
        const mealDate = new Date(meal.date);
        if (
          mealDate.toDateString() === date.toDateString()
        ) {
          dayMeals.push(meal);
        }
      });

      const totals: NutritionNeeds = {
        dailyCalories: dayMeals.reduce((sum, m) => sum + m.totalCalories, 0),
        proteinG: dayMeals.reduce((sum, m) => sum + m.totalProtein, 0),
        carbsG: dayMeals.reduce((sum, m) => sum + m.totalCarbs, 0),
        fatG: dayMeals.reduce((sum, m) => sum + m.totalFat, 0),
        fiberG: dayMeals.reduce((sum, m) => sum + (m.totalFiber || 0), 0),
      };

      return {
        date,
        meals: dayMeals,
        totals,
        mealCount: dayMeals.length,
      };
    }),

  // Update meal
  update: protectedProcedure
    .input(mealUpdateSchema)
    .mutation(({ input }) => {
      const meal = meals.get(input.id);
      if (!meal) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (input.foods) {
        const foodItems = input.foods.map((item) => {
          const food = foods.get(item.foodId);
          if (!food) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `Food not found: ${item.foodId}`,
            });
          }
          return { ...item, food };
        });

        const nutrition = calculateMealNutrition(
          foodItems.map((f) => ({ quantity: f.quantity, food: f.food }))
        );

        meal.foods = input.foods.map((f) => ({
          foodId: f.foodId,
          name: foods.get(f.foodId)?.name || "Unknown",
          quantity: f.quantity,
          unit: f.unit,
        }));
        meal.totalCalories = nutrition.dailyCalories;
        meal.totalProtein = nutrition.proteinG;
        meal.totalCarbs = nutrition.carbsG;
        meal.totalFat = nutrition.fatG;
        meal.totalFiber = nutrition.fiberG;
      }

      if (input.notes !== undefined) {
        meal.notes = input.notes;
      }

      meals.set(meal.id, meal);
      return meal;
    }),

  // Delete meal
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const meal = meals.get(input.id);
      if (!meal) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      meals.delete(input.id);
      return { success: true };
    }),
});

export const foodRouter = createTRPCRouter({
  // Search foods
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(2),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(({ input }) => {
      const { query, limit } = input;
      const results: Food[] = [];

      foods.forEach((food) => {
        if (food.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(food);
        }
      });

      return results.slice(0, limit);
    }),

  // Get food by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const food = foods.get(input.id);
      if (!food) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return food;
    }),

  // Get all foods (for demo)
  getAll: protectedProcedure.query(() => {
    return Array.from(foods.values());
  }),
});
