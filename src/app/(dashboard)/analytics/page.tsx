// src/app/(dashboard)/analytics/page.tsx

"use client";

import { api } from "~/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Flame,
  Target,
  Calendar,
  Activity,
  Droplet,
  Moon,
} from "lucide-react";

export default function AnalyticsPage() {
  const { data: weightProgress } = api.analytics.getWeightProgress.useQuery({
    days: 30,
  });

  const { data: weeklyStats } = api.analytics.getWeeklySummary.useQuery();

  const { data: streaks } = api.analytics.getStreaks.useQuery();

  const { data: nutritionNeeds } = api.user.getNutritionNeeds.useQuery();

  const getTrendIcon = (change: number) => {
    if (change > 0.1) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (change < -0.1) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Suis ta progression et identifie tes axes d'amélioration
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="weight">Poids</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Série actuelle
                </CardTitle>
                <Flame className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {streaks?.mealLogging.current || 0} jours
                </div>
                <p className="text-xs text-muted-foreground">
                  Record: {streaks?.mealLogging.longest || 0} jours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Jours suivis
                </CardTitle>
                <Calendar className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {weeklyStats?.daysTracked || 0}/7
                </div>
                <Progress
                  value={((weeklyStats?.daysTracked || 0) / 7) * 100}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Entraînements
                </CardTitle>
                <Activity className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {weeklyStats?.trainingDays || 0}/7
                </div>
                <p className="text-xs text-muted-foreground">cette semaine</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Énergie moy.
                </CardTitle>
                <Target className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {weeklyStats?.avgEnergy || 0}/10
                </div>
                <p className="text-xs text-muted-foreground">cette semaine</p>
              </CardContent>
            </Card>
          </div>

          {/* Streaks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Séries
              </CardTitle>
              <CardDescription>
                Maintiens tes habitudes pour progresser
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Repas</span>
                    <Flame className="h-4 w-4 text-orange-500" />
                  </div>
                  <p className="mt-2 text-2xl font-bold">
                    {streaks?.mealLogging.current || 0} jours
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Record: {streaks?.mealLogging.longest || 0}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Entraînement</span>
                    <Activity className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="mt-2 text-2xl font-bold">
                    {streaks?.training.current || 0} jours
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Record: {streaks?.training.longest || 0}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Hydratation</span>
                    <Droplet className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="mt-2 text-2xl font-bold">
                    {streaks?.hydration.current || 0} jours
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Record: {streaks?.hydration.longest || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Résumé de la semaine</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4 text-indigo-500" />
                      <span>Sommeil moyen</span>
                    </div>
                    <span className="font-bold">
                      {weeklyStats?.avgSleep || 0}h
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplet className="h-4 w-4 text-blue-500" />
                      <span>Eau moyenne</span>
                    </div>
                    <span className="font-bold">
                      {weeklyStats?.avgWater || 0}ml
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center rounded-lg bg-muted p-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-primary">
                      {Math.round(
                        ((weeklyStats?.daysTracked || 0) / 7) * 100
                      )}
                      %
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Compliance hebdo
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weight" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Évolution du poids</CardTitle>
              <CardDescription>Suivi sur les 30 derniers jours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-sm text-muted-foreground">Poids initial</p>
                  <p className="text-2xl font-bold">
                    {weightProgress?.startWeight || "-"} kg
                  </p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-sm text-muted-foreground">Poids actuel</p>
                  <p className="text-2xl font-bold">
                    {weightProgress?.currentWeight || "-"} kg
                  </p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-sm text-muted-foreground">Variation</p>
                  <div className="flex items-center justify-center gap-2">
                    {getTrendIcon(weightProgress?.change || 0)}
                    <p className="text-2xl font-bold">
                      {weightProgress?.change
                        ? `${weightProgress.change > 0 ? "+" : ""}${weightProgress.change.toFixed(1)}`
                        : "-"}{" "}
                      kg
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-muted p-8 text-center">
                <p className="text-muted-foreground">
                  📊 Graphique d'évolution
                </p>
                <p className="text-sm text-muted-foreground">
                  (Implémentation avec Recharts)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nutrition" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Objectifs nutritionnels</CardTitle>
              <CardDescription>
                Tes besoins calculés scientifiquement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nutritionNeeds ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">BMR</p>
                      <p className="text-2xl font-bold">
                        {nutritionNeeds.bmr} kcal
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Métabolisme de base
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">TDEE</p>
                      <p className="text-2xl font-bold">
                        {nutritionNeeds.tdee} kcal
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Dépense totale
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-primary/10 p-4">
                    <p className="text-center text-sm font-medium">
                      Objectif journalier
                    </p>
                    <p className="text-center text-3xl font-bold text-primary">
                      {nutritionNeeds.dailyCalories} kcal
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-sm text-muted-foreground">Protéines</p>
                      <p className="text-xl font-bold text-red-600">
                        {nutritionNeeds.proteinG}g
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {nutritionNeeds.proteinPercent}%
                      </p>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-sm text-muted-foreground">Glucides</p>
                      <p className="text-xl font-bold text-amber-600">
                        {nutritionNeeds.carbsG}g
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {nutritionNeeds.carbsPercent}%
                      </p>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-sm text-muted-foreground">Lipides</p>
                      <p className="text-xl font-bold text-yellow-600">
                        {nutritionNeeds.fatG}g
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {nutritionNeeds.fatPercent}%
                      </p>
                    </div>
                  </div>

                  {nutritionNeeds.validation &&
                    nutritionNeeds.validation.warnings.length > 0 && (
                      <div className="rounded-lg bg-yellow-50 p-4">
                        <p className="font-medium text-yellow-800">
                          ⚠️ Attention
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                          {nutritionNeeds.validation.warnings.map((w, i) => (
                            <li key={i}>• {w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p>Configure ton profil pour voir tes besoins</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
