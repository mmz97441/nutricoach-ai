// src/app/(dashboard)/meals/page.tsx

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Plus,
  Search,
  Trash2,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Dumbbell,
  Loader2,
} from "lucide-react";
import { mealCreateSchema, type MealCreateInput } from "~/schemas";
import type { Food, MealType } from "~/types/nutrition";

const mealTypeConfig: Record<
  MealType,
  { label: string; icon: React.ReactNode }
> = {
  breakfast: { label: "Petit-déjeuner", icon: <Coffee className="h-4 w-4" /> },
  lunch: { label: "Déjeuner", icon: <Sun className="h-4 w-4" /> },
  dinner: { label: "Dîner", icon: <Moon className="h-4 w-4" /> },
  snack: { label: "Snack", icon: <Cookie className="h-4 w-4" /> },
  pre_workout: { label: "Pré-entraînement", icon: <Dumbbell className="h-4 w-4" /> },
  post_workout: { label: "Post-entraînement", icon: <Dumbbell className="h-4 w-4" /> },
};

interface SelectedFood {
  food: Food;
  quantity: number;
}

export default function MealsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMealType, setSelectedMealType] = useState<MealType>("lunch");
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  const utils = api.useUtils();

  // Fetch all foods
  const { data: allFoods } = api.food.getAll.useQuery();

  // Search foods
  const { data: searchResults } = api.food.search.useQuery(
    { query: searchQuery, limit: 10 },
    { enabled: searchQuery.length >= 2 }
  );

  // Create meal mutation
  const createMeal = api.meal.create.useMutation({
    onSuccess: () => {
      setSelectedFoods([]);
      utils.meal.dailySummary.invalidate();
      setIsAdding(false);
    },
  });

  // Today's meals
  const { data: todayMeals } = api.meal.dailySummary.useQuery({
    date: new Date(),
  });

  const displayFoods = searchQuery.length >= 2 ? searchResults : allFoods;

  const addFood = (food: Food) => {
    const existing = selectedFoods.find((sf) => sf.food.id === food.id);
    if (existing) {
      setSelectedFoods(
        selectedFoods.map((sf) =>
          sf.food.id === food.id ? { ...sf, quantity: sf.quantity + 100 } : sf
        )
      );
    } else {
      setSelectedFoods([...selectedFoods, { food, quantity: 100 }]);
    }
  };

  const updateQuantity = (foodId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedFoods(selectedFoods.filter((sf) => sf.food.id !== foodId));
    } else {
      setSelectedFoods(
        selectedFoods.map((sf) =>
          sf.food.id === foodId ? { ...sf, quantity } : sf
        )
      );
    }
  };

  const removeFood = (foodId: string) => {
    setSelectedFoods(selectedFoods.filter((sf) => sf.food.id !== foodId));
  };

  const calculateTotals = () => {
    return selectedFoods.reduce(
      (acc, { food, quantity }) => {
        const factor = quantity / 100;
        return {
          calories: acc.calories + food.calories * factor,
          protein: acc.protein + food.proteinG * factor,
          carbs: acc.carbs + food.carbsG * factor,
          fat: acc.fat + food.fatG * factor,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const handleSaveMeal = async () => {
    if (selectedFoods.length === 0) return;

    setIsAdding(true);
    createMeal.mutate({
      date: new Date(),
      mealType: selectedMealType,
      foods: selectedFoods.map((sf) => ({
        foodId: sf.food.id,
        quantity: sf.quantity,
        unit: "g" as const,
      })),
    });
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Repas</h1>
        <p className="text-muted-foreground">
          Ajoute et gère tes repas du jour
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Add Meal Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Ajouter un repas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Meal Type Selection */}
            <div className="space-y-2">
              <Label>Type de repas</Label>
              <Select
                value={selectedMealType}
                onValueChange={(v) => setSelectedMealType(v as MealType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(mealTypeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        {config.icon}
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Food Search */}
            <div className="space-y-2">
              <Label>Rechercher un aliment</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Poulet, riz, brocoli..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Food Results */}
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border">
              {displayFoods && displayFoods.length > 0 ? (
                displayFoods.map((food) => (
                  <button
                    key={food.id}
                    onClick={() => addFood(food)}
                    className="flex w-full items-center justify-between p-2 text-left hover:bg-muted"
                  >
                    <div>
                      <p className="font-medium">{food.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {food.calories} kcal / 100g
                      </p>
                    </div>
                    <Plus className="h-4 w-4 text-primary" />
                  </button>
                ))
              ) : (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  {searchQuery.length < 2
                    ? "Tape au moins 2 caractères"
                    : "Aucun résultat"}
                </p>
              )}
            </div>

            {/* Selected Foods */}
            {selectedFoods.length > 0 && (
              <div className="space-y-2">
                <Label>Aliments sélectionnés</Label>
                <div className="space-y-2 rounded-md border p-2">
                  {selectedFoods.map(({ food, quantity }) => (
                    <div
                      key={food.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="flex-1 truncate text-sm">
                        {food.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) =>
                            updateQuantity(food.id, parseInt(e.target.value) || 0)
                          }
                          className="w-20 text-center"
                          min={0}
                          step={10}
                        />
                        <span className="text-sm text-muted-foreground">g</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFood(food.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            {selectedFoods.length > 0 && (
              <div className="rounded-md bg-muted p-3">
                <p className="mb-2 font-medium">Total</p>
                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                  <div>
                    <p className="font-bold text-orange-600">
                      {Math.round(totals.calories)}
                    </p>
                    <p className="text-xs text-muted-foreground">kcal</p>
                  </div>
                  <div>
                    <p className="font-bold text-red-600">
                      {Math.round(totals.protein)}g
                    </p>
                    <p className="text-xs text-muted-foreground">Prot</p>
                  </div>
                  <div>
                    <p className="font-bold text-amber-600">
                      {Math.round(totals.carbs)}g
                    </p>
                    <p className="text-xs text-muted-foreground">Gluc</p>
                  </div>
                  <div>
                    <p className="font-bold text-yellow-600">
                      {Math.round(totals.fat)}g
                    </p>
                    <p className="text-xs text-muted-foreground">Lip</p>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <Button
              onClick={handleSaveMeal}
              disabled={selectedFoods.length === 0 || isAdding}
              className="w-full"
            >
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer le repas"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Today's Meals */}
        <Card>
          <CardHeader>
            <CardTitle>Repas du jour</CardTitle>
            <CardDescription>
              {todayMeals?.mealCount || 0} repas -{" "}
              {Math.round(todayMeals?.totals.dailyCalories || 0)} kcal
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todayMeals?.meals && todayMeals.meals.length > 0 ? (
              <div className="space-y-3">
                {todayMeals.meals.map((meal) => {
                  const config = mealTypeConfig[meal.mealType as MealType];
                  return (
                    <div key={meal.id} className="rounded-lg border p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {config?.icon}
                          <span className="font-medium">{config?.label}</span>
                        </div>
                        <span className="font-bold">
                          {meal.totalCalories} kcal
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {meal.foods.map((food, i) => (
                          <p key={i}>
                            • {food.name} ({food.quantity}g)
                          </p>
                        ))}
                      </div>
                      <div className="mt-2 flex gap-4 text-xs">
                        <span className="text-red-600">
                          P: {meal.totalProtein}g
                        </span>
                        <span className="text-amber-600">
                          G: {meal.totalCarbs}g
                        </span>
                        <span className="text-yellow-600">
                          L: {meal.totalFat}g
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>Aucun repas enregistré aujourd'hui</p>
                <p className="text-sm">
                  Utilise le formulaire pour ajouter ton premier repas
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
