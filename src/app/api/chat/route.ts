// src/app/api/chat/route.ts

import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import {
  getUserMemory,
  saveConversation,
  saveNutritionPlan,
  getFullContext,
} from "~/server/db/memory";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { message, history, userProfile, userId = "demo-user" } = await request.json();

    const memoryContext = getFullContext(userId);
    const memory = getUserMemory(userId);
    const isFirstConversation = memory.conversations.length === 0;
    const hasNutritionPlan = !!memory.nutritionPlan;

    // Déterminer le genre pour adapter le langage
    const isMale = userProfile?.gender === "male";
    const genderWord = isMale ? "Homme" : "Femme";
    const genderAdjective = isMale ? "" : "e"; // pour "motivé/motivée"

    let userContext = "";
    if (userProfile) {
      userContext = `
=== PROFIL ATHLÈTE ===
👤 IDENTITÉ :
- Genre : ${genderWord}
- Âge : ${userProfile.age} ans
- Poids actuel : ${userProfile.weightKg} kg
- Taille : ${userProfile.heightCm} cm
- IMC : ${(userProfile.weightKg / Math.pow(userProfile.heightCm / 100, 2)).toFixed(1)}

🏃 ACTIVITÉ SPORTIVE :
- Sport principal : ${userProfile.sportType}
- Niveau : ${userProfile.sportLevel}
- Fréquence : ${userProfile.trainingFrequency}x par semaine
- Niveau d'activité général : ${userProfile.activityLevel}

🎯 OBJECTIF :
- Type : ${userProfile.goalType || "Non défini"}
${userProfile.weeklyRate ? `- Rythme visé : ${userProfile.weeklyRate} kg/semaine` : ""}

📊 BESOINS NUTRITIONNELS (calculés selon son profil) :
- Calories : ${userProfile.dailyCalories} kcal/jour
- Protéines : ${userProfile.proteinG}g (${Math.round((userProfile.proteinG * 4 / userProfile.dailyCalories) * 100)}%)
- Glucides : ${userProfile.carbsG}g (${Math.round((userProfile.carbsG * 4 / userProfile.dailyCalories) * 100)}%)
- Lipides : ${userProfile.fatG}g (${Math.round((userProfile.fatG * 9 / userProfile.dailyCalories) * 100)}%)

⚠️ RESTRICTIONS :
${userProfile.allergies?.length ? `- Allergies : ${userProfile.allergies.join(", ")}` : "- Allergies : Aucune"}
${userProfile.intolerances?.length ? `- Intolérances : ${userProfile.intolerances.join(", ")}` : "- Intolérances : Aucune"}
${userProfile.dietaryRestrictions?.length ? `- Régime : ${userProfile.dietaryRestrictions.join(", ")}` : "- Régime : Aucun"}
${userProfile.medicalConditions?.length ? `- Conditions médicales : ${userProfile.medicalConditions.join(", ")}` : ""}
`;
    }

    const systemPrompt = `Tu es le COACH NUTRITION PERSONNEL de cet${isMale ? "" : "te"} athlète. Tu le/la suis sur le long terme.

${userContext}

${memoryContext}

=== RÈGLES DE COMMUNICATION ===
TRÈS IMPORTANT - FORMAT DE TES RÉPONSES :
1. N'utilise PAS de markdown avec ** ou * 
2. Écris en texte simple et lisible
3. Pour les listes, utilise des tirets simples ou des emojis
4. Structure tes réponses avec des sauts de ligne
5. Sois concis et va droit au but

EXEMPLE DE BON FORMAT :
"
Salut ! Voici ton plan pour demain :

🍳 Petit-déjeuner (450 kcal)
→ 80g flocons d'avoine
→ 200ml lait demi-écrémé
→ 1 banane
→ 20g beurre de cacahuète

🥗 Déjeuner (650 kcal)
→ 150g blanc de poulet
→ 200g riz complet
→ Légumes verts à volonté

...
"

=== TON RÔLE ===
Tu es SON coach personnel qui :
1. Se souvient de TOUT (conversations passées, préférences)
2. Adapte les conseils à son âge (${userProfile?.age || "?"} ans), son sexe (${genderWord}), et son sport
3. Propose un programme concret et actionnable
4. Utilise un ton motivant et bienveillant

=== ADAPTATION SELON LE PROFIL ===
${userProfile?.age && userProfile.age < 25 ? "→ Personne jeune : métabolisme rapide, besoins énergétiques élevés" : ""}
${userProfile?.age && userProfile.age >= 25 && userProfile.age < 40 ? "→ Adulte actif : équilibre entre performance et récupération" : ""}
${userProfile?.age && userProfile.age >= 40 ? "→ Personne mature : attention à la récupération, protéines importantes pour préserver la masse musculaire" : ""}
${!isMale ? "→ Femme : attention aux besoins en fer, adapter selon le cycle si pertinent, besoins caloriques généralement plus bas" : ""}
${isMale ? "→ Homme : besoins protéiques et caloriques généralement plus élevés" : ""}

=== COMPORTEMENT ===
${isFirstConversation ? `
PREMIÈRE CONVERSATION !
→ Accueille-le/la chaleureusement
→ Mentionne que tu as vu son profil (${genderWord}, ${userProfile?.age} ans, ${userProfile?.sportType})
→ Propose directement un plan nutrition adapté
→ Demande ses préférences alimentaires
` : ""}

${!hasNutritionPlan ? `
PAS ENCORE DE PLAN !
→ Propose un plan journée type MAINTENANT
→ Avec quantités en grammes
→ Adapté à ses ${userProfile?.dailyCalories} kcal/jour
` : ""}

=== RÈGLES STRICTES ===
1. JAMAIS moins de 1200 kcal/jour
2. JAMAIS de conseils médicaux
3. Toujours respecter les allergies/intolérances
4. Quantités TOUJOURS en grammes
5. Ingrédients disponibles en France

Réponds maintenant de manière claire et bien formatée.`;

    const messages = [
      ...history.slice(-20),
      { role: "user" as const, content: message },
    ];

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system: systemPrompt,
      messages: messages,
    });

    const assistantResponse =
      response.content[0].type === "text"
        ? response.content[0].text
        : "Désolé, je n'ai pas pu générer de réponse.";

    const fullHistory = [...history, 
      { role: "user", content: message },
      { role: "assistant", content: assistantResponse }
    ];
    
    const topics = extractTopics(message + " " + assistantResponse);
    saveConversation(userId, fullHistory, generateSummary(message), topics);

    if (assistantResponse.includes("Petit-déjeuner") || 
        assistantResponse.includes("Déjeuner") ||
        assistantResponse.includes("Dîner") ||
        assistantResponse.includes("petit-déjeuner")) {
      saveNutritionPlan(userId, assistantResponse);
    }

    detectAndSavePreferences(userId, message);

    return NextResponse.json({ response: assistantResponse });
  } catch (error) {
    console.error("Erreur API Chat:", error);
    return NextResponse.json(
      { response: "Erreur serveur. Vérifie ta clé API Anthropic dans le fichier .env" },
      { status: 500 }
    );
  }
}

