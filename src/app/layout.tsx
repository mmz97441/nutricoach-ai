// src/app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "NutriCoach AI - Nutrition Sportive Personnalisée",
  description:
    "Application de coaching nutritionnel personnalisé par IA pour sportifs. Calculs scientifiques, plans alimentaires automatiques, suivi quotidien.",
  keywords: [
    "nutrition sportive",
    "coaching IA",
    "macros",
    "calories",
    "musculation",
    "perte de poids",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
