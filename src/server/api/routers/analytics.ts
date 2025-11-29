// src/server/api/routers/analytics.ts

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { dateRangeSchema } from "~/schemas";
import type { DailyMetrics } from "~/types/nutrition";

// In-memory store
const dailyMetrics = new Map<string, DailyMetrics>();

export const analyticsRouter = createTRPCRouter({
  // Save daily metrics
  saveDailyMetrics: protectedProcedure
    .input(
      z.object({
        date: z.date(),
        weightKg: z.number().optional(),
        bodyFatPercent: z.number().optional(),
        energyLevel: z.number().min(1).max(10).optional(),
        hungerLevel: z.number().min(1).max(10).optional(),
        stressLevel: z.number().min(1).max(10).optional(),
        sleepQuality: z.number().min(1).max(10).optional(),
        sleepHours: z.number().optional(),
        waterMl: z.number().optional(),
        trainingCompleted: z.boolean().default(false),
        trainingIntensity: z.number().min(1).max(10).optional(),
        trainingDuration: z.number().optional(),
        trainingType: z.enum(["cardio", "strength", "mixed"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const key = `${ctx.session.user.id}-${input.date.toISOString().split("T")[0]}`;
      
      const metrics: DailyMetrics = {
        ...input,
        trainingCompleted: input.trainingCompleted,
      };
      
      dailyMetrics.set(key, metrics);
      return metrics;
    }),

  // Get daily metrics
  getDailyMetrics: protectedProcedure
    .input(z.object({ date: z.date() }))
    .query(({ ctx, input }) => {
      const key = `${ctx.session.user.id}-${input.date.toISOString().split("T")[0]}`;
      return dailyMetrics.get(key) || null;
    }),

  // Get metrics range
  getMetricsRange: protectedProcedure
    .input(dateRangeSchema)
    .query(({ ctx, input }) => {
      const results: DailyMetrics[] = [];
      const userId = ctx.session.user.id;

      dailyMetrics.forEach((metrics, key) => {
        if (key.startsWith(userId)) {
          const metricsDate = new Date(metrics.date);
          if (metricsDate >= input.startDate && metricsDate <= input.endDate) {
            results.push(metrics);
          }
        }
      });

      return results.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    }),

  // Get weight progress
  getWeightProgress: protectedProcedure
    .input(
      z.object({
        days: z.number().min(7).max(365).default(30),
      })
    )
    .query(({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const weights: { date: Date; weight: number }[] = [];

      dailyMetrics.forEach((metrics, key) => {
        if (key.startsWith(userId) && metrics.weightKg) {
          const metricsDate = new Date(metrics.date);
          if (metricsDate >= startDate && metricsDate <= endDate) {
            weights.push({ date: metricsDate, weight: metrics.weightKg });
          }
        }
      });

      weights.sort((a, b) => a.date.getTime() - b.date.getTime());

      const startWeight = weights[0]?.weight;
      const currentWeight = weights[weights.length - 1]?.weight;
      const change = startWeight && currentWeight ? currentWeight - startWeight : 0;

      return {
        data: weights,
        startWeight,
        currentWeight,
        change,
        changePercent: startWeight ? (change / startWeight) * 100 : 0,
      };
    }),

  // Get weekly summary
  getWeeklySummary: protectedProcedure.query(({ ctx }) => {
    const userId = ctx.session.user.id;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const weekMetrics: DailyMetrics[] = [];

    dailyMetrics.forEach((metrics, key) => {
      if (key.startsWith(userId)) {
        const metricsDate = new Date(metrics.date);
        if (metricsDate >= startDate && metricsDate <= endDate) {
          weekMetrics.push(metrics);
        }
      }
    });

    const trainingDays = weekMetrics.filter((m) => m.trainingCompleted).length;
    const avgEnergy =
      weekMetrics.reduce((sum, m) => sum + (m.energyLevel || 0), 0) /
      (weekMetrics.length || 1);
    const avgSleep =
      weekMetrics.reduce((sum, m) => sum + (m.sleepHours || 0), 0) /
      (weekMetrics.length || 1);
    const avgWater =
      weekMetrics.reduce((sum, m) => sum + (m.waterMl || 0), 0) /
      (weekMetrics.length || 1);

    return {
      daysTracked: weekMetrics.length,
      trainingDays,
      avgEnergy: Math.round(avgEnergy * 10) / 10,
      avgSleep: Math.round(avgSleep * 10) / 10,
      avgWater: Math.round(avgWater),
    };
  }),

  // Get streaks
  getStreaks: protectedProcedure.query(({ ctx }) => {
    const userId = ctx.session.user.id;
    
    // For demo, return mock data
    return {
      mealLogging: { current: 7, longest: 14 },
      training: { current: 3, longest: 10 },
      hydration: { current: 5, longest: 12 },
    };
  }),
});
