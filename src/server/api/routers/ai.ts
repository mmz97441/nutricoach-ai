// src/server/api/routers/ai.ts

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import type { AIRecommendation, ChatMessage } from "~/types/ai";

// In-memory stores
const recommendations = new Map<string, AIRecommendation>();
const chatHistory = new Map<string, ChatMessage[]>();

// Fallback recommendations (used when AI is not available)
const fallbackRecommendations: Record<string, AIRecommendation> = {
  weight_loss: {
    id: "fallback-1",
    type: "daily_tip",
    recommendation:
      "Assure-toi de consommer suffisamment de protéines (1.8-2g/kg) pour préserver ta masse musculaire pendant la perte de poids.",
    reasoning:
      "Les protéines augmentent la satiété et préservent le muscle en déficit calorique (ISSN 2017).",
    actionItems: [
      "Vise 30g de protéines par repas principal",
      "Ajoute une source de protéines à chaque snack",
    ],
    confidence: 0.9,
    sources: ["International Society of Sports Nutrition, 2017"],
    createdAt: new Date(),
  },
  muscle_gain: {
    id: "fallback-2",
    type: "daily_tip",
    recommendation:
      "Répartis tes protéines sur 4-5 repas pour maximiser la synthèse protéique musculaire.",
    reasoning:
      "La synthèse protéique est stimulée toutes les 3-4h (Schoenfeld, 2018).",
    actionItems: [
      "Consomme 0.4g/kg de protéines par repas",
      "Inclus une collation protéinée 2h avant le coucher",
    ],
    confidence: 0.9,
    sources: ["Schoenfeld et al., 2018 - Journal of ISSN"],
    createdAt: new Date(),
  },
  maintenance: {
    id: "fallback-3",
    type: "daily_tip",
    recommendation:
      "Maintiens un apport régulier en fibres pour optimiser ta digestion et ta satiété.",
    reasoning:
      "Les fibres ralentissent la digestion et aident à maintenir un poids stable (EFSA).",
    actionItems: [
      "Vise 25-30g de fibres par jour",
      "Ajoute des légumes à chaque repas",
    ],
    confidence: 0.85,
    sources: ["EFSA - European Food Safety Authority"],
    createdAt: new Date(),
  },
  performance: {
    id: "fallback-4",
    type: "daily_tip",
    recommendation:
      "Adapte tes glucides à ton entraînement : plus les jours d'effort, moins les jours de repos.",
    reasoning:
      "La périodisation glucidique optimise les performances et la récupération (Burke, 2019).",
    actionItems: [
      "Jour entraînement : +20% glucides",
      "Jour repos : privilégie les protéines et lipides",
    ],
    confidence: 0.88,
    sources: ["Burke et al., 2019 - Sports Medicine"],
    createdAt: new Date(),
  },
};

