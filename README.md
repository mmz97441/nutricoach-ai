# NutriCoach AI - Application de Nutrition Sportive

Application web full-stack de coaching nutritionnel personnalisé par IA pour sportifs.

## 🚀 Stack Technique

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **API**: tRPC v11 (type-safe end-to-end)
- **UI**: Tailwind CSS + shadcn/ui
- **State**: TanStack Query + Zustand
- **Forms**: React Hook Form + Zod
- **AI**: Claude 3.5 Sonnet (Anthropic SDK)

## 📁 Structure du Projet

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Routes authentification
│   ├── (dashboard)/       # Routes protégées
│   └── api/trpc/          # API tRPC
├── components/            # Composants React
│   ├── ui/               # Composants shadcn
│   ├── dashboard/        # Composants dashboard
│   └── meals/            # Composants repas
├── server/api/           # Backend tRPC
│   └── routers/          # Routers API
├── lib/                  # Utilitaires
│   ├── nutrition/        # Calculs nutritionnels
│   └── ai/               # Intégration IA
├── schemas/              # Schemas Zod
├── types/                # Types TypeScript
└── trpc/                 # Client tRPC
```

## 🏃 Démarrage Rapide

### Prérequis

- Node.js 18+
- npm ou pnpm

### Installation

```bash
# Cloner le repo
git clone <repo-url>
cd nutrition-ai-app

# Installer les dépendances
npm install

# Copier les variables d'environnement
cp .env.example .env

# Lancer en développement
npm run dev
```

L'application sera disponible sur http://localhost:3000

## 🔧 Configuration

### Variables d'Environnement

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# AI
ANTHROPIC_API_KEY="sk-ant-..."
```

## 📊 Fonctionnalités

### MVP (Phase 1)

- ✅ Authentification (email/OAuth)
- ✅ Profil utilisateur & objectifs
- ✅ Calculs nutritionnels (BMR, TDEE, macros)
- ✅ Suivi des repas
- ✅ Dashboard quotidien

### Phase 2

- ✅ Conseils IA quotidiens
- ✅ Analytics & progression
- ✅ Gamification (streaks, achievements)
- 🔄 Plans repas générés par IA

### Phase 3

- 🔜 Scan code-barres
- 🔜 Chatbot nutritionnel
- 🔜 Export données
- 🔜 PWA mobile

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests E2E
npm run test:e2e
```

## 📦 Déploiement

### Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel
```

## 🔬 Calculs Scientifiques

### BMR (Mifflin-St Jeor)

```
Homme: (10 × poids[kg]) + (6.25 × taille[cm]) − (5 × âge) + 5
Femme: (10 × poids[kg]) + (6.25 × taille[cm]) − (5 × âge) − 161
```

### TDEE

```
TDEE = BMR × Facteur d'activité × Facteur sport
```

### Protéines

- Prise de masse: 2.2g/kg
- Perte de poids: 2.0g/kg
- Maintenance: 1.8g/kg

## 📄 License

MIT

## 🙏 Crédits

- Données nutritionnelles: CIQUAL (France)
- IA: Claude 3.5 Sonnet (Anthropic)
- UI: shadcn/ui
