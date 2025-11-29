// src/app/api/foods/route.ts

import { NextResponse } from "next/server";
import { searchFoods, getFoodByBarcode, BASIC_FOODS } from "~/lib/food/openfoodfacts";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const barcode = searchParams.get("barcode");
  const page = parseInt(searchParams.get("page") || "1");

  // Recherche par code-barres
  if (barcode) {
    const food = await getFoodByBarcode(barcode);
    if (food) {
      return NextResponse.json({ foods: [food], total: 1, page: 1 });
    }
    return NextResponse.json({ foods: [], total: 0, page: 1 });
  }

  // Recherche par texte
  if (query) {
    // D'abord chercher dans les aliments de base (plus rapide)
    const basicResults = BASIC_FOODS.filter(f =>
      f.name.toLowerCase().includes(query.toLowerCase())
    );

    // Ensuite chercher sur OpenFoodFacts
    const offResults = await searchFoods(query, page);

    // Combiner les résultats (aliments de base en premier)
    const combined = [...basicResults, ...offResults.foods];
    
    // Dédupliquer par nom similaire
    const seen = new Set<string>();
    const unique = combined.filter(f => {
      const key = f.name.toLowerCase().substring(0, 20);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({
      foods: unique.slice(0, 30),
      total: offResults.total + basicResults.length,
      page,
    });
  }

  // Sans recherche, retourner les aliments de base
  return NextResponse.json({
    foods: BASIC_FOODS,
    total: BASIC_FOODS.length,
    page: 1,
  });
}