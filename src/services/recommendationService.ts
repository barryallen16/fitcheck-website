// Recommendation Engine Service
import type { WardrobeItem, OutfitRecommendation, WeatherData } from "@/types";
import { findBestMatch, attributeBasedMatching } from "./fashionCLIPService";

// Generate daily outfit recommendation
export async function generateDailyRecommendation(
  wardrobe: WardrobeItem[],
  weather: WeatherData,
  usedItems: string[] = [],
): Promise<OutfitRecommendation | null> {
  if (wardrobe.length < 2) {
    return null;
  }

  // Filter out recently used items
  const availableItems = wardrobe.filter(
    (item) => !usedItems.includes(item.id),
  );
  const itemsToConsider =
    availableItems.length >= 2 ? availableItems : wardrobe;

  // Select a random top garment (Kurti, Top, etc.)
  // 1. Top categories (Added Shirt, Cape, Dress, etc.)
  const topCategories = [
    "Kurti",
    "Top",
    "Saree",
    "Sherwani",
    "Blazer",
    "Jacket",
    "Camisole",
    "Tunic",
    "Shirt",
    "Cape",
    "Dress",
  ];

  // ... scroll down to bottom fallback ...
  // 2. Add Western bottoms (further down in the file)
  const topItems = itemsToConsider.filter((item) =>
    topCategories.some((cat) =>
      item.analysis.category.toLowerCase().includes(cat.toLowerCase()),
    ),
  );

  if (topItems.length === 0) {
    // Fallback: use any item as top
    topItems.push(...itemsToConsider);
  }

  const selectedTop = topItems[Math.floor(Math.random() * topItems.length)];

  // Find matching bottom using FashionCLIP or fallback
  let matchingBottom: WardrobeItem | null = null;

  try {
    matchingBottom = await findBestMatch(
      selectedTop.analysis.pairing_attributes,
      itemsToConsider,
      selectedTop.id,
    );
  } catch (error) {
    console.log("Falling back to attribute-based matching");
    // Fallback matching

    // 2. Bottom categories (Added Pants, Jeans, Skirt)
    const bottomCategories = [
      "Palazzo",
      "Churidar",
      "Salwar",
      "Lehenga",
      "Bottom",
      "Skirt",
      "Jeans",
      "Pants",
    ];
    for (const category of bottomCategories) {
      matchingBottom = attributeBasedMatching(
        selectedTop.analysis.pairing_attributes,
        itemsToConsider,
        category,
        selectedTop.id,
      );
      if (matchingBottom) break;
    }
  }

  // If no match found, pick any other item
  if (!matchingBottom) {
    const otherItems = itemsToConsider.filter(
      (item) => item.id !== selectedTop.id,
    );
    if (otherItems.length > 0) {
      matchingBottom =
        otherItems[Math.floor(Math.random() * otherItems.length)];
    }
  }

  if (!matchingBottom) {
    return null;
  }

  // Generate recommendation logic
  const colorLogic = generateColorLogic(
    selectedTop.analysis.analyzed_garment,
    matchingBottom.analysis.analyzed_garment,
  );

  const silhouetteLogic = generateSilhouetteLogic(
    selectedTop.analysis.category,
    matchingBottom.analysis.category,
  );

  return {
    id: `rec-${Date.now()}`,
    topGarment: selectedTop,
    bottomGarment: matchingBottom,
    colorLogic,
    silhouetteLogic,
    occasion: getOccasionFromOutfit(selectedTop, matchingBottom),
    weather: weather.recommendation,
    createdAt: new Date(),
  };
}

// Generate color coordination logic
function generateColorLogic(topDesc: string, bottomDesc: string): string {
  const topColors = extractColors(topDesc);
  const bottomColors = extractColors(bottomDesc);

  const colorCombos: Record<string, string> = {
    "red-gold": "Red and gold create a classic festive combination.",
    "blue-silver": "Blue and silver offer an elegant, cool-toned pairing.",
    "green-gold": "Green and gold evoke natural beauty and prosperity.",
    "pink-white": "Pink and white create a soft, feminine aesthetic.",
    "maroon-beige": "Maroon and beige balance richness with subtlety.",
    "black-gold": "Black and gold provide a sophisticated, timeless look.",
    "yellow-orange":
      "Yellow and orange create a vibrant, energetic combination.",
  };

  const key = `${topColors[0]}-${bottomColors[0]}`;
  const reverseKey = `${bottomColors[0]}-${topColors[0]}`;

  return (
    colorCombos[key] ||
    colorCombos[reverseKey] ||
    "The colors complement each other beautifully, creating a harmonious look."
  );
}

// Generate silhouette coordination logic
function generateSilhouetteLogic(
  topCategory: string,
  bottomCategory: string,
): string {
  const combos: Record<string, string> = {
    "Kurti-Palazzo":
      "The flowing Palazzo balances the structured Kurti for elegant comfort.",
    "Kurti-Churidar":
      "The fitted Churidar accentuates the Kurti's length and detail.",
    "Kurti-Salwar":
      "Classic pairing offering traditional elegance and ease of movement.",
    "Top-Lehenga":
      "The flared Lehenga creates a dramatic silhouette with the fitted top.",
    "Saree-": "The draped Saree offers timeless grace and versatility.",
    "Sherwani-Churidar":
      "The fitted Churidar complements the structured Sherwani perfectly.",
  };

  const key = `${topCategory}-${bottomCategory}`;
  return (
    combos[key] ||
    "The silhouettes work together to create a balanced, flattering look."
  );
}

// Extract colors from description
function extractColors(description: string): string[] {
  const colorList = [
    "red",
    "blue",
    "green",
    "yellow",
    "orange",
    "purple",
    "pink",
    "black",
    "white",
    "gold",
    "silver",
    "maroon",
    "beige",
    "brown",
    "grey",
    "gray",
    "mustard",
    "teal",
    "navy",
    "coral",
    "peach",
    "lavender",
    "mint",
    "crimson",
    "charcoal",
    "ivory",
    "cream",
    "turquoise",
    "magenta",
  ];

  const desc_lower = description.toLowerCase();
  return colorList.filter((color) => desc_lower.includes(color));
}

// Determine occasion from outfit
function getOccasionFromOutfit(
  top: WardrobeItem,
  bottom: WardrobeItem,
): string {
  const combined =
    `${top.analysis.analyzed_garment} ${bottom.analysis.analyzed_garment}`.toLowerCase();

  if (
    combined.includes("silk") ||
    combined.includes("brocade") ||
    combined.includes("zari")
  ) {
    return "Wedding, Festival, or Special Occasion";
  }

  if (combined.includes("cotton") || combined.includes("casual")) {
    return "Daily Wear, Office, or Casual Outing";
  }

  if (combined.includes("embroidered") || combined.includes("sequin")) {
    return "Party, Celebration, or Evening Event";
  }

  return "Versatile - Suitable for Multiple Occasions";
}

// Get recommendation history from localStorage
export function getRecommendationHistory(): string[] {
  try {
    const history = localStorage.getItem("fitcheck-recommendation-history");
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

// Save recommendation to history
export function saveRecommendationToHistory(recommendationId: string): void {
  try {
    const history = getRecommendationHistory();
    history.push(recommendationId);
    // Keep only last 7 days of history
    const trimmed = history.slice(-14);
    localStorage.setItem(
      "fitcheck-recommendation-history",
      JSON.stringify(trimmed),
    );
  } catch (error) {
    console.error("Error saving recommendation history:", error);
  }
}
