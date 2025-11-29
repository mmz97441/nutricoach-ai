// src/app/page.tsx

import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Activity,
  Brain,
  ChartLine,
  Dumbbell,
  Salad,
  Trophy,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Salad className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">NutriCoach AI</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link href="/register">
              <Button>Commencer gratuit</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4">
        <section className="py-20 text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight">
            Ton coach nutrition
            <span className="text-primary"> intelligent</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
            Optimise ta nutrition sportive avec l'IA. Plans personnalisés,
            calculs scientifiques, et conseils adaptés à tes objectifs.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                <Activity className="h-5 w-5" />
                Démarrer gratuitement
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">
                En savoir plus
              </Button>
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">2000+</div>
              <div className="text-muted-foreground">Aliments français</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">100%</div>
              <div className="text-muted-foreground">Personnalisé</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">IA</div>
              <div className="text-muted-foreground">Claude 3.5 Sonnet</div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Tout ce qu'il te faut pour progresser
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Brain className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>IA Personnalisée</CardTitle>
                <CardDescription>
                  Conseils quotidiens adaptés à ton profil, tes objectifs et tes
                  performances
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <ChartLine className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Calculs Scientifiques</CardTitle>
                <CardDescription>
                  BMR, TDEE, macros calculés selon les dernières études (Mifflin
                  St-Jeor, ISSN)
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Salad className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Suivi des Repas</CardTitle>
                <CardDescription>
                  Log tes repas facilement avec notre base de 2000+ aliments
                  français
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Dumbbell className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Adapté au Sport</CardTitle>
                <CardDescription>
                  Running, musculation, CrossFit... Les besoins varient selon
                  ton sport
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Trophy className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Gamification</CardTitle>
                <CardDescription>
                  Streaks, achievements, points... Reste motivé et atteins tes
                  objectifs
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Activity className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  Dashboard complet pour suivre ta progression et identifier les
                  axes d'amélioration
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Pricing teaser */}
        <section className="py-20">
          <Card className="mx-auto max-w-lg text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Gratuit pour démarrer</CardTitle>
              <CardDescription>
                Toutes les fonctionnalités essentielles gratuitement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-4xl font-bold">0€</span>
                <span className="text-muted-foreground">/mois</span>
              </div>
              <ul className="mb-6 space-y-2 text-left">
                <li className="flex items-center gap-2">
                  ✓ Suivi repas illimité
                </li>
                <li className="flex items-center gap-2">
                  ✓ Calcul besoins nutritionnels
                </li>
                <li className="flex items-center gap-2">
                  ✓ 3 conseils IA par semaine
                </li>
                <li className="flex items-center gap-2">
                  ✓ Dashboard basique
                </li>
              </ul>
              <Link href="/register">
                <Button className="w-full">Créer mon compte</Button>
              </Link>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="py-20 text-center">
          <h2 className="mb-4 text-3xl font-bold">
            Prêt à optimiser ta nutrition ?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Rejoins des milliers de sportifs qui utilisent NutriCoach AI
          </p>
          <Link href="/register">
            <Button size="lg">Commencer maintenant</Button>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 NutriCoach AI. Tous droits réservés.</p>
          <p className="mt-2">
            Les conseils fournis ne remplacent pas l'avis d'un professionnel de
            santé.
          </p>
        </div>
      </footer>
    </div>
  );
}
