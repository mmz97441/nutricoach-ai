// src/server/api/routers/user.ts

import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { profileSchema, goalSchema } from "~/schemas";
import {
  calculateNutritionNeeds,
  validateNutritionPlan,
} from "~/lib/nutrition/calories";
import type { GoalType, UserProfile } from "~/types/nutrition";

// In-memory store for demo (replace with Prisma in production)
const users = new Map<string, {
  id: string;
  email: string;
  profile?: UserProfile & { firstName?: string; lastName?: string };
  goal?: { type: GoalType; weeklyRate?: number };
}>();

// Initialize demo user
users.set("demo-user-id", {
  id: "demo-user-id",
  email: "demo@example.com",
});

export const userRouter = createTRPCRouter({
  // Get current user
  me: protectedProcedure.query(({ ctx }) => {
    const user = users.get(ctx.session.user.id);
    return user || null;
  }),

  // Get or create profile
  getProfile: protectedProcedure.query(({ ctx }) => {
    const user = users.get(ctx.session.user.id);
    return user?.profile || null;
  }),

  // Update profile
  updateProfile: protectedProcedure
    .input(profileSchema)
    .mutation(({ ctx, input }) => {
      const user = users.get(ctx.session.user.id);
      if (!user) {
        throw new Error("User not found");
      }

      user.profile = {
        ...input,
        age: input.birthDate
          ? Math.floor(
              (Date.now() - new Date(input.birthDate).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            )
          : 30,
      } as UserProfile & { firstName?: string; lastName?: string };

      users.set(ctx.session.user.id, user);
      return user.profile;
    }),

  // Get goal
  getGoal: protectedProcedure.query(({ ctx }) => {
    const user = users.get(ctx.session.user.id);
    return user?.goal || null;
  }),

  // Set goal
  setGoal: protectedProcedure.input(goalSchema).mutation(({ ctx, input }) => {
    const user = users.get(ctx.session.user.id);
    if (!user) {
      throw new Error("User not found");
    }

    user.goal = input;
    users.set(ctx.session.user.id, user);
    return user.goal;
  }),

  // Calculate nutrition needs
  getNutritionNeeds: protectedProcedure.query(({ ctx }) => {
    const user = users.get(ctx.session.user.id);
    if (!user?.profile || !user?.goal) {
      return null;
    }

    const needs = calculateNutritionNeeds(
      user.profile,
      user.goal.type,
      user.goal.weeklyRate
    );

    const validation = validateNutritionPlan({
      dailyCalories: needs.dailyCalories,
      proteinG: needs.proteinG,
      weightKg: user.profile.weightKg,
      weeklyWeightChange:
        user.goal.type === "weight_loss" ? -(user.goal.weeklyRate || 0.5) : 0,
    });

    return {
      ...needs,
      validation,
    };
  }),

  // Onboarding complete check
  isOnboardingComplete: protectedProcedure.query(({ ctx }) => {
    const user = users.get(ctx.session.user.id);
    return !!(user?.profile && user?.goal);
  }),
});
