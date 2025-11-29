// src/server/api/root.ts

import { createTRPCRouter, createCallerFactory } from "./trpc";
import { userRouter } from "./routers/user";
import { mealRouter, foodRouter } from "./routers/meal";
import { aiRouter } from "./routers/ai";
import { analyticsRouter } from "./routers/analytics";

export const appRouter = createTRPCRouter({
  user: userRouter,
  meal: mealRouter,
  food: foodRouter,
  ai: aiRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
