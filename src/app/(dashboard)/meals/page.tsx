// src/app/(dashboard)/meals/page.tsx

"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Search, Plus, Trash2, Loader2, Utensils } from "lucide-react";

interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image?: string;
}

interface MealFood {
  food: FoodItem;
  quantity: number;
}

const mealTypes = [
  { value: "breakfast", label: "🌅 Petit-déjeuner" },
  { value: "lunch", label: "🍽️ Déjeuner" },
  { value: "dinner", label: "🌙 Dîner" },
  { value: "snack", label: "🍎 Collation" },
  { value: "pre_workout", label: "💪 Pré-entraînement" },
  { value: "post_workout", label: "🏋️ Post-entraînement" },
];

export default function MealsPage() {
  const [selectedMealType, setSelectedMealType] = useState("lunch");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFoods, setSelectedFoods] = useState<MealFood[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const { data: nutritionNeeds } = api.user.getNutritionNeeds.useQuery();

  // Recherche d'aliments
  useEffect(() => {
    const searchFoods = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/foods?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        setSearchResults(data.foods || []);
      } catch (error) {
        console.error("Erreur recherche:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchFoods, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Charger aliments de base au démarrage
  useEffect(() => {
    const loadBasicFoods = async () => {
      try {
        const response = await fetch("/api/foods");
        const data = await response.json();
        setSearchResults(data.foods || []);
      } catch (error) {
        console.error("Erreur chargement aliments:", error);
      }
    };
    loadBasicFoods();
  }, []);

  const addFood = (food: FoodItem) => {
    const quantity = quantities[food.id] || 100;
    setSelectedFoods((prev) => [...prev, { food, quantity }]);
    setQuantities((prev) => ({ ...prev, [food.id]: 100 }));
  };

  const removeFood = (index: number) => {
    setSelectedFoods((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, quantity: number) => {
    setSelectedFoods((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity } : item))
    );
  };

  // Calcul des totaux
  const totals = selectedFoods.reduce(
    (acc, { food, quantity }) => {
      const ratio = quantity / 100;
      return {
        calories: acc.calories + food.calories * ratio,
        protein: acc.protein + food.protein * ratio,
        carbs: acc.carbs + food.carbs * ratio,
        fat: acc.fat + food.fat * ratio,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const saveMeal = () => {
    // TODO: Sauvegarder le repas en base
    alert(`Repas enregistré !\n\n${Math.round(totals.calories)} kcal\nP: ${Math.round(totals.protein)}g | G: ${Math.round(totals.carbs)}g | L: ${Math.round(totals.fat)}g`);
    setSelectedFoods([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🍽️ Mes Repas</h1>
        <p className="text-muted-foreground">
          Recherche parmi des milliers d'aliments français
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recherche d'aliments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Rechercher un aliment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Type de repas</Label>
              <Select value={selectedMealType} onValueChange={setSelectedMealType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mealTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ex: boeuf, riz, poulet, banane..."
                  className="pl-10"
                />
              </div>
            </div>

            {/* Résultats de recherche */}
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {isSearching && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}

              {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
                <p className="text-center text-muted-foreground p-4">
                  Aucun aliment trouvé
                </p>
              )}

              {!isSearching &&
                searchResults.map((food) => (
                  <div
                    key={food.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{food.name}</p>
                      {food.brand && (
                        <p className="text-xs text-muted-foreground truncate">{food.brand}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {food.calories} kcal • P:{food.protein}g G:{food.carbs}g L:{food.fat}g
                        <span className="text-xs"> /100g</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Input
                        type="number"
                        min={1}
                        max={1000}
                        value={quantities[food.id] || 100}
                        onChange={(e) =>
                          setQuantities((prev) => ({
                            ...prev,
                            [food.id]: parseInt(e.target.value) || 100,
                          }))
                        }
                        className="w-16 text-center"
                      />
                      <span className="text-xs text-muted-foreground">g</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addFood(food)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Repas en cours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              {mealTypes.find((t) => t.value === selectedMealType)?.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedFoods.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                <Utensils className="mx-auto h-8 w-8 mb-2" />
                <p>Ajoute des aliments à ton repas</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedFoods.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg bg-muted p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.food.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {Math.round((item.food.calories * item.quantity) / 100)} kcal
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Input
                          type="number"
                          min={1}
                          max={1000}
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(index, parseInt(e.target.value) || 100)
                          }
                          className="w-16 text-center"
                        />
                        <span className="text-xs text-muted-foreground">g</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFood(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totaux */}
                <div className="rounded-lg bg-primary/10 p-4">
                  <h4 className="font-semibold mb-2">Total du repas</h4>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-xl font-bold">{Math.round(totals.calories)}</p>
                      <p className="text-xs text-muted-foreground">kcal</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-red-500">{Math.round(totals.protein)}g</p>
                      <p className="text-xs text-muted-foreground">Protéines</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-amber-500">{Math.round(totals.carbs)}g</p>
                      <p className="text-xs text-muted-foreground">Glucides</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-yellow-500">{Math.round(totals.fat)}g</p>
                      <p className="text-xs text-muted-foreground">Lipides</p>
                    </div>
                  </div>

                  {nutritionNeeds && (
                    <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                      <p>
                        Ce repas représente{" "}
                        <strong>{Math.round((totals.calories / nutritionNeeds.dailyCalories) * 100)}%</strong>{" "}
                        de tes besoins journaliers ({nutritionNeeds.dailyCalories} kcal)
                      </p>
                    </div>
                  )}
                </div>

                <Button onClick={saveMeal} className="w-full">
                  Enregistrer le repas
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}