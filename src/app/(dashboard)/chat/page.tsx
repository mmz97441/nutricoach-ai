// src/app/(dashboard)/chat/page.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent } from "~/components/ui/card";
import { Send, Loader2, Bot, User, Trash2, AlertCircle } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Fonction pour formater le markdown en HTML
function formatMessage(text: string): string {
  let formatted = text
    // Gras **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italique *text*
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Listes à puces
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Titres avec emoji
    .replace(/^(#{1,3})\s*(.+)$/gm, '<h3 class="font-bold mt-3 mb-1">$2</h3>')
    // Sauts de ligne
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br/>');
  
  // Envelopper les listes
  formatted = formatted.replace(/(<li>.*<\/li>)+/g, '<ul class="list-disc pl-5 my-2">$&</ul>');
  
  return `<p>${formatted}</p>`;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: profile } = api.user.getProfile.useQuery();
  const { data: goal } = api.user.getGoal.useQuery();
  const { data: nutritionNeeds } = api.user.getNutritionNeeds.useQuery();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (profile && nutritionNeeds && !initialized) {
      setInitialized(true);
      handleAutoStart();
    }
  }, [profile, nutritionNeeds, initialized]);

  const handleAutoStart = async () => {
    setIsLoading(true);
    
    const userProfile = buildUserProfile();
    
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Bonjour, je veux commencer mon suivi nutrition",
          history: [],
          userProfile,
          userId: "demo-user",
        }),
      });

      const data = await response.json();

      setMessages([
        {
          id: "1",
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: "Salut ! 👋 Je suis ton coach nutrition personnel. Comment puis-je t'aider aujourd'hui ?",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const buildUserProfile = () => {
    if (!profile || !nutritionNeeds) return null;
    
    // Calculer l'âge à partir de la date de naissance si disponible
    let age = profile.age;
    if (!age && (profile as any).birthDate) {
      const birthDate = new Date((profile as any).birthDate);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }
    
    return {
      gender: profile.gender,
      age: age || 30,
      weightKg: profile.weightKg,
      heightCm: profile.heightCm,
      sportType: profile.sportType,
      sportLevel: profile.sportLevel,
      trainingFrequency: profile.trainingFrequency,
      activityLevel: profile.activityLevel,
      allergies: (profile as any).allergies || [],
      intolerances: (profile as any).intolerances || [],
      dietaryRestrictions: (profile as any).dietaryRestrictions || [],
      medicalConditions: (profile as any).medicalConditions || [],
      goalType: goal?.type,
      weeklyRate: goal?.weeklyRate,
      dailyCalories: nutritionNeeds.dailyCalories,
      proteinG: nutritionNeeds.proteinG,
      carbsG: nutritionNeeds.carbsG,
      fatG: nutritionNeeds.fatG,
    };
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const userProfile = buildUserProfile();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          userProfile,
          userId: "demo-user",
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Désolé, une erreur s'est produite. Vérifie ta connexion et ta clé API.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInitialized(false);
    setTimeout(() => {
      if (profile && nutritionNeeds) {
        handleAutoStart();
      }
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const profileComplete = profile && goal && nutritionNeeds;

  // Infos profil pour affichage
  const genderLabel = profile?.gender === "male" ? "Homme" : "Femme";
  const ageDisplay = profile?.age || "?";

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🏋️ Mon Coach Nutrition</h1>
          {profileComplete && (
            <p className="text-muted-foreground">
              {genderLabel}, {ageDisplay} ans • {profile.sportType} • {nutritionNeeds.dailyCalories} kcal/jour • Objectif: {goal.type}
            </p>
          )}
          {!profileComplete && (
            <p className="text-muted-foreground">Configure ton profil pour des conseils personnalisés</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={clearChat}>
          <Trash2 className="mr-2 h-4 w-4" />
          Nouvelle conversation
        </Button>
      </div>

      {!profileComplete && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-yellow-50 p-3 text-yellow-800">
          <AlertCircle className="h-5 w-5" />
          <span>
            <strong>Important :</strong> Va dans "Profil" pour renseigner ton âge, sexe, sport et objectifs !
          </span>
        </div>
      )}

      <Card className="flex flex-1 flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.length === 0 && !isLoading && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Chargement de ton coach...
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div 
                      className="text-sm prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                    />
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Ton coach réfléchit...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Demande un plan repas, des recettes, des conseils..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInput("Donne-moi un plan repas complet pour la semaine")}
              disabled={isLoading}
            >
              📅 Plan semaine
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInput("Que manger avant et après mon entraînement ?")}
              disabled={isLoading}
            >
              🏋️ Pré/Post training
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInput("Donne-moi une liste de courses pour la semaine")}
              disabled={isLoading}
            >
              🛒 Liste courses
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInput("Propose-moi des alternatives à mon plan actuel")}
              disabled={isLoading}
            >
              🔄 Alternatives
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}