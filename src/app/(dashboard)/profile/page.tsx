// src/app/(dashboard)/profile/page.tsx

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { profileSchema, goalSchema, type ProfileInput, type GoalInput } from "~/schemas";
import { User, Target, Activity, Loader2, Check } from "lucide-react";

const sportTypes = [
  { value: "running", label: "Course à pied" },
  { value: "cycling", label: "Cyclisme" },
  { value: "weightlifting", label: "Musculation" },
  { value: "crossfit", label: "CrossFit" },
  { value: "swimming", label: "Natation" },
  { value: "team_sports", label: "Sports collectifs" },
  { value: "combat", label: "Sports de combat" },
  { value: "other", label: "Autre" },
];

const sportLevels = [
  { value: "beginner", label: "Débutant" },
  { value: "intermediate", label: "Intermédiaire" },
  { value: "advanced", label: "Avancé" },
  { value: "elite", label: "Élite" },
];

const activityLevels = [
  { value: "sedentary", label: "Sédentaire (peu d'exercice)" },
  { value: "light", label: "Léger (1-3x/semaine)" },
  { value: "moderate", label: "Modéré (3-5x/semaine)" },
  { value: "active", label: "Actif (6-7x/semaine)" },
  { value: "very_active", label: "Très actif (2x/jour)" },
];

const goalTypes = [
  { value: "weight_loss", label: "Perte de poids", description: "Perdre du gras tout en préservant le muscle" },
  { value: "muscle_gain", label: "Prise de masse", description: "Gagner du muscle avec un surplus calorique" },
  { value: "performance", label: "Performance", description: "Optimiser les performances sportives" },
  { value: "maintenance", label: "Maintien", description: "Maintenir ton poids et ta forme actuels" },
];