function extractTopics(text: string): string[] {
  const topics: string[] = [];
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes("plan") || lowerText.includes("programme")) topics.push("plan");
  if (lowerText.includes("petit-déj")) topics.push("petit-déjeuner");
  if (lowerText.includes("déjeuner") || lowerText.includes("midi")) topics.push("déjeuner");
  if (lowerText.includes("dîner") || lowerText.includes("soir")) topics.push("dîner");
  if (lowerText.includes("collation") || lowerText.includes("snack")) topics.push("collations");
  if (lowerText.includes("protéine")) topics.push("protéines");
  if (lowerText.includes("recette")) topics.push("recettes");
  if (lowerText.includes("course")) topics.push("courses");
  
  return topics;
}

function generateSummary(userMessage: string): string {
  return userMessage.length > 100 
    ? userMessage.substring(0, 100) + "..." 
    : userMessage;
}

function detectAndSavePreferences(userId: string, userMessage: string): void {
  const lowerMessage = userMessage.toLowerCase();
  const memory = getUserMemory(userId);
  
  const likePatterns = [
    /j'adore (?:le |la |les )?(\w+)/g,
    /j'aime (?:bien )?(?:le |la |les )?(\w+)/g,
  ];
  
  const dislikePatterns = [
    /je n'aime pas (?:le |la |les )?(\w+)/g,
    /je déteste (?:le |la |les )?(\w+)/g,
    /pas de (\w+)/g,
  ];

  likePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(lowerMessage)) !== null) {
      const food = match[1];
      if (food && !memory.preferences.likedFoods.includes(food)) {
        memory.preferences.likedFoods.push(food);
      }
    }
  });

  dislikePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(lowerMessage)) !== null) {
      const food = match[1];
      if (food && !memory.preferences.dislikedFoods.includes(food)) {
        memory.preferences.dislikedFoods.push(food);
      }
    }
  });
}