export const aiRouter = createTRPCRouter({
  // Get daily tip
  getDailyTip: protectedProcedure
    .input(
      z.object({
        goalType: z.enum([
          "weight_loss",
          "muscle_gain",
          "performance",
          "maintenance",
        ]),
      })
    )
    .query(({ input }) => {
      // In production, this would call Claude API
      // For demo, return fallback recommendation
      const tip = fallbackRecommendations[input.goalType] || fallbackRecommendations.maintenance;
      
      return {
        ...tip,
        id: `tip-${Date.now()}`,
        createdAt: new Date(),
      };
    }),

  // Generate meal suggestion
  suggestMeal: protectedProcedure
    .input(
      z.object({
        mealType: z.enum([
          "breakfast",
          "lunch",
          "dinner",
          "snack",
          "pre_workout",
          "post_workout",
        ]),
        targetCalories: z.number(),
        restrictions: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ input }) => {
      // In production, this would call Claude API
      // For demo, return static suggestions
      const suggestions: Record<string, { name: string; description: string }[]> = {
        breakfast: [
          {
            name: "Porridge protéiné",
            description:
              "80g flocons d'avoine, 30g whey, 1 banane, 10g amandes",
          },
          {
            name: "Œufs brouillés complets",
            description:
              "3 œufs, 2 tranches pain complet, avocat, tomate",
          },
        ],
        lunch: [
          {
            name: "Bowl poulet quinoa",
            description:
              "150g poulet grillé, 100g quinoa, légumes rôtis, sauce tahini",
          },
          {
            name: "Salade méditerranéenne",
            description:
              "Thon, pois chiches, concombre, tomate, feta, huile d'olive",
          },
        ],
        dinner: [
          {
            name: "Saumon légumes",
            description:
              "150g saumon au four, brocolis vapeur, riz complet",
          },
          {
            name: "Poulet curry léger",
            description:
              "Poulet au curry coco light, riz basmati, épinards",
          },
        ],
        snack: [
          {
            name: "Yaourt protéiné",
            description: "200g fromage blanc 0%, fruits rouges, granola",
          },
          {
            name: "Shake récupération",
            description: "30g whey, 1 banane, lait d'amande",
          },
        ],
        pre_workout: [
          {
            name: "Snack énergie",
            description: "1 banane, 20g beurre de cacahuète, galettes de riz",
          },
        ],
        post_workout: [
          {
            name: "Récupération express",
            description: "40g whey, 1 banane, 30g flocons d'avoine",
          },
        ],
      };

      const mealSuggestions = suggestions[input.mealType] || suggestions.snack;
      return mealSuggestions;
    }),

  // Chat with AI nutritionist
  chat: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      // Get or create chat history
      const history = chatHistory.get(userId) || [];
      
      // Add user message
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: input.message,
        timestamp: new Date(),
      };
      history.push(userMessage);

      // In production, this would call Claude API
      // For demo, return static response
      const responses: Record<string, string> = {
        default:
          "Je suis ton assistant nutrition ! Pose-moi des questions sur ton alimentation, tes macros, ou comment optimiser tes performances sportives. 💪",
        protein:
          "Pour optimiser ta prise de muscle, vise 1.8-2.2g de protéines par kg de poids de corps. Répartis cet apport sur 4-5 repas pour maximiser la synthèse protéique.",
        carbs:
          "Les glucides sont ton carburant principal ! Adapte ta consommation à ton activité : plus les jours d'entraînement, moins les jours de repos.",
        fat: "Les lipides sont essentiels pour tes hormones. Vise 0.8-1g par kg, en privilégiant les sources de qualité : huile d'olive, avocat, poissons gras.",
        water:
          "L'hydratation est cruciale ! Vise 30-40ml par kg de poids de corps, plus 500ml par heure d'entraînement.",
      };

      let responseContent = responses.default;
      const lowerMessage = input.message.toLowerCase();
      
      if (lowerMessage.includes("protéine") || lowerMessage.includes("protein")) {
        responseContent = responses.protein;
      } else if (lowerMessage.includes("glucide") || lowerMessage.includes("carb")) {
        responseContent = responses.carbs;
      } else if (lowerMessage.includes("lipide") || lowerMessage.includes("gras") || lowerMessage.includes("fat")) {
        responseContent = responses.fat;
      } else if (lowerMessage.includes("eau") || lowerMessage.includes("hydrat")) {
        responseContent = responses.water;
      }

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: responseContent,
        timestamp: new Date(),
      };
      history.push(assistantMessage);

      // Save history
      chatHistory.set(userId, history.slice(-50)); // Keep last 50 messages

      return assistantMessage;
    }),

  // Get chat history
  getChatHistory: protectedProcedure.query(({ ctx }) => {
    return chatHistory.get(ctx.session.user.id) || [];
  }),

  // Clear chat history
  clearChatHistory: protectedProcedure.mutation(({ ctx }) => {
    chatHistory.delete(ctx.session.user.id);
    return { success: true };
  }),

  // Provide feedback on recommendation
  provideFeedback: protectedProcedure
    .input(
      z.object({
        recommendationId: z.string(),
        applied: z.boolean(),
        feedbackScore: z.number().min(1).max(5).optional(),
        feedbackText: z.string().max(500).optional(),
      })
    )
    .mutation(({ input }) => {
      // In production, store feedback for AI improvement
      console.log("Feedback received:", input);
      return { success: true };
    }),
});
