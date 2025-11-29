// src/server/db/memory.ts

// Stockage persistant des conversations et du contexte utilisateur
// En production, utiliser une vraie base de données (PostgreSQL/Redis)

interface UserMemory {
  latestUpdate: Date;
  conversations: ConversationEntry[];
  nutritionPlan?: NutritionPlan;
  preferences: UserPreferences;
  feedback: FeedbackEntry[];
  progressNotes: string[];
}

interface ConversationEntry {
  id: string;
  date: Date;
  messages: { role: "user" | "assistant"; content: string }[];
  summary?: string;
  topics: string[];
}

interface NutritionPlan {
  createdAt: Date;
  updatedAt: Date;
  weeklyPlan: string;
  adjustments: { date: Date; change: string }[];
  status: "active" | "paused" | "completed";
}

interface UserPreferences {
  likedFoods: string[];
  dislikedFoods: string[];
  favoriteRecipes: string[];
  mealPrepDay?: string;
  budget?: "low" | "medium" | "high";
  cookingSkill?: "beginner" | "intermediate" | "advanced";
  timeAvailable?: number;
}

interface FeedbackEntry {
  date: Date;
  type: "positive" | "negative" | "neutral";
  topic: string;
  detail: string;
}

const userMemories = new Map<string, UserMemory>();

export function getUserMemory(userId: string): UserMemory {
  if (!userMemories.has(userId)) {
    userMemories.set(userId, {
      latestUpdate: new Date(),
      conversations: [],
      preferences: {
        likedFoods: [],
        dislikedFoods: [],
        favoriteRecipes: [],
      },
      feedback: [],
      progressNotes: [],
    });
  }
  return userMemories.get(userId)!;
}

export function saveConversation(
  userId: string,
  messages: { role: "user" | "assistant"; content: string }[],
  summary?: string,
  topics?: string[]
): void {
  const memory = getUserMemory(userId);
  
  const today = new Date().toDateString();
  const existingConvo = memory.conversations.find(
    (c) => c.date.toDateString() === today
  );

  if (existingConvo) {
    existingConvo.messages = messages;
    existingConvo.summary = summary;
    existingConvo.topics = topics || [];
  } else {
    memory.conversations.push({
      id: Date.now().toString(),
      date: new Date(),
      messages,
      summary,
      topics: topics || [],
    });
  }

  memory.latestUpdate = new Date();
  userMemories.set(userId, memory);
}

export function saveNutritionPlan(userId: string, plan: string): void {
  const memory = getUserMemory(userId);
  
  if (memory.nutritionPlan) {
    memory.nutritionPlan.weeklyPlan = plan;
    memory.nutritionPlan.updatedAt = new Date();
    memory.nutritionPlan.adjustments.push({
      date: new Date(),
      change: "Plan mis à jour",
    });
  } else {
    memory.nutritionPlan = {
      createdAt: new Date(),
      updatedAt: new Date(),
      weeklyPlan: plan,
      adjustments: [],
      status: "active",
    };
  }
  
  userMemories.set(userId, memory);
}

export function updatePreferences(
  userId: string,
  prefs: Partial<UserPreferences>
): void {
  const memory = getUserMemory(userId);
  memory.preferences = { ...memory.preferences, ...prefs };
  userMemories.set(userId, memory);
}

export function addFeedback(
  userId: string,
  feedback: Omit<FeedbackEntry, "date">
): void {
  const memory = getUserMemory(userId);
  memory.feedback.push({ ...feedback, date: new Date() });
  userMemories.set(userId, memory);
}

export function addProgressNote(userId: string, note: string): void {
  const memory = getUserMemory(userId);
  memory.progressNotes.push(`[${new Date().toLocaleDateString("fr-FR")}] ${note}`);
  userMemories.set(userId, memory);
}

export function getConversationHistory(
  userId: string,
  lastN: number = 5
): string {
  const memory = getUserMemory(userId);
  const recentConvos = memory.conversations.slice(-lastN);

  if (recentConvos.length === 0) return "Aucune conversation précédente.";

  return recentConvos
    .map((c) => {
      const date = c.date.toLocaleDateString("fr-FR");
      const topicsStr = c.topics.length > 0 ? ` (${c.topics.join(", ")})` : "";
      return `[${date}]${topicsStr}: ${c.summary || "Conversation sans résumé"}`;
    })
    .join("\n");
}

export function getFullContext(userId: string): string {
  const memory = getUserMemory(userId);
  
  let context = "";
  
  if (memory.nutritionPlan) {
    context += `\n=== PLAN NUTRITION ACTUEL ===\n`;
    context += `Créé le: ${memory.nutritionPlan.createdAt.toLocaleDateString("fr-FR")}\n`;
    context += `Dernière mise à jour: ${memory.nutritionPlan.updatedAt.toLocaleDateString("fr-FR")}\n`;
    context += `${memory.nutritionPlan.weeklyPlan}\n`;
    
    if (memory.nutritionPlan.adjustments.length > 0) {
      context += `\nAjustements récents:\n`;
      memory.nutritionPlan.adjustments.slice(-3).forEach((a) => {
        context += `- ${a.date.toLocaleDateString("fr-FR")}: ${a.change}\n`;
      });
    }
  }
  
  const prefs = memory.preferences;
  if (prefs.likedFoods.length > 0 || prefs.dislikedFoods.length > 0) {
    context += `\n=== PRÉFÉRENCES ALIMENTAIRES ===\n`;
    if (prefs.likedFoods.length > 0) {
      context += `Aime: ${prefs.likedFoods.join(", ")}\n`;
    }
    if (prefs.dislikedFoods.length > 0) {
      context += `N'aime pas: ${prefs.dislikedFoods.join(", ")}\n`;
    }
    if (prefs.favoriteRecipes.length > 0) {
      context += `Recettes favorites: ${prefs.favoriteRecipes.join(", ")}\n`;
    }
    if (prefs.cookingSkill) {
      context += `Niveau cuisine: ${prefs.cookingSkill}\n`;
    }
    if (prefs.timeAvailable) {
      context += `Temps dispo par repas: ${prefs.timeAvailable} min\n`;
    }
  }
  
  if (memory.feedback.length > 0) {
    context += `\n=== RETOURS RÉCENTS ===\n`;
    memory.feedback.slice(-5).forEach((f) => {
      context += `- [${f.type}] ${f.topic}: ${f.detail}\n`;
    });
  }
  
  if (memory.progressNotes.length > 0) {
    context += `\n=== NOTES DE PROGRESSION ===\n`;
    memory.progressNotes.slice(-5).forEach((n) => {
      context += `${n}\n`;
    });
  }
  
  const convHistory = getConversationHistory(userId, 5);
  if (convHistory !== "Aucune conversation précédente.") {
    context += `\n=== CONVERSATIONS PRÉCÉDENTES ===\n${convHistory}\n`;
  }
  
  return context;
}
