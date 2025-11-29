// src/lib/food/openfoodfacts.ts

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  salt?: number;
  image?: string;
  barcode?: string;
  servingSize?: number;
  servingUnit?: string;
}

interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  product_name_fr?: string;
  brands?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    fiber_100g?: number;
    sugars_100g?: number;
    salt_100g?: number;
  };
  image_url?: string;
  serving_size?: string;
}

/**
 * Recherche des aliments via OpenFoodFacts
 */
export async function searchFoods(query: string, page: number = 1): Promise<{
  foods: FoodItem[];
  total: number;
  page: number;
}> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
        query
      )}&search_simple=1&action=process&json=1&page=${page}&page_size=20&countries_tags=france&lc=fr`,
      { next: { revalidate: 3600 } } // Cache 1h
    );

    if (!response.ok) {
      throw new Error("Erreur OpenFoodFacts");
    }

    const data = await response.json();

    const foods: FoodItem[] = (data.products || [])
      .filter((p: OpenFoodFactsProduct) => {
        // Filtrer les produits sans nom ou sans nutriments
        const hasName = p.product_name_fr || p.product_name;
        const hasNutriments = p.nutriments && p.nutriments["energy-kcal_100g"];
        return hasName && hasNutriments;
      })
      .map((p: OpenFoodFactsProduct) => ({
        id: p.code,
        name: p.product_name_fr || p.product_name || "Inconnu",
        brand: p.brands || undefined,
        calories: Math.round(p.nutriments?.["energy-kcal_100g"] || 0),
        protein: Math.round((p.nutriments?.proteins_100g || 0) * 10) / 10,
        carbs: Math.round((p.nutriments?.carbohydrates_100g || 0) * 10) / 10,
        fat: Math.round((p.nutriments?.fat_100g || 0) * 10) / 10,
        fiber: p.nutriments?.fiber_100g,
        sugar: p.nutriments?.sugars_100g,
        salt: p.nutriments?.salt_100g,
        image: p.image_url,
        barcode: p.code,
      }));

    return {
      foods,
      total: data.count || 0,
      page: data.page || 1,
    };
  } catch (error) {
    console.error("Erreur recherche aliments:", error);
    return { foods: [], total: 0, page: 1 };
  }
}

/**
 * Récupère un aliment par son code-barres
 */
export async function getFoodByBarcode(barcode: string): Promise<FoodItem | null> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return null;
    }

    const p = data.product;

    return {
      id: p.code,
      name: p.product_name_fr || p.product_name || "Inconnu",
      brand: p.brands,
      calories: Math.round(p.nutriments?.["energy-kcal_100g"] || 0),
      protein: Math.round((p.nutriments?.proteins_100g || 0) * 10) / 10,
      carbs: Math.round((p.nutriments?.carbohydrates_100g || 0) * 10) / 10,
      fat: Math.round((p.nutriments?.fat_100g || 0) * 10) / 10,
      fiber: p.nutriments?.fiber_100g,
      sugar: p.nutriments?.sugars_100g,
      salt: p.nutriments?.salt_100g,
      image: p.image_url,
      barcode: p.code,
    };
  } catch (error) {
    console.error("Erreur barcode:", error);
    return null;
  }
}

/**
 * Aliments de base français (fallback sans connexion)
 */
export const BASIC_FOODS: FoodItem[] = [
  { id: "boeuf-hache", name: "Boeuf haché 5%", calories: 137, protein: 26, carbs: 0, fat: 5 },
  { id: "boeuf-hache-15", name: "Boeuf haché 15%", calories: 212, protein: 24, carbs: 0, fat: 15 },
  { id: "steak-boeuf", name: "Steak de boeuf", calories: 271, protein: 26, carbs: 0, fat: 18 },
  { id: "poulet-blanc", name: "Blanc de poulet", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: "cuisse-poulet", name: "Cuisse de poulet", calories: 209, protein: 26, carbs: 0, fat: 11 },
  { id: "escalope-dinde", name: "Escalope de dinde", calories: 135, protein: 30, carbs: 0, fat: 1 },
  { id: "saumon", name: "Saumon", calories: 208, protein: 20, carbs: 0, fat: 13 },
  { id: "thon-naturel", name: "Thon au naturel", calories: 116, protein: 26, carbs: 0, fat: 1 },
  { id: "cabillaud", name: "Cabillaud", calories: 82, protein: 18, carbs: 0, fat: 0.7 },
  { id: "crevettes", name: "Crevettes", calories: 99, protein: 24, carbs: 0, fat: 0.3 },
  { id: "oeuf", name: "Oeuf entier", calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  { id: "blanc-oeuf", name: "Blanc d'oeuf", calories: 52, protein: 11, carbs: 0.7, fat: 0.2 },
  { id: "riz-blanc", name: "Riz blanc cuit", calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { id: "riz-complet", name: "Riz complet cuit", calories: 111, protein: 2.6, carbs: 23, fat: 0.9 },
  { id: "pates", name: "Pâtes cuites", calories: 131, protein: 5, carbs: 25, fat: 1.1 },
  { id: "pates-completes", name: "Pâtes complètes cuites", calories: 124, protein: 5.3, carbs: 23, fat: 1.4 },
  { id: "quinoa", name: "Quinoa cuit", calories: 120, protein: 4.4, carbs: 21, fat: 1.9 },
  { id: "patate-douce", name: "Patate douce cuite", calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  { id: "pomme-de-terre", name: "Pomme de terre cuite", calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  { id: "pain-complet", name: "Pain complet", calories: 247, protein: 9, carbs: 41, fat: 3.4 },
  { id: "flocons-avoine", name: "Flocons d'avoine", calories: 379, protein: 13, carbs: 67, fat: 6.5 },
  { id: "brocoli", name: "Brocoli", calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  { id: "haricots-verts", name: "Haricots verts", calories: 31, protein: 1.8, carbs: 7, fat: 0.1 },
  { id: "epinards", name: "Épinards", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  { id: "courgette", name: "Courgette", calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
  { id: "tomate", name: "Tomate", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  { id: "carotte", name: "Carotte", calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  { id: "poivron", name: "Poivron", calories: 20, protein: 0.9, carbs: 4.6, fat: 0.2 },
  { id: "avocat", name: "Avocat", calories: 160, protein: 2, carbs: 8.5, fat: 15 },
  { id: "banane", name: "Banane", calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  { id: "pomme", name: "Pomme", calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  { id: "orange", name: "Orange", calories: 47, protein: 0.9, carbs: 12, fat: 0.1 },
  { id: "fraises", name: "Fraises", calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
  { id: "myrtilles", name: "Myrtilles", calories: 57, protein: 0.7, carbs: 14, fat: 0.3 },
  { id: "amandes", name: "Amandes", calories: 579, protein: 21, carbs: 22, fat: 49 },
  { id: "noix", name: "Noix", calories: 654, protein: 15, carbs: 14, fat: 65 },
  { id: "beurre-cacahuete", name: "Beurre de cacahuète", calories: 588, protein: 25, carbs: 20, fat: 50 },
  { id: "fromage-blanc-0", name: "Fromage blanc 0%", calories: 46, protein: 8, carbs: 4, fat: 0.2 },
  { id: "fromage-blanc", name: "Fromage blanc 3%", calories: 73, protein: 7.5, carbs: 3.8, fat: 3 },
  { id: "yaourt-grec", name: "Yaourt grec", calories: 97, protein: 9, carbs: 3.6, fat: 5 },
  { id: "skyr", name: "Skyr", calories: 63, protein: 11, carbs: 4, fat: 0.2 },
  { id: "lait-demi", name: "Lait demi-écrémé", calories: 46, protein: 3.2, carbs: 4.8, fat: 1.5 },
  { id: "lait-amande", name: "Lait d'amande", calories: 24, protein: 0.5, carbs: 3, fat: 1.1 },
  { id: "huile-olive", name: "Huile d'olive", calories: 884, protein: 0, carbs: 0, fat: 100 },
  { id: "miel", name: "Miel", calories: 304, protein: 0.3, carbs: 82, fat: 0 },
  { id: "whey", name: "Whey protéine", calories: 400, protein: 80, carbs: 8, fat: 6 },
  { id: "tofu", name: "Tofu", calories: 76, protein: 8, carbs: 1.9, fat: 4.8 },
  { id: "lentilles", name: "Lentilles cuites", calories: 116, protein: 9, carbs: 20, fat: 0.4 },
  { id: "pois-chiches", name: "Pois chiches cuits", calories: 164, protein: 9, carbs: 27, fat: 2.6 },
  { id: "haricots-rouges", name: "Haricots rouges cuits", calories: 127, protein: 9, carbs: 22, fat: 0.5 },
];