// src/server/api/trpc.ts

import { initTRPC, TRPCError } from "@trpc/server";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { ZodError } from "zod";

// Fake session for demo (replace with NextAuth in production)
interface Session {
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

// Context creation
export const createTRPCContext = async (opts: FetchCreateContextFnOptions) => {
  // In production, get session from NextAuth
  // const session = await auth();
  
  // Demo session (remove in production)
  const session: Session | null = {
    user: {
      id: "demo-user-id",
      email: "demo@example.com",
      name: "Demo User",
    },
  };

  return {
    session,
    headers: opts.req.headers,
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

// Public procedure (no auth required)
export const publicProcedure = t.procedure;

// Protected procedure (auth required)
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: ctx.session,
    },
  });
});
