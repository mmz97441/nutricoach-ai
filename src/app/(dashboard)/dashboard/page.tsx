// src/app/(dashboard)/dashboard/page.tsx

"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import {
  Flame,
  Beef,
  Wheat,
  Droplet,
  Plus,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Trophy,
  Activity,
  Moon,
} from "lucide-react";
import Link from "next/link";
import { formatDate, formatNumber, addDays, isToday } from "~/lib/utils";

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch data
  const { data: dailySummary, isLoading: summaryLoading } =
    api.meal.dailySummary.useQuery({ date: selectedDate });

  const { data: nutritionNeeds } = api.user.getNutritionNeeds.useQuery();

  const { data: dailyTip } = api.ai.getDailyTip.useQuery({
    goalType: "muscle_gain", // Default, should come from user profile
  });

  const { data: weeklyStats } = api.analytics.getWeeklySummary.useQuery();

  const { data: streaks } = api.analytics.getStreaks.useQuery();

  // Navigation
  const goToPreviousDay = () => setSelectedDate(addDays(selectedDate, -1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(new Date());

  // Calculate progress
  const targets = nutritionNeeds || {
    dailyCalories: 2500,
    proteinG: 150,
    carbsG: 300,
    fatG: 80,
  };

  const totals = dailySummary?.totals || {
    dailyCalories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
  };

  const progress = {
    calories: Math.min((totals.dailyCalories / targets.dailyCalories) * 100, 100),
    protein: Math.min((totals.proteinG / targets.proteinG) * 100, 100),
    carbs: Math.min((totals.carbsG / targets.carbsG) * 100, 100),
    fat: Math.min((totals.fatG / targets.fatG) * 100, 100),
  };

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[200px] text-center">
            <h2 className="text-lg font-semibold">
              {isToday(selectedDate) ? "Aujourd'hui" : formatDate(selectedDate)}
            </h2>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextDay}
            disabled={isToday(selectedDate)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {!isToday(selectedDate) && (
          <Button variant="ghost" onClick={goToToday}>
            Aujourd'hui
          </Button>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Calories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Calories</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(totals.dailyCalories)}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / {formatNumber(targets.dailyCalories)} kcal
              </span>
            </div>
            <Progress value={progress.calories} className="mt-2" />
            <p className="mt-1 text-xs text-muted-foreground">
              {formatNumber(targets.dailyCalories - totals.dailyCalories)} restantes
            </p>
          </CardContent>
        </Card>

        {/* Protéines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Protéines</CardTitle>
            <Beef className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(totals.proteinG)}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / {formatNumber(targets.proteinG)}g
              </span>
            </div>
            <Progress value={progress.protein} className="mt-2" />
          </CardContent>
        </Card>

        {/* Glucides */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Glucides</CardTitle>
            <Wheat className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(totals.carbsG)}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / {formatNumber(targets.carbsG)}g
              </span>
            </div>
            <Progress value={progress.carbs} className="mt-2" />
          </CardContent>
        </Card>

        {/* Lipides */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lipides</CardTitle>
            <Droplet className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(totals.fatG)}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / {formatNumber(targets.fatG)}g
              </span>
            </div>
            <Progress value={progress.fat} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* AI Tip + Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* AI Tip */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Conseil du jour
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyTip ? (
              <div className="space-y-3">
                <p className="font-medium">{dailyTip.recommendation}</p>
                <p className="text-sm text-muted-foreground">
                  {dailyTip.reasoning}
                </p>
                {dailyTip.actionItems && dailyTip.actionItems.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {dailyTip.actionItems.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <span className="text-primary">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Chargement...</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/meals">
              <Button className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" />
                Ajouter un repas
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Activity className="h-4 w-4" />
              Logger entraînement
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Droplet className="h-4 w-4" />
              Ajouter eau
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Meals of the day */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Repas du jour</CardTitle>
            <CardDescription>
              {dailySummary?.mealCount || 0} repas enregistrés
            </CardDescription>
          </div>
          <Link href="/meals">
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {dailySummary?.meals && dailySummary.meals.length > 0 ? (
            <div className="space-y-3">
              {dailySummary.meals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium capitalize">{meal.mealType}</p>
                    <p className="text-sm text-muted-foreground">
                      {meal.foods.map((f) => f.name).join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{meal.totalCalories} kcal</p>
                    <p className="text-xs text-muted-foreground">
                      P: {meal.totalProtein}g | G: {meal.totalCarbs}g | L:{" "}
                      {meal.totalFat}g
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p>Aucun repas enregistré</p>
              <Link href="/meals">
                <Button variant="link">Ajouter ton premier repas</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Série</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
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
            <CardTitle className="text-sm font-medium">Entraînements</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
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
            <CardTitle className="text-sm font-medium">Sommeil moy.</CardTitle>
            <Moon className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {weeklyStats?.avgSleep || 0}h
            </div>
            <p className="text-xs text-muted-foreground">cette semaine</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