export default function ProfilePage() {
  const [profileSaved, setProfileSaved] = useState(false);
  const [goalSaved, setGoalSaved] = useState(false);
  const [age, setAge] = useState<number>(30);

  const utils = api.useUtils();

  const { data: currentProfile } = api.user.getProfile.useQuery();
  const { data: currentGoal } = api.user.getGoal.useQuery();
  const { data: nutritionNeeds } = api.user.getNutritionNeeds.useQuery();

  const updateProfile = api.user.updateProfile.useMutation({
    onSuccess: () => {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
      utils.user.getNutritionNeeds.invalidate();
      utils.user.getProfile.invalidate();
    },
  });

  const setGoal = api.user.setGoal.useMutation({
    onSuccess: () => {
      setGoalSaved(true);
      setTimeout(() => setGoalSaved(false), 2000);
      utils.user.getNutritionNeeds.invalidate();
      utils.user.getGoal.invalidate();
    },
  });

  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      heightCm: currentProfile?.heightCm || 175,
      weightKg: currentProfile?.weightKg || 75,
      sportType: currentProfile?.sportType || "weightlifting",
      sportLevel: currentProfile?.sportLevel || "intermediate",
      trainingFrequency: currentProfile?.trainingFrequency || 4,
      activityLevel: currentProfile?.activityLevel || "moderate",
      gender: currentProfile?.gender || "male",
    },
  });

  const goalForm = useForm<GoalInput>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      type: currentGoal?.type || "maintenance",
      weeklyRate: currentGoal?.weeklyRate || 0.5,
    },
  });

  const onProfileSubmit = (data: ProfileInput) => {
    // Créer une date de naissance à partir de l'âge
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - age);
    
    updateProfile.mutate({
      ...data,
      birthDate: birthDate,
    });
  };

  const onGoalSubmit = (data: GoalInput) => {
    setGoal.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profil</h1>
        <p className="text-muted-foreground">
          Configure ton profil pour des recommandations personnalisées
        </p>
      </div>

      {/* Résumé des besoins calculés */}
      {nutritionNeeds && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">📊 Tes besoins calculés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{nutritionNeeds.dailyCalories}</p>
                <p className="text-sm text-muted-foreground">kcal/jour</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{nutritionNeeds.proteinG}g</p>
                <p className="text-sm text-muted-foreground">Protéines</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-500">{nutritionNeeds.carbsG}g</p>
                <p className="text-sm text-muted-foreground">Glucides</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-500">{nutritionNeeds.fatG}g</p>
                <p className="text-sm text-muted-foreground">Lipides</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-2">
            <Target className="h-4 w-4" />
            Objectifs
          </TabsTrigger>
          <TabsTrigger value="health" className="gap-2">
            <Activity className="h-4 w-4" />
            Santé
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Ces données permettent de calculer tes besoins nutritionnels précis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                className="space-y-4"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Genre */}
                  <div className="space-y-2">
                    <Label htmlFor="gender">Genre *</Label>
                    <Select
                      value={profileForm.watch("gender")}
                      onValueChange={(v) =>
                        profileForm.setValue("gender", v as "male" | "female")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">👨 Homme</SelectItem>
                        <SelectItem value="female">👩 Femme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Âge */}
                  <div className="space-y-2">
                    <Label htmlFor="age">Âge *</Label>
                    <Input
                      id="age"
                      type="number"
                      min={16}
                      max={100}
                      value={age}
                      onChange={(e) => setAge(parseInt(e.target.value) || 30)}
                      placeholder="30"
                    />
                  </div>

                  {/* Taille */}
                  <div className="space-y-2">
                    <Label htmlFor="heightCm">Taille (cm) *</Label>
                    <Input
                      id="heightCm"
                      type="number"
                      min={100}
                      max={250}
                      {...profileForm.register("heightCm", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>

                  {/* Poids */}
                  <div className="space-y-2">
                    <Label htmlFor="weightKg">Poids (kg) *</Label>
                    <Input
                      id="weightKg"
                      type="number"
                      step="0.1"
                      min={30}
                      max={300}
                      {...profileForm.register("weightKg", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>

                  {/* Sport */}
                  <div className="space-y-2">
                    <Label htmlFor="sportType">Sport principal *</Label>
                    <Select
                      value={profileForm.watch("sportType")}
                      onValueChange={(v) =>
                        profileForm.setValue("sportType", v as any)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sportTypes.map((sport) => (
                          <SelectItem key={sport.value} value={sport.value}>
                            {sport.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Niveau */}
                  <div className="space-y-2">
                    <Label htmlFor="sportLevel">Niveau *</Label>
                    <Select
                      value={profileForm.watch("sportLevel")}
                      onValueChange={(v) =>
                        profileForm.setValue("sportLevel", v as any)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sportLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Fréquence */}
                  <div className="space-y-2">
                    <Label htmlFor="trainingFrequency">
                      Entraînements par semaine *
                    </Label>
                    <Input
                      id="trainingFrequency"
                      type="number"
                      min={0}
                      max={14}
                      {...profileForm.register("trainingFrequency", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>

                  {/* Activité */}
                  <div className="space-y-2">
                    <Label htmlFor="activityLevel">Niveau d'activité *</Label>
                    <Select
                      value={profileForm.watch("activityLevel")}
                      onValueChange={(v) =>
                        profileForm.setValue("activityLevel", v as any)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {activityLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="w-full"
                >
                  {updateProfile.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : profileSaved ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Enregistré !
                    </>
                  ) : (
                    "Enregistrer le profil"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle>Objectifs</CardTitle>
              <CardDescription>
                Choisis ton objectif pour adapter tes apports nutritionnels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={goalForm.handleSubmit(onGoalSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Type d'objectif *</Label>
                  <div className="grid gap-3 md:grid-cols-2">
                    {goalTypes.map((goal) => (
                      <button
                        key={goal.value}
                        type="button"
                        onClick={() =>
                          goalForm.setValue("type", goal.value as any)
                        }
                        className={`rounded-lg border p-4 text-left transition-colors ${
                          goalForm.watch("type") === goal.value
                            ? "border-primary bg-primary/10"
                            : "hover:bg-muted"
                        }`}
                      >
                        <p className="font-medium">{goal.label}</p>
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {goalForm.watch("type") === "weight_loss" && (
                  <div className="space-y-2">
                    <Label htmlFor="weeklyRate">
                      Rythme de perte (kg/semaine)
                    </Label>
                    <Select
                      value={String(goalForm.watch("weeklyRate"))}
                      onValueChange={(v) =>
                        goalForm.setValue("weeklyRate", parseFloat(v))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.25">
                          0.25 kg/sem (très progressif, recommandé)
                        </SelectItem>
                        <SelectItem value="0.5">0.5 kg/sem (modéré)</SelectItem>
                        <SelectItem value="0.75">0.75 kg/sem (rapide)</SelectItem>
                        <SelectItem value="1">1 kg/sem (intensif, difficile)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      💡 Une perte progressive préserve mieux la masse musculaire
                    </p>
                  </div>
                )}

                {goalForm.watch("type") === "muscle_gain" && (
                  <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                    💪 Pour la prise de masse, nous ajoutons +300 kcal à tes besoins de base avec un focus sur les protéines (2.2g/kg)
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={setGoal.isPending}
                  className="w-full"
                >
                  {setGoal.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : goalSaved ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Enregistré !
                    </>
                  ) : (
                    "Définir l'objectif"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health">
          <Card>
            <CardHeader>
              <CardTitle>Informations santé</CardTitle>
              <CardDescription>
                Ces informations aident à personnaliser les recommandations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Allergies alimentaires</Label>
                  <Input placeholder="Ex: arachides, fruits à coque, crustacés..." />
                </div>

                <div className="space-y-2">
                  <Label>Intolérances</Label>
                  <Input placeholder="Ex: lactose, gluten..." />
                </div>

                <div className="space-y-2">
                  <Label>Régime alimentaire</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner (optionnel)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun régime particulier</SelectItem>
                      <SelectItem value="vegetarian">Végétarien</SelectItem>
                      <SelectItem value="vegan">Végan</SelectItem>
                      <SelectItem value="pescetarian">Pescétarien</SelectItem>
                      <SelectItem value="halal">Halal</SelectItem>
                      <SelectItem value="kosher">Casher</SelectItem>
                      <SelectItem value="keto">Keto / Low-carb</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Conditions médicales / Blessures</Label>
                  <Input placeholder="Ex: diabète, hypertension, tendinite..." />
                  <p className="text-xs text-muted-foreground">
                    Ces informations permettent d'adapter les recommandations
                  </p>
                </div>

                <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                  ⚠️ Les conseils fournis par NutriCoach AI ne remplacent pas
                  l'avis d'un professionnel de santé. Consulte un médecin ou
                  un diététicien pour tout problème de santé.
                </div>

                <Button className="w-full">Enregistrer</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}