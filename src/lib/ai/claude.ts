// src/lib/ai/claude.ts

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-20250514";

interface UserContext {
  profile: {
    sportType: string;
    sportLevel: string;
    age: number;
    gender: string;
    weightKg: number;
    heightCm: number;
  };
  goal: {
    type: string;
    weeklyRate?: number;
  };
  todayMeals?: {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
  };
  targets: {
    dailyCalories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
}

/**
 * Génère un conseil nutritionnel personnalisé avec Claude
 */
export async function generateDailyTip(context: UserContext): Promise<{
  recommendation: string;
  reasoning: string;
  actionItems: string[];
  confidence: number;
}> {
  const systemPrompt = `Tu es un nutritionniste sportif expert et bienveillant. Tu parles en français avec un ton motivant.

RÈGLES DE SÉCURITÉ STRICTES :
1. JAMAIS recommander moins de 1200 kcal/jour
2. JAMAIS recommander une perte de plus de 1kg/semaine
3. TOUJOURS être positif et encourageant
4. TOUJOURS baser tes conseils sur la science (études peer-reviewed)
5. JAMAIS donner d'avis médical

STYLE : Tutoiement, phrases courtes, zéro culpabilisation, encourageant.

Réponds UNIQUEMENT en JSON valide avec cette structure :
{
  "recommendation": "Conseil court et actionnable (max 100 mots)",
  "reasoning": "Explication scientifique simple (max 150 mots)",
  "actionItems": ["Action concrète 1", "Action concrète 2"],
  "confidence": 0.85
}`;

  const todayProgress = context.todayMeals
    ? `
PROGRESSION AUJOURD'HUI :
- Calories : ${context.todayMeals.totalCalories} / ${context.targets.dailyCalories} kcal
- Protéines : ${context.todayMeals.totalProtein} / ${context.targets.proteinG}g
- Glucides : ${context.todayMeals.totalCarbs} / ${context.targets.carbsG}g
- Lipides : ${context.todayMeals.totalFat} / ${context.targets.fatG}g`
    : "Pas encore de repas enregistré aujourd'hui.";

  const userPrompt = `PROFIL UTILISATEUR :
- Sport : ${context.profile.sportType} (niveau ${context.profile.sportLevel})
- ${context.profile.age} ans, ${context.profile.gender}
- Poids : ${context.profile.weightKg}kg, Taille : ${context.profile.heightCm}cm
- Objectif : ${context.goal.type}${context.goal.weeklyRate ? ` (${context.goal.weeklyRate}kg/semaine)` : ""}

OBJECTIFS JOURNALIERS :
- Calories : ${context.targets.dailyCalories} kcal
- Protéines : ${context.targets.proteinG}g
- Glucides : ${context.targets.carbsG}g
- Lipides : ${context.targets.fatG}g

${todayProgress}

Génère un conseil personnalisé et motivant pour aider cet utilisateur à atteindre ses objectifs.`;

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extraire le JSON de la réponse
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Pas de JSON dans la réponse");
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      recommendation: result.recommendation || "Continue comme ça !",
      reasoning: result.reasoning || "",
      actionItems: result.actionItems || [],
      confidence: result.confidence || 0.8,
    };
  } catch (error) {
    console.error("Erreur Claude API:", error);
    // Fallback
    return {
      recommendation:
        "Continue à suivre ton plan nutritionnel et reste régulier dans tes entraînements !",
      reasoning:
        "La régularité est la clé du succès en nutrition sportive.",
      actionItems: [
        "Log tous tes repas aujourd'hui",
        "Bois au moins 2L d'eau",
      ],
      confidence: 0.7,
    };
  }
}

/**
 * Chat avec l'assistant nutritionnel
 */
export async function chatWithAssistant(
  message: string,
  context: UserContext,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const systemPrompt = `Tu es un assistant nutritionnel sportif expert et bienveillant. Tu parles en français.

PROFIL DE L'UTILISATEUR :
- Sport : ${context.profile.sportType} (${context.profile.sportLevel})
- ${context.profile.age} ans, ${context.profile.gender}, ${context.profile.weightKg}kg
- Objectif : ${context.goal.type}
- Besoins : ${context.targets.dailyCalories} kcal, ${context.targets.proteinG}g protéines

RÈGLES :
1. Réponds de manière concise (max 200 mots)
2. Sois encourageant et positif
3. Base tes conseils sur la science
4. JAMAIS d'avis médical
5. Tutoie l'utilisateur

Tu peux aider sur : nutrition, macros, timing des repas, hydratation, récupération, compléments alimentaires.`;

  const messages = [
    ...history.map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    { role: "user" as const, content: message },
  ];

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: systemPrompt,
      messages: messages,
    });

    return response.content[0].type === "text"
      ? response.content[0].text
      : "Désolé, je n'ai pas pu générer de réponse.";
  } catch (error) {
    console.error("Erreur chat Claude:", error);
    return "Désolé, une erreur s'est produite. Réessaie dans quelques instants.";
  }
}

/**
 * Génère un plan repas personnalisé
 */
export async function generateMealPlan(
  context: UserContext,
  days: number = 7
): Promise<string> {
  const systemPrompt = `Tu es un nutritionniste sportif expert. Génère un plan repas détaillé en français.

RÈGLES :
1. Respecte EXACTEMENT les objectifs caloriques et macros
2. Propose des repas variés et savoureux
3. Adapte au sport pratiqué
4. Inclus des options simples et rapides
5. Tiens compte des aliments français courants`;

  const userPrompt = `Crée un plan repas pour ${days} jours.

PROFIL :
- Sport : ${context.profile.sportType}
- Objectif : ${context.goal.type}
- Poids : ${context.profile.weightKg}kg

OBJECTIFS JOURNALIERS :
- Calories : ${context.targets.dailyCalories} kcal
- Protéines : ${context.targets.proteinG}g
- Glucides : ${context.targets.carbsG}g  
- Lipides : ${context.targets.fatG}g

Structure : 3 repas + 2 collations par jour.
Format : Liste claire avec les quantités en grammes.`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    return response.content[0].type === "text"
      ? response.content[0].text
      : "Erreur lors de la génération du plan.";
  } catch (error) {
    console.error("Erreur génération plan:", error);
    return "Erreur lors de la génération du plan repas.";
  }
}
